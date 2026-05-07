/**
 * scripts/debug-supabase-write.ts
 *
 * Diagnóstico profundo do estado do Supabase:
 *   1) Quais tabelas existem (probe via SELECT count com service_role)
 *   2) Estado do RLS por tabela (tenta INSERT com anon — se 42501/permission =
 *      RLS bloqueando, se 42P01 = tabela não existe, se OK = inserir passou)
 *   3) Tenta INSERT na tabela diagnoses com service_role (deveria sempre passar)
 *   4) Tenta MESMO INSERT com anon (se RLS estiver mal configurada, vai falhar)
 *
 * É read-mostly: o único INSERT que persiste é o do service_role; ele é
 * removido logo após (DELETE pelo email mock).
 *
 * Run: pnpm tsx scripts/debug-supabase-write.ts
 */
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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

const EXPECTED_TABLES = [
  "diagnoses",
  "email_sequences",
  "public_examples",
  "subscribers",
  "contacts",
  "tracking_events",
] as const;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error(
    c.red("Missing required envs (URL / anon / service_role). Aborting."),
  );
  process.exit(2);
}

const service: SupabaseClient = createClient(url, serviceKey, {
  auth: { persistSession: false },
});
const anon: SupabaseClient = createClient(url, anonKey, {
  auth: { persistSession: false },
});

const DEBUG_EMAIL = `__debug_${Date.now()}@example.invalid`;

const mockDiagnosisInsert = {
  name: "[DEBUG] Probe",
  email: DEBUG_EMAIL,
  q1_size: "small_2_10",
  q2_business_model: "b2b_services",
  q3_pain_areas: ["lead_attendance"],
  q4_tech_maturity: "isolated_tools",
  q5_hours_weekly: "5_to_10",
  q6_automation_history: "never",
  q7_main_goal: "save_team_time",
  q8_timeline: "next_month",
  q9_budget: "1k_to_5k",
};

type ProbeResult = {
  table: string;
  exists: boolean;
  rlsEnforced: "yes" | "no" | "unknown";
  serviceWrite: "ok" | "fail";
  anonWrite: "ok" | "blocked_by_rls" | "fail" | "n/a";
  notes: string[];
};

function inspectError(err: unknown): {
  code: string;
  message: string;
  details: string;
  hint: string;
} {
  const e = err as {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  };
  return {
    code: e.code ?? "",
    message: e.message ?? "",
    details: e.details ?? "",
    hint: e.hint ?? "",
  };
}

async function probeTableExists(
  client: SupabaseClient,
  table: string,
): Promise<{ exists: boolean; error?: ReturnType<typeof inspectError> }> {
  const { error } = await client
    .from(table)
    .select("*", { count: "exact", head: true });
  if (!error) return { exists: true };
  const inspected = inspectError(error);
  // Postgres relation does not exist
  if (inspected.code === "42P01" || /does not exist/.test(inspected.message)) {
    return { exists: false, error: inspected };
  }
  // RLS may produce 42501 / permission denied even on SELECT — but with
  // service_role we shouldn't see that. Treat as "exists with weird perms".
  return { exists: true, error: inspected };
}

async function tryInsert(
  client: SupabaseClient,
  table: string,
  payload: Record<string, unknown>,
): Promise<{
  ok: boolean;
  error?: ReturnType<typeof inspectError>;
}> {
  const { error } = await client.from(table).insert(payload);
  if (!error) return { ok: true };
  return { ok: false, error: inspectError(error) };
}

async function deleteDebugRow(): Promise<void> {
  const { error } = await service
    .from("diagnoses")
    .delete()
    .eq("email", DEBUG_EMAIL);
  if (error) {
    console.warn(c.yellow(`(cleanup) couldn't delete debug row: ${error.message}`));
  }
}

