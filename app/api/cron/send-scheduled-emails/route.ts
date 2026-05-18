import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { getSupabaseService, isSupabaseConfigured } from "@/lib/supabase";
import {
  runFollowUpEmail,
  type DiagnosisCtx,
} from "@/lib/email-followup-runner";

export const runtime = "nodejs";
export const maxDuration = 60;

const BATCH_LIMIT = 10;

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase não configurado." },
      { status: 503 },
    );
  }

  const supabase = getSupabaseService();
  if (!supabase) {
    return NextResponse.json(
      { error: "service client indisponível" },
      { status: 503 },
    );
  }

  // 1) Pega sequências overdue
  const { data: rows, error } = await supabase
    .from("email_sequences")
    .select(
      "id, diagnosis_id, email_number, body_html, body_subject, scheduled_at",
    )
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(BATCH_LIMIT);

  if (error) {
    console.error("[CRON_ERROR] fetch failed", error.message);
    return NextResponse.json(
      { error: "fetch failed", details: error.message },
      { status: 500 },
    );
  }

  // 2) Carrega diagnoses correspondentes em batch
  const ids = Array.from(
    new Set((rows ?? []).map((r) => r.diagnosis_id).filter(Boolean)),
  ) as string[];

  let diagnosesById: Record<string, DiagnosisCtx> = {};
  if (ids.length > 0) {
    const { data: diags, error: diagErr } = await supabase
      .from("diagnoses")
      .select(
        "id, name, email, ai_analysis, q1_size, q2_erp, q3_client_profile",
      )
      .in("id", ids);
    if (diagErr) {
      console.error("[CRON_ERROR] diagnoses fetch failed", diagErr.message);
      return NextResponse.json(
        { error: "diagnoses fetch failed", details: diagErr.message },
        { status: 500 },
      );
    }
    diagnosesById = Object.fromEntries(
      (diags ?? []).map((d) => [d.id, d as DiagnosisCtx]),
    );
  }
  const summary = {
    picked: rows?.length ?? 0,
    sent: 0,
    cached_hits: 0,
    failed: 0,
    skipped: 0,
    failures: [] as Array<{ id: string; reason: string }>,
  };

  for (const row of rows ?? []) {
    const diag = row.diagnosis_id
      ? diagnosesById[row.diagnosis_id]
      : undefined;
    if (!diag) {
      console.warn("[CRON] sequence sem diagnose — marcando failed", {
        id: row.id,
      });
      await supabase
        .from("email_sequences")
        .update({
          status: "failed",
          error_message: "diagnose ausente (cancelado ou deletado).",
        })
        .eq("id", row.id);
      summary.failed++;
      summary.failures.push({ id: row.id, reason: "diagnose missing" });
      continue;
    }

    try {
      const result = await runFollowUpEmail(
        {
          id: row.id,
          diagnosis_id: row.diagnosis_id ?? "",
          email_number: row.email_number,
          body_html: row.body_html,
          body_subject: row.body_subject,
        },
        diag,
      );

      if (result.ok) {
        summary.sent++;
        if (result.cached) summary.cached_hits++;
        console.info("[CRON] sent", {
          seq_id: row.id,
          number: row.email_number,
          cached: result.cached,
          message_id: result.messageId,
        });
      } else {
        summary.failed++;
        summary.failures.push({ id: row.id, reason: result.error });
        await supabase
          .from("email_sequences")
          .update({ status: "failed", error_message: result.error })
          .eq("id", row.id);
        console.error("[CRON_ERROR] runFollowUpEmail failed", {
          seq_id: row.id,
          number: row.email_number,
          error: result.error,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      summary.failed++;
      summary.failures.push({ id: row.id, reason: message });
      await supabase
        .from("email_sequences")
        .update({ status: "failed", error_message: message })
        .eq("id", row.id);
      console.error("[CRON_ERROR] uncaught", {
        seq_id: row.id,
        error: message,
      });
    }
  }

  console.info("[CRON] batch summary", summary);
  return NextResponse.json({ ok: true, summary });
}
