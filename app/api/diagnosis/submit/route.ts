import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { diagnosisSubmissionSchema } from "@/types/forms";
import { generateDiagnosisAnalysis } from "@/lib/anthropic";
import { getSupabaseService, isSupabaseConfigured } from "@/lib/supabase";
import { sendEmail, isResendConfigured } from "@/lib/resend";
import {
  diagnosisReportEmail,
  internalNotificationEmail,
} from "@/lib/email-templates";
import { siteConfig } from "@/lib/site";
import type { DiagnosisAnalysis, DiagnosisAnswers } from "@/types/diagnosis";
import type { PainArea } from "@/types/diagnosis";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "JSON inválido." },
      { status: 400 },
    );
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
  const id = randomUUID();
  const createdAt = new Date().toISOString();

  const answers: DiagnosisAnswers = {
    q1_company_type: data.q1_company_type as DiagnosisAnswers["q1_company_type"],
    q2_industry: data.q2_industry as DiagnosisAnswers["q2_industry"],
    q2_industry_other: data.q2_industry_other,
    q3_pain_areas: data.q3_pain_areas as PainArea[],
    q4_tech_maturity:
      data.q4_tech_maturity as DiagnosisAnswers["q4_tech_maturity"],
    q5_hours_weekly: data.q5_hours_weekly as DiagnosisAnswers["q5_hours_weekly"],
    q6_automation_history:
      data.q6_automation_history as DiagnosisAnswers["q6_automation_history"],
    q7_main_goal: data.q7_main_goal as DiagnosisAnswers["q7_main_goal"],
  };

  let analysis: DiagnosisAnalysis;
  try {
    analysis = await generateDiagnosisAnalysis(answers);
  } catch (error) {
    console.error("[diagnosis] anthropic error:", error);
    return NextResponse.json(
      {
        error:
          "Não consegui gerar a análise agora. Tente novamente em alguns segundos.",
      },
      { status: 502 },
    );
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseService();
    if (supabase) {
      const { error } = await supabase.from("diagnoses").insert({
        id,
        created_at: createdAt,
        name: data.name,
        email: data.email,
        whatsapp: data.whatsapp || null,
        company: data.company || null,
        q1_company_type: answers.q1_company_type,
        q2_industry:
          answers.q2_industry === "other" && answers.q2_industry_other
            ? answers.q2_industry_other
            : answers.q2_industry,
        q3_pain_areas: answers.q3_pain_areas,
        q4_tech_maturity: answers.q4_tech_maturity,
        q5_hours_weekly: answers.q5_hours_weekly,
        q6_automation_history: answers.q6_automation_history,
        q7_main_goal: answers.q7_main_goal,
        ai_analysis: analysis,
        status: "completed",
      });
      if (error) {
        console.error("[diagnosis] supabase insert error:", error);
      }
    }
  }

  if (isResendConfigured()) {
    const userEmail = diagnosisReportEmail({
      name: data.name,
      diagnosisId: id,
      analysis,
    });
    await sendEmail({
      to: data.email,
      subject: userEmail.subject,
      html: userEmail.html,
      text: userEmail.text,
    });

    const internal = internalNotificationEmail({
      kind: "diagnosis",
      payload: {
        id,
        name: data.name,
        email: data.email,
        whatsapp: data.whatsapp ?? "",
        company: data.company ?? "",
        industry: answers.q2_industry,
        company_type: answers.q1_company_type,
        main_goal: answers.q7_main_goal,
        link: `${siteConfig.url}/diagnosis/result/${id}`,
      },
    });
    await sendEmail({
      to: siteConfig.email.internal,
      subject: internal.subject,
      html: internal.html,
      text: internal.text,
    });
  } else {
    console.info("[diagnosis] stubbed delivery", {
      id,
      to: data.email,
    });
  }

  return NextResponse.json({
    id,
    createdAt,
    name: data.name,
    analysis,
  });
}
