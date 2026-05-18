import { NextResponse, after } from "next/server";
import { randomUUID } from "node:crypto";
import { diagnosisSubmissionSchema } from "@/types/forms";
import {
  generateDiagnosisAnalysis,
  AnthropicError,
} from "@/lib/anthropic";
import {
  saveDiagnosis,
  updateDiagnosisStatus,
  scheduleEmailSequence,
  isSupabaseConfigured,
  SupabaseWriteError,
} from "@/lib/supabase";
import { sendEmail, isResendConfigured } from "@/lib/resend";
import {
  diagnosisReportEmail,
  internalDiagnosisEmail,
} from "@/lib/email-templates";
import {
  renderDiagnosisPdf,
  diagnosisPdfFilename,
} from "@/lib/pdf/diagnosis-report";
import { describeAnswers } from "@/lib/diagnosis-prompt";
import { buildEmailSequenceItems } from "@/lib/email-sequence";
import { siteConfig } from "@/lib/site";
import { calculateLeadScore } from "@/lib/lead-score";
import { EVENT_VALUE_BRL, leadTier } from "@/lib/tracking/types";
import {
  sendCapiEvent,
  parseFbCookies,
  extractClientIp,
} from "@/lib/server/meta-capi";
import {
  hashEmailServer,
  hashPhoneServer,
  hashNameServer,
  firstNameFromServer,
} from "@/lib/server/hash";
import type {
  DiagnosisAnalysis,
  DiagnosisAnswers,
  PainAreaV2,
} from "@/types/diagnosis";

