import { NextResponse, after } from "next/server";
import { randomUUID } from "node:crypto";
import { diagnosisSubmissionSchema } from "@/types/forms";
import {
  generateDiagnosisAnalysis,
  AnthropicError,
  isAnthropicConfigured,
} from "@/lib/anthropic";
import {
  saveDiagnosis,
  updateDiagnosisStatus,
  scheduleEmailSequence,
  isSupabaseConfigured,
} from "@/lib/supabase";
import { sendEmail, isResendConfigured } from "@/lib/resend";
import {
  diagnosisReportEmail,
  diagnosisFailedEmail,
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
// Path crítico (Supabase ON) é insert + retorno: <1s. after() segura
// Anthropic + PDF + emails. Mantém 90s pra cobrir o caso Supabase OFF
// (sync legacy) e o orçamento do after() em runtimes serverless.
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

  // Headers / cookies pra Meta CAPI: extrai upfront antes de qualquer
  // after(), porque request scope pode estar morto no callback.
  const referer = request.headers.get("referer");
  const userAgent = request.headers.get("user-agent");
  const cookieHeader = request.headers.get("cookie");
  const clientIp = extractClientIp(request.headers);

  const score = calculateLeadScore(answers);
  const tier = leadTier(score);
  const leadValue =
    tier === "hot" ? EVENT_VALUE_BRL.hot_lead : EVENT_VALUE_BRL.lead;

  // ---------------------------------------------------------------------------
  // Fallback sync — só quando Supabase OFF (dev sem credenciais). Mantém o
  // fluxo antigo: Anthropic + email no caminho crítico, response leva ~30s
  // mas devolve analysis pro form salvar em localStorage. Em produção esse
  // bloco nunca roda.
  // ---------------------------------------------------------------------------
  if (!isSupabaseConfigured()) {
    const diagnosisId = randomUUID();
    console.warn(
      "[diagnosis] Supabase OFF — fallback sync, lead NÃO será persistido.",
      { id: diagnosisId },
    );

    let analysis: DiagnosisAnalysis;
    try {
      analysis = await generateDiagnosisAnalysis(answers);
    } catch (err) {
      console.error("[diagnosis] anthropic failed (sync fallback):", err);
      return NextResponse.json(
        {
          error:
            "Não consegui gerar a análise agora. Tente novamente em alguns segundos.",
        },
        { status: 502 },
      );
    }

    if (isResendConfigured()) {
      const userEmail = diagnosisReportEmail({
        name: data.name,
        diagnosisId,
        analysis,
        timeline: answers.q7_timeline,
      });
      try {
        await sendEmail({
          to: data.email,
          subject: userEmail.subject,
          html: userEmail.html,
          text: userEmail.text,
        });
      } catch (err) {
        console.error(
          "[diagnosis:sync] email failed (continuando)",
          err instanceof Error ? err.message : err,
        );
      }
    }

    return NextResponse.json({
      id: diagnosisId,
      event_id: diagnosisId,
      createdAt,
      name: data.name,
      timeline: answers.q7_timeline,
      analysis,
      lead_score: score,
      status: "completed",
    });
  }

  // ---------------------------------------------------------------------------
  // Path async (Supabase ON) — caminho crítico: salva pending e retorna.
  // ---------------------------------------------------------------------------
  let diagnosisId: string;
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

  // -----------------------------------------------------------------------
  // after() #1 — sequência principal: Anthropic → update status → PDF →
  // email user (ou email de fallback se failed). UM callback só porque
  // ordem importa; callbacks separados em after() podem rodar concorrente
  // no Next 15 e a ordenação implícita NÃO é garantida.
  // -----------------------------------------------------------------------
  after(async () => {
    const log = (msg: string, extra?: unknown) =>
      console.log(
        `[diagnosis:after] ${msg}`,
        extra !== undefined ? extra : "",
      );
    const errLog = (msg: string, err: unknown) =>
      console.error(
        `[diagnosis:after] ${msg}`,
        err instanceof Error ? err.message : err,
      );

    // 1. Anthropic
    let analysis: DiagnosisAnalysis | null = null;
    let aiError: string | null = null;
    try {
      analysis = await generateDiagnosisAnalysis(answers);
      log("anthropic ok", { id: diagnosisId });
    } catch (err) {
      aiError =
        err instanceof AnthropicError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Erro desconhecido.";
      errLog("anthropic failed after retries", err);
    }

    // 2. Update status (completed | failed)
    if (analysis) {
      try {
        await updateDiagnosisStatus(diagnosisId, {
          status: "completed",
          ai_analysis: analysis,
          lead_score: score,
        });
        log("status=completed gravado", { id: diagnosisId });
      } catch (err) {
        errLog("update status completed falhou (continuando)", err);
      }
    } else {
      try {
        await updateDiagnosisStatus(diagnosisId, {
          status: "failed",
          error_message: aiError,
        });
        log("status=failed gravado", { id: diagnosisId });
      } catch (err) {
        errLog("update status failed falhou (continuando)", err);
      }
    }

    // 3. Resend (se não configurado, paramos aqui — nada de email/PDF)
    if (!isResendConfigured()) {
      log("resend off — pulando email/PDF", { id: diagnosisId });
      return;
    }

    // 3a. Caminho failed → email curto pro user (sem PDF, com link Cal.com)
    //     + alerta interno pro Levi saber que lead precisa contato manual.
    if (!analysis) {
      try {
        const failed = diagnosisFailedEmail({
          name: data.name,
          diagnosisId,
        });
        await sendEmail({
          to: data.email,
          subject: failed.subject,
          html: failed.html,
          text: failed.text,
        });
        log("email failed enviado", { to: data.email });
      } catch (err) {
        errLog("email failed falhou", err);
      }
      try {
        const labels = describeAnswers(answers);
        await sendEmail({
          to: siteConfig.email.internal,
          subject: `⚠️ Diagnóstico falhou: ${data.name}${data.company ? ` (${data.company})` : ""} · score ${score}`,
          replyTo: data.email,
          html: `<p>IA estourou retries pro lead <strong>${data.name}</strong>.</p>
<p>Email: <a href="mailto:${data.email}">${data.email}</a>${data.whatsapp ? ` · WhatsApp: ${data.whatsapp}` : ""}</p>
<p>Carteira ${labels.carteira} · ERP ${labels.erp} · Perfil ${labels.perfilCliente} · Urgência ${labels.urgencia} · Score ${score}</p>
<p>Erro: ${aiError ?? "desconhecido"}</p>
<p>O lead recebeu email pedindo desculpas + link Cal.com. Vale chamar no WhatsApp em até 24h.</p>`,
          text: `Diagnóstico falhou: ${data.name}. Lead: ${data.email} ${data.whatsapp ?? ""}. Score ${score}. Erro: ${aiError ?? "desconhecido"}.`,
        });
        log("alerta interno (failed) enviado");
      } catch (err) {
        errLog("alerta interno (failed) falhou", err);
      }
      return;
    }

    // 3b. Caminho success → PDF + email completo
    let pdfBuffer: Buffer | null = null;
    try {
      pdfBuffer = await renderDiagnosisPdf({
        name: data.name,
        analysis,
        generatedAt: new Date(createdAt),
        reportUrl: `${siteConfig.url}/diagnosis/result/${diagnosisId}`,
      });
      log("pdf renderizado", { bytes: pdfBuffer.byteLength });
    } catch (err) {
      errLog("pdf render falhou — enviando email sem anexo", err);
    }

    try {
      const userEmail = diagnosisReportEmail({
        name: data.name,
        diagnosisId,
        analysis,
        timeline: answers.q7_timeline,
      });
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
      log("email report enviado", { to: data.email, with_pdf: !!pdfBuffer });
    } catch (err) {
      errLog("email report falhou", err);
    }

    // 4. Notificação interna completa pro Levi (success). Template precisa
    // de analysis não-null — fica aqui dentro do bloco success.
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
      log("email interno enviado");
    } catch (err) {
      errLog("email interno falhou", err);
    }

    // 5. Schedule da sequência (só faz sentido em success — drips referenciam
    // a análise). Em failed, o lead recebeu fallback e o follow-up vira manual.
    try {
      const items = buildEmailSequenceItems(new Date(createdAt));
      await scheduleEmailSequence(diagnosisId, items);
      log("email sequence agendada", { count: items.length });
    } catch (err) {
      errLog("scheduleEmailSequence falhou", err);
    }
  });

  // -----------------------------------------------------------------------
  // after() #3 — CAPI Lead. event_id = diagnosisId pra dedup com Pixel
  // client. Não depende da análise — pode disparar em paralelo.
  // -----------------------------------------------------------------------
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
        "[diagnosis:after] CAPI Lead failed",
        err instanceof Error ? err.message : err,
      );
    }
  });

  return NextResponse.json({
    id: diagnosisId,
    event_id: diagnosisId,
    lead_score: score,
    status: "pending",
    // anthropic_configured ajuda o client a decidir se o polling é necessário
    // (em dev sem ANTHROPIC_API_KEY o after() ainda roda usando mock e isso
    // é transparente, mas fica documentado).
    anthropic_configured: isAnthropicConfigured(),
  });
}
