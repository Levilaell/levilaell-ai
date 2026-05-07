/**
 * scripts/debug-real-submit.ts
 *
 * Smoke test end-to-end do /api/diagnosis/submit.
 *   1) Faz POST com payload válido contra o dev server.
 *   2) Confirma row em `diagnoses` (status=completed, ai_analysis populated).
 *   3) Confirma 5 rows em `email_sequences` (numbers 2-6, status=scheduled).
 *   4) Lista os e-mails enviados pela Resend nos últimos minutos pra confirmar
 *      o relatório (cliente) e a notificação interna.
 *
 * IMPORTANTE: este teste consome 1 chamada Anthropic (~R$0.10) e dispara 2
 * e-mails reais via Resend. Use o seu próprio inbox no payload.
 *
 * Uso:
 *   pnpm dev           # em outro terminal
 *   pnpm tsx scripts/debug-real-submit.ts
 */
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: resolve(process.cwd(), ".env.local") });

const ansi = (code: string) => (s: string) => `\x1b[${code}m${s}\x1b[0m`;
const c = {
  green: ansi("32"),
  red: ansi("31"),
  yellow: ansi("33"),
  cyan: ansi("36"),
  bold: ansi("1"),
  dim: ansi("2"),
};

const PORTS = [3000, 3001];
const TARGET_EMAIL = process.env.SMOKE_TEST_EMAIL ?? "hello@levilael.com.br";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resendKey = process.env.RESEND_API_KEY!;

