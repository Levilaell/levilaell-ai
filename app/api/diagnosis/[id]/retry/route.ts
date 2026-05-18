import { NextResponse, after } from "next/server";
import {
  generateDiagnosisAnalysis,
  AnthropicError,
} from "@/lib/anthropic";
import {
  getDiagnosisAnswers,
  getDiagnosisById,
  resetDiagnosisForRetry,
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
import type { DiagnosisAnalysis } from "@/types/diagnosis";

type Params = {
  params: Promise<{ id: string }>;
};

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase não configurado." },
      { status: 503 },
    );
  }

  // 1) Carrega registro + answers ANTES do reset (depois do reset o status
  // já volta pra processing). Se não achou, 404.
  const record = await getDiagnosisById(id);
  if (!record) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }

  const answers = await getDiagnosisAnswers(id);
  if (!answers) {
    return NextResponse.json(
      { error: "Não foi possível reconstruir as respostas do diagnóstico." },
      { status: 500 },
    );
  }

  // 2) Reset atômico — só sucede se retry_count = 0. Se já retentou, 429.
  const reset = await resetDiagnosisForRetry(id);
  if (!reset) {
    return NextResponse.json(
      {
        error:
          "Você já tentou de novo uma vez. Vamos resolver pelo WhatsApp em até 24h.",
      },
      { status: 429 },
    );
  }

  const createdAt = new Date().toISOString();
  const score = calculateLeadScore(answers);

  // 3) Re-roda Anthropic + emails em after(). Mesma estrutura sequencial
  //    do submit, mas sem disparar de novo CAPI/Pixel (que são one-shot
  //    e já dispararam na primeira submissão).
  after(async () => {
    const log = (msg: string, extra?: unknown) =>
      console.log(
        `[diagnosis:retry] ${msg}`,
        extra !== undefined ? extra : "",
      );
    const errLog = (msg: string, err: unknown) =>
      console.error(
        `[diagnosis:retry] ${msg}`,
        err instanceof Error ? err.message : err,
      );

    let analysis: DiagnosisAnalysis | null = null;
    let aiError: string | null = null;
    try {
      analysis = await generateDiagnosisAnalysis(answers);
      log("anthropic ok no retry", { id });
    } catch (err) {
      aiError =
        err instanceof AnthropicError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Erro desconhecido.";
      errLog("anthropic falhou no retry", err);
    }

    if (analysis) {
      try {
        await updateDiagnosisStatus(id, {
          status: "completed",
          ai_analysis: analysis,
          lead_score: score,
        });
        log("status=completed gravado no retry");
      } catch (err) {
        errLog("update status completed (retry) falhou", err);
      }
    } else {
      try {
        await updateDiagnosisStatus(id, {
          status: "failed",
          error_message: aiError,
        });
        log("status=failed gravado no retry");
      } catch (err) {
        errLog("update status failed (retry) falhou", err);
      }
    }

    if (!isResendConfigured()) return;

    if (!analysis) {
      // Segundo failed seguido: lead já recebeu email de fallback uma vez,
      // não duplicamos. Só avisa o Levi via interno simples.
      try {
        await sendEmail({
          to: siteConfig.email.internal,
          subject: `🚨 Diagnóstico falhou DE NOVO (retry): ${record.name} · score ${score}`,
          replyTo: record.email,
          html: `<p>Retry falhou pro lead <strong>${record.name}</strong>.</p>
<p>Email: <a href="mailto:${record.email}">${record.email}</a>${record.whatsapp ? ` · WhatsApp: ${record.whatsapp}` : ""}</p>
<p>Score ${score}. Erro: ${aiError ?? "desconhecido"}</p>
<p>Esse lead precisa contato manual urgente.</p>`,
          text: `Retry falhou pro lead ${record.name} (${record.email}). Score ${score}. Erro: ${aiError ?? "desconhecido"}.`,
        });
      } catch (err) {
        errLog("alerta interno (retry failed) falhou", err);
      }
      return;
    }

    // Sucesso no retry: manda relatório completo + atualiza Levi + agenda
    // sequência (que não tinha sido agendada no failed inicial).
    let pdfBuffer: Buffer | null = null;
    try {
      pdfBuffer = await renderDiagnosisPdf({
        name: record.name,
        analysis,
        generatedAt: new Date(createdAt),
        reportUrl: `${siteConfig.url}/diagnosis/result/${id}`,
      });
    } catch (err) {
      errLog("pdf render falhou no retry", err);
    }

    try {
      const userEmail = diagnosisReportEmail({
        name: record.name,
        diagnosisId: id,
        analysis,
        timeline: answers.q7_timeline,
      });
      await sendEmail({
        to: record.email,
        subject: userEmail.subject,
        html: userEmail.html,
        text: userEmail.text,
        attachments: pdfBuffer
          ? [
              {
                filename: diagnosisPdfFilename(record.name, id),
                content: pdfBuffer,
                contentType: "application/pdf",
              },
            ]
          : undefined,
      });
      log("email report (retry) enviado");
    } catch (err) {
      errLog("email report (retry) falhou", err);
    }

    try {
      const labels = describeAnswers(answers);
      const internal = internalDiagnosisEmail({
        diagnosisId: id,
        name: record.name,
        email: record.email,
        whatsapp: record.whatsapp,
        company: null,
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
        subject: `🔁 ${internal.subject} (sucesso após retry)`,
        html: internal.html,
        text: internal.text,
        replyTo: record.email,
      });
    } catch (err) {
      errLog("email interno (retry) falhou", err);
    }

    // Agenda sequência só se não foi agendada antes — caller anterior em
    // failed pulou esse passo. Como o catch original em scheduleEmailSequence
    // tolera duplicação fraca, deixamos rodar; se row já existe, erro
    // silencioso e seguimos.
    try {
      const items = buildEmailSequenceItems(new Date(createdAt));
      await scheduleEmailSequence(id, items);
    } catch (err) {
      errLog("scheduleEmailSequence (retry) falhou (provavelmente já existe)", err);
    }
  });

  return NextResponse.json(
    { id, status: "pending", retry_count: reset.retry_count },
    { status: 202 },
  );
}