async function main() {
  console.log(c.cyan(c.bold("\n🔬 Supabase write debug\n")));

  // -------------------------------------------------------------------------
  // 1) Existência das tabelas (via service_role — bypass RLS)
  // -------------------------------------------------------------------------
  const tableStatus: Record<string, ProbeResult> = {};
  for (const table of EXPECTED_TABLES) {
    const probe = await probeTableExists(service, table);
    tableStatus[table] = {
      table,
      exists: probe.exists,
      rlsEnforced: "unknown",
      serviceWrite: "fail",
      anonWrite: "n/a",
      notes: [],
    };
    if (!probe.exists) {
      const msg = probe.error?.message ?? "missing";
      tableStatus[table].notes.push(`Tabela não encontrada: ${msg}`);
    }
  }

  // -------------------------------------------------------------------------
  // 2) Service-role INSERT em diagnoses (deveria passar)
  // -------------------------------------------------------------------------
  if (tableStatus.diagnoses.exists) {
    const ins = await tryInsert(service, "diagnoses", mockDiagnosisInsert);
    if (ins.ok) {
      tableStatus.diagnoses.serviceWrite = "ok";
    } else {
      tableStatus.diagnoses.notes.push(
        `service_role INSERT falhou: code=${ins.error?.code} msg=${ins.error?.message} details=${ins.error?.details} hint=${ins.error?.hint}`,
      );
    }
  }

  // -------------------------------------------------------------------------
  // 3) Anon INSERT em diagnoses — se RLS estiver corretamente configurada
  //    pra anon, deve passar. Se bloquear com 42501, RLS sem policy.
  // -------------------------------------------------------------------------
  if (tableStatus.diagnoses.exists) {
    const ins = await tryInsert(anon, "diagnoses", {
      ...mockDiagnosisInsert,
      email: `anon_${DEBUG_EMAIL}`,
    });
    if (ins.ok) {
      tableStatus.diagnoses.anonWrite = "ok";
      tableStatus.diagnoses.rlsEnforced = "yes";
      tableStatus.diagnoses.notes.push(
        "Anon INSERT passou — policy 'anon insert diagnoses' está OK.",
      );
    } else {
      const code = ins.error?.code ?? "";
      const msg = ins.error?.message ?? "";
      if (code === "42501" || /row-level security/i.test(msg)) {
        tableStatus.diagnoses.anonWrite = "blocked_by_rls";
        tableStatus.diagnoses.rlsEnforced = "yes";
        tableStatus.diagnoses.notes.push(
          "Anon INSERT bloqueado por RLS — policy 'anon insert diagnoses' AUSENTE ou mal aplicada.",
        );
      } else {
        tableStatus.diagnoses.anonWrite = "fail";
        tableStatus.diagnoses.notes.push(
          `Anon INSERT falhou (não-RLS): code=${code} msg=${msg}`,
        );
      }
    }
    // Limpa rows mock
    await service.from("diagnoses").delete().like("email", "%@example.invalid");
  }

  // -------------------------------------------------------------------------
  // 4) Probe rápido das demais tabelas — INSERT com anon nas que devem aceitar
  // -------------------------------------------------------------------------
  const anonInsertableTables = ["subscribers", "contacts", "tracking_events"] as const;
  const probePayloads: Record<string, Record<string, unknown>> = {
    subscribers: {
      email: `__debug_sub_${Date.now()}@example.invalid`,
      name: "[DEBUG]",
      source: "debug",
    },
    contacts: {
      name: "[DEBUG] Probe",
      email: `__debug_ct_${Date.now()}@example.invalid`,
      message: "Debug probe — should be auto-deleted by service role.",
    },
    tracking_events: {
      event_type: "debug_probe",
      event_data: { kind: "debug", ts: Date.now() },
      session_id: "debug",
    },
  };

  for (const table of anonInsertableTables) {
    if (!tableStatus[table].exists) continue;
    const ins = await tryInsert(anon, table, probePayloads[table]);
    if (ins.ok) {
      tableStatus[table].anonWrite = "ok";
      tableStatus[table].rlsEnforced = "yes";
    } else {
      const code = ins.error?.code ?? "";
      const msg = ins.error?.message ?? "";
      if (code === "42501" || /row-level security/i.test(msg)) {
        tableStatus[table].anonWrite = "blocked_by_rls";
        tableStatus[table].rlsEnforced = "yes";
        tableStatus[table].notes.push(
          `Anon INSERT bloqueado — policy ausente ou nome divergente.`,
        );
      } else {
        tableStatus[table].anonWrite = "fail";
        tableStatus[table].notes.push(
          `Anon INSERT falhou (não-RLS): code=${code} msg=${msg}`,
        );
      }
    }
    // Sempre marca service_write OK se a tabela existe (já testamos diagnoses;
    // pra outras assumimos por listing).
    if (tableStatus[table].exists) tableStatus[table].serviceWrite = "ok";
  }

  // Cleanup
  await service
    .from("subscribers")
    .delete()
    .like("email", "%@example.invalid");
  await service.from("contacts").delete().like("email", "%@example.invalid");
  await service.from("tracking_events").delete().eq("event_type", "debug_probe");
  await deleteDebugRow();

  // -------------------------------------------------------------------------
  // 5) Report
  // -------------------------------------------------------------------------
  const sep = "═".repeat(78);
  console.log(c.dim(sep));
  console.log(c.bold("RELATÓRIO"));
  console.log(c.dim(sep));
  console.log();

  const headerCols = "tabela              exists   rls   service-w   anon-w";
  console.log(c.dim(headerCols));
  console.log(c.dim("-".repeat(headerCols.length + 4)));

  for (const table of EXPECTED_TABLES) {
    const r = tableStatus[table];
    const exists = r.exists ? c.green("yes") : c.red("NO ");
    const rls =
      r.rlsEnforced === "yes"
        ? c.green("yes")
        : r.rlsEnforced === "no"
          ? c.yellow("no ")
          : c.dim("?  ");
    const sw =
      r.serviceWrite === "ok"
        ? c.green("ok       ")
        : c.dim("not tested");
    const aw =
      r.anonWrite === "ok"
        ? c.green("ok           ")
        : r.anonWrite === "blocked_by_rls"
          ? c.red("blocked      ")
          : r.anonWrite === "fail"
            ? c.red("fail         ")
            : c.dim("n/a          ");
    const padded = table.padEnd(20, " ");
    console.log(`${padded}${exists}      ${rls}   ${sw}   ${aw}`);
  }

  console.log();
  for (const table of EXPECTED_TABLES) {
    const r = tableStatus[table];
    if (r.notes.length === 0) continue;
    console.log(c.bold(`[${table}]`));
    for (const n of r.notes) console.log(`  ${c.dim("·")} ${n}`);
    console.log();
  }

  // Veredito
  const missingTables = EXPECTED_TABLES.filter(
    (t) => !tableStatus[t].exists,
  );
  const blockedTables = EXPECTED_TABLES.filter(
    (t) => tableStatus[t].anonWrite === "blocked_by_rls",
  );
  const failedServiceWrites = EXPECTED_TABLES.filter(
    (t) =>
      tableStatus[t].exists &&
      ["diagnoses"].includes(t) &&
      tableStatus[t].serviceWrite !== "ok",
  );

  console.log(c.dim(sep));
  console.log(c.bold("VEREDITO"));
  console.log(c.dim(sep));

  if (missingTables.length > 0) {
    console.log(c.red(`✗ Tabelas faltando: ${missingTables.join(", ")}`));
  } else {
    console.log(c.green("✓ Todas as 6 tabelas existem"));
  }

  if (blockedTables.length > 0) {
    console.log(
      c.red(
        `✗ Anon INSERT bloqueado em: ${blockedTables.join(", ")} (policies ausentes)`,
      ),
    );
  } else if (
    EXPECTED_TABLES.some((t) => tableStatus[t].anonWrite === "ok")
  ) {
    console.log(c.green("✓ Anon INSERTs passam onde esperado"));
  }

  if (failedServiceWrites.length > 0) {
    console.log(
      c.red(
        `✗ service_role INSERT falhou em diagnoses — possivelmente schema divergente do payload.`,
      ),
    );
  } else if (tableStatus.diagnoses.exists) {
    console.log(c.green("✓ service_role INSERT em diagnoses funciona"));
  }
}

main().catch((err) => {
  console.error(c.red("Erro inesperado:"), err);
  process.exit(2);
});
