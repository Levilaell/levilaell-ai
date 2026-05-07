import { NextResponse } from "next/server";
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
} from "@/lib/supabase";
import { sendEmail, isResendConfigured } from "@/lib/resend";
import {
  diagnosisReportEmail,
  internalDiagnosisEmail,
} from "@/lib/email-templates";
import { describeAnswers } from "@/lib/diagnosis-prompt";
import { buildEmailSequenceItems } from "@/lib/email-sequence";
import { siteConfig } from "@/lib/site";
import type {
  DiagnosisAnalysis,
  DiagnosisAnswers,
  PainArea,
} from "@/types/diagnosis";

export const runtime = "nodejs";
export const maxDuration = 60;

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
    q2_business_model: data.q2_business_model as DiagnosisAnswers["q2_business_model"],
    q2_business_model_other: data.q2_business_model_other,
    q3_pain_areas: data.q3_pain_areas as PainArea[],
    q4_tech_maturity: data.q4_tech_maturity as DiagnosisAnswers["q4_tech_maturity"],
    q5_hours_weekly: data.q5_hours_weekly as DiagnosisAnswers["q5_hours_weekly"],
    q6_automation_history:
      data.q6_automation_history as DiagnosisAnswers["q6_automation_history"],
    q7_main_goal: data.q7_main_goal as DiagnosisAnswers["q7_main_goal"],
    q8_timeline: data.q8_timeline as DiagnosisAnswers["q8_timeline"],
    q9_budget: data.q9_budget as DiagnosisAnswers["q9_budget"],
    q10_revenue: data.q10_revenue
      ? (data.q10_revenue as DiagnosisAnswers["q10_revenue"])
      : undefined,
    q10_employees:
      typeof data.q10_employees === "number" ? data.q10_employees : undefined,
  };

  // 1) Persist initial row (status=processing) ------------------------------
  let diagnosisId: string | null = null;
  let leadScoreSnapshot: number | null = null;
  if (isSupabaseConfigured()) {
    const saved = await saveDiagnosis({
      ...answers,
      name: data.name,
      email: data.email,
      whatsapp: data.whatsapp || undefined,
      company: data.company || undefined,
    });
    if (saved) diagnosisId = saved.id;
  }
  // Fallback ID quando Supabase não está configurado (dev).
  if (!diagnosisId) diagnosisId = randomUUID();

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
      await updateDiagnosisStatus(diagnosisId, {
        status: "failed",
        error_message: message,
      });
    }
    console.error("[diagnosis] anthropic failed:", err);
    return NextResponse.json(
      { error: "Não consegui gerar a análise agora. Tente novamente em alguns segundos." },
      { status: 502 },
    );
  }

  // 3) Update with completed analysis --------------------------------------
  if (isSupabaseConfigured()) {
    await updateDiagnosisStatus(diagnosisId, {
      status: "completed",
      ai_analysis: analysis,
    });
  }

  // 4) Email 1 (relatório) — fire-and-forget but wait briefly --------------
  if (isResendConfigured()) {
    const userEmail = diagnosisReportEmail({
      name: data.name,
      diagnosisId,
      analysis,
      timeline: answers.q8_timeline,
    });
    await sendEmail({
      to: data.email,
      subject: userEmail.subject,
      html: userEmail.html,
      text: userEmail.text,
    });

    const labels = describeAnswers(answers);
    const internal = internalDiagnosisEmail({
      diagnosisId,
      name: data.name,
      email: data.email,
      whatsapp: data.whatsapp || null,
      company: data.company || null,
      leadScore: leadScoreSnapshot,
      analysis,
      contextLabels: {
        size: labels.size,
        businessModel: labels.businessModel,
        timeline: labels.timeline,
        budget: labels.budget,
        revenue: labels.revenue,
      },
    });
    await sendEmail({
      to: siteConfig.email.internal,
      subject: internal.subject,
      html: internal.html,
      text: internal.text,
      replyTo: data.email,
    });
  } else {
    console.info("[diagnosis] resend off — relatório não enviado", {
      id: diagnosisId,
      to: data.email,
    });
  }

  // 5) Schedule emails 2-6 (cron picks up later) ---------------------------
  if (isSupabaseConfigured()) {
    const items = buildEmailSequenceItems(new Date(createdAt));
    await scheduleEmailSequence(diagnosisId, items);
  }

  return NextResponse.json({
    id: diagnosisId,
    createdAt,
    name: data.name,
    timeline: answers.q8_timeline,
    analysis,
  });
}