export const runtime = "nodejs";
// 60s era apertado: Anthropic ~44s + saveDiagnosis/updateStatus + emails
// já estourava 50s. Subindo pra 90s dá margem em horários ruins do
// Anthropic e cobre cold starts do Fluid Compute.
export const maxDuration = 90;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = diagnosisSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Dados inválidos.",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 422 },
    );
  }

  const data = parsed.data;
  const createdAt = new Date().toISOString();

  const answers: DiagnosisAnswers = {
    q1_size: data.q1_size as DiagnosisAnswers["q1_size"],
    q2_erp: data.q2_erp as DiagnosisAnswers["q2_erp"],
    q3_client_profile:
      data.q3_client_profile as DiagnosisAnswers["q3_client_profile"],
    q4_pain_areas: data.q4_pain_areas as PainAreaV2[],
    q5_hours_weekly: data.q5_hours_weekly as DiagnosisAnswers["q5_hours_weekly"],
    q6_automation_history:
      data.q6_automation_history as DiagnosisAnswers["q6_automation_history"],
    q7_timeline: data.q7_timeline as DiagnosisAnswers["q7_timeline"],
  };

  // 1) Persist initial row (status=processing) ------------------------------
  // Quando Supabase está configurado: failure aqui é fatal (lead se perderia
  // sem registro; preferimos devolver 503 e o usuário tenta de novo).
  // Quando Supabase NÃO está configurado: caímos pra fallback local (dev mode).
  let diagnosisId: string;
  if (isSupabaseConfigured()) {
    try {
      const saved = await saveDiagnosis({
        ...answers,
        name: data.name,
        email: data.email,
        whatsapp: data.whatsapp || undefined,
        company: data.company || undefined,
        utm_source: data.utm_source ?? null,
        utm_medium: data.utm_medium ?? null,
        utm_campaign: data.utm_campaign ?? null,
        utm_content: data.utm_content ?? null,
        utm_term: data.utm_term ?? null,
        landing_page: data.landing_page ?? null,
        referrer: data.referrer ?? null,
      });
      diagnosisId = saved.id;
    } catch (err) {
      console.error(
        "[DB_ERROR] submit aborted — saveDiagnosis failed",
        err instanceof Error ? err.message : err,
      );
      return NextResponse.json(
        {
          error:
            "Não consegui registrar seu diagnóstico agora. Tente novamente em alguns segundos.",
        },
        { status: 503 },
      );
    }
  } else {
    diagnosisId = randomUUID();
    console.warn(
      "[diagnosis] Supabase OFF — usando UUID local. Lead NÃO será persistido.",
      { id: diagnosisId },
    );
  }

  // 2) Run Anthropic --------------------------------------------------------
  let analysis: DiagnosisAnalysis;
  try {
    analysis = await generateDiagnosisAnalysis(answers);
  } catch (err) {
    const message =
      err instanceof AnthropicError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Erro desconhecido.";
    if (isSupabaseConfigured()) {
      try {
        await updateDiagnosisStatus(diagnosisId, {
          status: "failed",
          error_message: message,
        });
      } catch (updateErr) {
        console.error(
          "[DB_ERROR] failed to mark diagnosis as failed",
          updateErr instanceof Error ? updateErr.message : updateErr,
        );
      }
    }
    console.error("[diagnosis] anthropic failed:", err);
    return NextResponse.json(
      {
        error:
          "Não consegui gerar a análise agora. Tente novamente em alguns segundos.",
      },
      { status: 502 },
    );
  }

  // 3) Update with completed analysis + lead_score -------------------------
  // lead_score sempre é gravado aqui (antes ficava nulo na coluna; admin
  // recalculava on-the-fly). Calcular uma vez e reusar nas etapas seguintes.
  const score = calculateLeadScore(answers);
  if (isSupabaseConfigured()) {
    try {
      await updateDiagnosisStatus(diagnosisId, {
        status: "completed",
        ai_analysis: analysis,
        lead_score: score,
      });
    } catch (err) {
      // Não é fatal: a análise foi gerada e segue pro e-mail. Apenas o status
      // ficou em 'processing' no banco. Logar e continuar.
      console.error(
        "[DB_ERROR] update completed status failed (continuando)",
        err instanceof SupabaseWriteError ? err.message : err,
      );
    }
  }

  // 4) Email 1 (relatório pro user) ----------------------------------------
  // ÚNICO email awaited: é o relatório que o user está esperando. Se falhar,
  // o user navega pro /diagnosis/result/[id] e vê tudo na tela, mas o email
  // de backup falhou silenciosamente — aceitável.
  //
  // PDF é gerado server-side com @react-pdf/renderer (~1-2s) e anexado.
  // Se a renderização do PDF falhar, manda email sem anexo — relatório
  // continua acessível via link online.
  if (isResendConfigured()) {
    const userEmail = diagnosisReportEmail({
      name: data.name,
      diagnosisId,
      analysis,
      timeline: answers.q7_timeline,
    });

    let pdfBuffer: Buffer | null = null;
    try {
      pdfBuffer = await renderDiagnosisPdf({
        name: data.name,
        analysis,
        generatedAt: new Date(createdAt),
        reportUrl: `${siteConfig.url}/diagnosis/result/${diagnosisId}`,
      });
    } catch (err) {
      console.error(
        "[diagnosis] PDF render failed — sending email without attachment",
        err instanceof Error ? err.message : err,
      );
    }

    await sendEmail({
      to: data.email,
      subject: userEmail.subject,
      html: userEmail.html,
      text: userEmail.text,
      attachments: pdfBuffer
        ? [
            {
              filename: diagnosisPdfFilename(data.name, diagnosisId),
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ]
        : undefined,
    });
  } else {
    console.info("[diagnosis] resend off — relatório não enviado", {
      id: diagnosisId,
      to: data.email,
    });
  }

  // 5) Tudo o que NÃO precisa bloquear response vai pra after() ------------
  // after() do next/server roda callbacks DEPOIS do response ser flushado,
  // garantindo execução completa mesmo em runtimes serverless onde o void
  // promise normal poderia ser descartado no encerramento do request scope.
  //
  // Aqui vai: notificação interna pro Levi, schedule de emails 2-6, CAPI
  // Lead. Tudo não-crítico pro UX do user — eles podem demorar 2-5s sem
  // afetar a percepção de velocidade.
  // Extrai headers/IP do request UPFRONT — após o response ser flushado,
  // acessar request.headers em alguns runtimes é não-determinístico.
  const referer = request.headers.get("referer");
  const userAgent = request.headers.get("user-agent");
  const cookieHeader = request.headers.get("cookie");
  const clientIp = extractClientIp(request.headers);

  after(async () => {
    if (!isResendConfigured()) return;
    try {
      const labels = describeAnswers(answers);
      const internal = internalDiagnosisEmail({
        diagnosisId,
        name: data.name,
        email: data.email,
        whatsapp: data.whatsapp || null,
        company: data.company || null,
        leadScore: score,
        analysis,
        contextLabels: {
          carteira: labels.carteira,
          erp: labels.erp,
          perfilCliente: labels.perfilCliente,
          urgencia: labels.urgencia,
        },
      });
      await sendEmail({
        to: siteConfig.email.internal,
        subject: internal.subject,
        html: internal.html,
        text: internal.text,
        replyTo: data.email,
      });
    } catch (err) {
      console.error(
        "[diagnosis] after() internal email failed",
        err instanceof Error ? err.message : err,
      );
    }
  });

  after(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const items = buildEmailSequenceItems(new Date(createdAt));
      await scheduleEmailSequence(diagnosisId, items);
    } catch (err) {
      console.error(
        "[diagnosis] after() scheduleEmailSequence failed",
        err instanceof SupabaseWriteError ? err.message : err,
      );
    }
  });

  // CAPI Lead — event_id = diagnosisId pra dedup com Pixel client. Timeout
  // interno do sendCapiEvent é 5s (subiu de 500ms). Fire-and-forget via
  // after pra não custar nada no caminho crítico.
  const tier = leadTier(score);
  const leadValue =
    tier === "hot" ? EVENT_VALUE_BRL.hot_lead : EVENT_VALUE_BRL.lead;
  after(async () => {
    try {
      await sendCapiEvent({
        event_name: "Lead",
        event_id: diagnosisId,
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: referer ?? siteConfig.url,
        user_data: {
          em: hashEmailServer(data.email),
          ph: hashPhoneServer(data.whatsapp),
          fn: hashNameServer(firstNameFromServer(data.name)),
          client_ip_address: clientIp,
          client_user_agent: userAgent ?? undefined,
          ...parseFbCookies(cookieHeader),
        },
        custom_data: {
          value: leadValue,
          currency: "BRL",
          lead_quality: tier,
        },
      });
    } catch (err) {
      console.error(
        "[diagnosis] after() CAPI Lead failed",
        err instanceof Error ? err.message : err,
      );
    }
  });

  return NextResponse.json({
    id: diagnosisId,
    event_id: diagnosisId,
    createdAt,
    name: data.name,
    timeline: answers.q7_timeline,
    analysis,
    lead_score: score,
  });
}
