/**
 * scripts/debug-cron-sequence.ts
 *
 * Smoke test da cadência de e-mails 2-6:
 *   1) Lê o último diagnose da tabela `diagnoses`.
 *   2) Pra cada row em `email_sequences` (numbers 2..6):
 *      a) UPDATE scheduled_at = NOW()
 *      b) GET /api/cron/send-scheduled-emails (com Authorization: Bearer)
 *      c) SELECT row → confirma status=sent + body_html cacheado
 *
 * IMPORTANTE: dispara 5 e-mails reais via Resend (free tier suporta) +
 * 1 chamada Anthropic (~R$0,05) pro email 2 personalizado.
 *
 * Uso:
 *   pnpm dev
 *   pnpm tsx scripts/debug-cron-sequence.ts
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
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const cronSecret = process.env.CRON_SECRET ?? "";
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

async function findDevServer(): Promise<string | null> {
  for (const port of PORTS) {
    try {
      const r = await fetch(`http://localhost:${port}/`, { method: "HEAD" });
      if (r.ok || r.status === 404 || r.status === 405) {
        return `http://localhost:${port}`;
      }
    } catch {
      // próxima
    }
  }
  return null;
}

async function pickLatestDiagnosis(): Promise<{ id: string; email: string }> {
  const { data, error } = await supabase
    .from("diagnoses")
    .select("id, email, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) {
    throw new Error(
      `Nenhum diagnose encontrado em diagnoses. ${error?.message ?? ""}`,
    );
  }
  return { id: data.id, email: data.email };
}

async function listSequence(diagnosisId: string) {
  const { data, error } = await supabase
    .from("email_sequences")
    .select("id, email_number, status, sent_at, body_html, body_subject")
    .eq("diagnosis_id", diagnosisId)
    .order("email_number", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function makeOverdue(seqId: string): Promise<void> {
  const past = new Date(Date.now() - 60_000).toISOString();
  const { error } = await supabase
    .from("email_sequences")
    .update({ scheduled_at: past, status: "scheduled" })
    .eq("id", seqId);
  if (error) throw error;
}

async function triggerCron(base: string): Promise<{
  ok: boolean;
  status: number;
  body: unknown;
}> {
  const headers: Record<string, string> = {};
  if (cronSecret) headers["Authorization"] = `Bearer ${cronSecret}`;
  const res = await fetch(`${base}/api/cron/send-scheduled-emails`, {
    method: "GET",
    headers,
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

async function main() {
  console.log(c.cyan(c.bold("\n📬 Cron sequence smoke test\n")));
  const base = await findDevServer();
  if (!base) {
    console.error(c.red("Dev server não respondeu em :3000 nem :3001."));
    process.exit(1);
  }
  console.log(c.dim(`▶ dev server: ${base}`));
  console.log(
    c.dim(
      `▶ CRON_SECRET: ${cronSecret ? "[set, usando Bearer]" : "[ausente, usando dev fallback]"}\n`,
    ),
  );

  const diag = await pickLatestDiagnosis();
  console.log(c.dim(`▶ usando diagnose ${diag.id} (${diag.email})\n`));

  const initial = await listSequence(diag.id);
  if (initial.length === 0) {
    console.log(
      c.yellow("Nenhuma row em email_sequences pra esse diagnose. Aborte."),
    );
    process.exit(1);
  }
  console.log(c.dim(`▶ ${initial.length} rows scheduled\n`));

  const sep = "─".repeat(72);
  const results: Array<{ number: number; ok: boolean; cached: boolean; note: string }> = [];

  for (const row of initial) {
    if (row.status !== "scheduled") {
      console.log(
        c.yellow(`[#${row.email_number}]`),
        c.dim(`status já é '${row.status}', pulando.`),
      );
      continue;
    }
    process.stdout.write(c.dim(`[#${row.email_number}] make overdue ...`));
    await makeOverdue(row.id);
    process.stdout.write(c.dim(" ok\n"));

    process.stdout.write(c.dim(`[#${row.email_number}] trigger cron ...`));
    const t0 = Date.now();
    const { ok, status, body } = await triggerCron(base);
    const dur = Date.now() - t0;
    process.stdout.write(
      c.dim(` ${ok ? "ok" : "fail"} (${status}) · ${dur}ms\n`),
    );

    if (!ok) {
      console.log(c.red("  cron retornou erro:"), body);
      results.push({
        number: row.email_number,
        ok: false,
        cached: false,
        note: `HTTP ${status}`,
      });
      continue;
    }

    // Re-fetch row pra confirmar persistência
    const { data: after } = await supabase
      .from("email_sequences")
      .select("status, sent_at, body_html, body_subject, error_message")
      .eq("id", row.id)
      .maybeSingle();

    const cached = Boolean(after?.body_html && after?.body_subject);
    const sent = after?.status === "sent" && Boolean(after?.sent_at);

    results.push({
      number: row.email_number,
      ok: sent,
      cached,
      note: sent
        ? `subject=${after?.body_subject?.slice(0, 60)}…`
        : (after?.error_message ?? "status não chegou em 'sent'"),
    });
    console.log(
      `  ${sent ? c.green("✅") : c.red("❌")} status=${after?.status} · cached=${cached}`,
    );
  }

  console.log("\n" + c.dim(sep));
  console.log(c.bold("RESUMO"));
  console.log(c.dim(sep));
  for (const r of results) {
    const icon = r.ok ? c.green("✅") : c.red("❌");
    console.log(
      `${icon} email #${r.number}  ${r.cached ? c.green("cached") : c.dim("uncached")}  ${c.dim(r.note)}`,
    );
  }
  const allOk = results.every((r) => r.ok);
  console.log(c.dim(sep));
  console.log(
    allOk
      ? c.green(c.bold(`RESULTADO: ${results.length}/${results.length} OK — sequence completa.`))
      : c.red(
          c.bold(
            `RESULTADO: ${results.filter((r) => r.ok).length}/${results.length} OK — investigar emails com ❌.`,
          ),
        ),
  );

  process.exit(allOk ? 0 : 1);
}

main().catch((err) => {
  console.error(c.red("Erro inesperado:"), err);
  process.exit(2);
});