if (!url || !serviceKey) {
  console.error(c.red("Missing Supabase envs."));
  process.exit(2);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

async function discoverDevServer(): Promise<string | null> {
  for (const port of PORTS) {
    try {
      const res = await fetch(`http://localhost:${port}/`, { method: "HEAD" });
      if (res.ok || res.status === 405 || res.status === 404) {
        return `http://localhost:${port}`;
      }
    } catch {
      // try next port
    }
  }
  return null;
}

async function main() {
  console.log(c.cyan(c.bold("\n🧪 End-to-end submit smoke test\n")));

  const base = await discoverDevServer();
  if (!base) {
    console.error(
      c.red("Dev server não respondeu em :3000 nem :3001. Roda `pnpm dev` em outro terminal."),
    );
    process.exit(1);
  }
  console.log(c.dim(`▶ dev server: ${base}`));
  console.log(c.dim(`▶ test email: ${TARGET_EMAIL}\n`));

  const payload = {
    q1_size: "small_2_10",
    q2_business_model: "b2b_services",
    q3_pain_areas: ["lead_attendance", "system_integration"],
    q4_tech_maturity: "isolated_tools",
    q5_hours_weekly: "10_to_20",
    q6_automation_history: "no_code_failed",
    q7_main_goal: "save_team_time",
    q8_timeline: "next_month",
    q9_budget: "1k_to_5k",
    name: "[SMOKE TEST] Probe",
    email: TARGET_EMAIL,
    company: "smoke.test",
    consent: true,
  };

  // -------------------------------------------------------------------------
  // 1) POST
  // -------------------------------------------------------------------------
  const t0 = Date.now();
  process.stdout.write(c.dim("▶ POST /api/diagnosis/submit … "));
  const res = await fetch(`${base}/api/diagnosis/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const elapsedMs = Date.now() - t0;
  const responseText = await res.text();
  let response: { id?: string; analysis?: unknown; createdAt?: string };
  try {
    response = JSON.parse(responseText);
  } catch {
    console.log(c.red("FAIL — response não é JSON"));
    console.log(c.dim(responseText.slice(0, 400)));
    process.exit(1);
  }

  if (!res.ok || !response.id) {
    console.log(c.red(`FAIL ${res.status}`));
    console.log(c.dim(JSON.stringify(response, null, 2).slice(0, 600)));
    process.exit(1);
  }
  console.log(c.green(`ok ${res.status}`), c.dim(`${elapsedMs}ms · id=${response.id}`));

  const diagnosisId = response.id;
  const checks: Array<{ name: string; ok: boolean; detail: string }> = [];

  // -------------------------------------------------------------------------
  // 2) Row em `diagnoses`
  // -------------------------------------------------------------------------
  {
    const { data, error } = await supabase
      .from("diagnoses")
      .select("id, status, ai_analysis, lead_score, q1_size, q2_business_model")
      .eq("id", diagnosisId)
      .maybeSingle();
    if (error || !data) {
      checks.push({
        name: "diagnoses row",
        ok: false,
        detail: error?.message ?? "row não encontrada",
      });
    } else {
      const ok = data.status === "completed" && data.ai_analysis != null;
      checks.push({
        name: "diagnoses row",
        ok,
        detail: ok
          ? `status=completed · ai_analysis ✓ · lead_score=${data.lead_score} · q1=${data.q1_size} · q2=${data.q2_business_model}`
          : `status=${data.status} · ai_analysis=${data.ai_analysis ? "ok" : "null"}`,
      });
    }
  }

  // -------------------------------------------------------------------------
  // 3) email_sequences (5 rows: numbers 2-6)
  // -------------------------------------------------------------------------
  {
    const { data, error } = await supabase
      .from("email_sequences")
      .select("email_number, status, scheduled_at")
      .eq("diagnosis_id", diagnosisId)
      .order("email_number");

    if (error) {
      checks.push({
        name: "email_sequences",
        ok: false,
        detail: error.message,
      });
    } else {
      const expected = [2, 3, 4, 5, 6];
      const numbers = (data ?? []).map((r) => r.email_number);
      const allScheduled =
        (data ?? []).every((r) => r.status === "scheduled") && data?.length === 5;
      const numbersMatch = expected.every((n) => numbers.includes(n));
      checks.push({
        name: "email_sequences",
        ok: allScheduled && numbersMatch,
        detail: `${data?.length ?? 0}/5 rows · numbers=[${numbers.join(",")}] · all scheduled=${allScheduled}`,
      });
    }
  }

  // -------------------------------------------------------------------------
  // 4) Resend — list emails recentes
  // -------------------------------------------------------------------------
  if (resendKey) {
    try {
      const r = await fetch("https://api.resend.com/emails?limit=20", {
        headers: { Authorization: `Bearer ${resendKey}` },
      });
      if (!r.ok) {
        checks.push({
          name: "resend list",
          ok: false,
          detail: `HTTP ${r.status}`,
        });
      } else {
        type ResendItem = {
          id?: string;
          to?: string[];
          subject?: string;
          created_at?: string;
        };
        const body = (await r.json()) as { data?: ResendItem[] };
        const items = body.data ?? [];
        // Considera como "recente" o que foi criado nos últimos 2min.
        const cutoff = Date.now() - 2 * 60 * 1000;
        const recent = items.filter((it) => {
          const ts = it.created_at ? Date.parse(it.created_at) : NaN;
          return Number.isFinite(ts) && ts >= cutoff;
        });
        const hitsTarget = recent.some((it) =>
          (it.to ?? []).some((t) => t.toLowerCase() === TARGET_EMAIL.toLowerCase()),
        );
        const internal = (
          process.env.INTERNAL_NOTIFICATION_EMAIL ?? ""
        ).toLowerCase();
        const hitsInternal =
          internal && internal !== TARGET_EMAIL.toLowerCase()
            ? recent.some((it) =>
                (it.to ?? []).some((t) => t.toLowerCase() === internal),
              )
            : hitsTarget;
        checks.push({
          name: "resend report email",
          ok: hitsTarget,
          detail: `${recent.length} e-mails recentes na conta · target=${TARGET_EMAIL} ${hitsTarget ? "✓" : "✗"}`,
        });
        checks.push({
          name: "resend internal email",
          ok: hitsInternal,
          detail: internal
            ? `internal=${internal} ${hitsInternal ? "✓" : "✗"}`
            : "(INTERNAL_NOTIFICATION_EMAIL ausente)",
        });
      }
    } catch (err) {
      checks.push({
        name: "resend list",
        ok: false,
        detail: err instanceof Error ? err.message : "unknown",
      });
    }
  } else {
    checks.push({
      name: "resend",
      ok: false,
      detail: "RESEND_API_KEY ausente",
    });
  }

  // -------------------------------------------------------------------------
  // 5) Report
  // -------------------------------------------------------------------------
  const sep = "═".repeat(78);
  console.log("\n" + c.dim(sep));
  console.log(c.bold("CHECKS"));
  console.log(c.dim(sep));
  for (const ch of checks) {
    const icon = ch.ok ? c.green("✅") : c.red("❌");
    console.log(`${icon} ${c.bold(ch.name.padEnd(24))} ${c.dim(ch.detail)}`);
  }
  const allOk = checks.every((ch) => ch.ok);
  console.log(c.dim(sep));
  console.log(
    allOk
      ? c.green(c.bold("RESULTADO: 4/4 OK — fluxo persistindo corretamente."))
      : c.red(
          c.bold(
            `RESULTADO: ${checks.filter((c) => c.ok).length}/${checks.length} OK — investigar pontos com ❌.`,
          ),
        ),
  );
  console.log(c.dim(sep));
  console.log(c.dim(`(diagnosis_id de teste: ${diagnosisId})`));

  process.exit(allOk ? 0 : 1);
}

main().catch((err) => {
  console.error(c.red("Erro inesperado:"), err);
  process.exit(2);
});
