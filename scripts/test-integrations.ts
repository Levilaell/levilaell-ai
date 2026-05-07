/**
 * scripts/test-integrations.ts
 *
 * Validates the 5 external integrations the site depends on, in isolation.
 * No service is mutated — all checks are read-only / metadata pings.
 *
 * Run: pnpm test:integrations
 */
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { Client as NotionClient } from "@notionhq/client";

loadEnv({ path: resolve(process.cwd(), ".env.local") });

// ---------------------------------------------------------------------------
// Tiny ANSI helpers (no chalk dep)
// ---------------------------------------------------------------------------
const ansi = (code: string) => (s: string) => `\x1b[${code}m${s}\x1b[0m`;
const c = {
  green: ansi("32"),
  red: ansi("31"),
  yellow: ansi("33"),
  cyan: ansi("36"),
  bold: ansi("1"),
  dim: ansi("2"),
};

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------
type Status = "ok" | "fail" | "skip";

type Result = {
  name: string;
  status: Status;
  summary: string;
  details?: string;
};

const results: Result[] = [];

const ICON: Record<Status, string> = {
  ok: c.green("✅"),
  fail: c.red("❌"),
  skip: c.yellow("⚠️ "),
};

const STATUS_LABEL: Record<Status, string> = {
  ok: c.green("OK  "),
  fail: c.red("FAIL"),
  skip: c.yellow("SKIP"),
};

async function runTest(name: string, fn: () => Promise<Result>): Promise<void> {
  process.stdout.write(`${c.dim("▶")}  ${name}…\n`);
  let result: Result;
  try {
    result = await fn();
  } catch (err) {
    result = {
      name,
      status: "fail",
      summary: "exceção não capturada",
      details: err instanceof Error ? err.stack ?? err.message : String(err),
    };
  }
  results.push(result);
  console.log(
    `   ${ICON[result.status]} ${c.bold(name)}: ${c.dim(result.summary)}`,
  );
}

// ---------------------------------------------------------------------------
// TEST 1 — Anthropic
// ---------------------------------------------------------------------------
async function testAnthropic(): Promise<Result> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return {
      name: "Anthropic",
      status: "fail",
      summary: "ANTHROPIC_API_KEY ausente em .env.local",
    };
  }

  const client = new Anthropic({ apiKey: key });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 10,
      messages: [{ role: "user", content: "ping" }],
    });
    const tokens = response.usage.input_tokens + response.usage.output_tokens;
    return {
      name: "Anthropic",
      status: "ok",
      summary: `modelo: ${response.model} · ${tokens} tokens`,
    };
  } catch (err) {
    const e = err as {
      status?: number;
      message?: string;
      error?: { error?: { message?: string } };
    };
    const code = e.status;
    const apiMessage = e.error?.error?.message ?? e.message ?? "erro desconhecido";
    let hint = "";
    if (code === 401) hint = "chave inválida";
    else if (code === 402) hint = "sem créditos";
    else if (code === 429) hint = "rate limit";
    else if (code === 404) hint = "modelo não encontrado";
    return {
      name: "Anthropic",
      status: "fail",
      summary: code ? `${code} ${hint}`.trim() : "erro de conexão",
      details: apiMessage,
    };
  }
}

// ---------------------------------------------------------------------------
// TEST 2 — Supabase (anon + service role)
// ---------------------------------------------------------------------------
async function testSupabase(): Promise<Result> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    return {
      name: "Supabase",
      status: "fail",
      summary: "NEXT_PUBLIC_SUPABASE_URL ausente",
    };
  }
  if (!anonKey) {
    return {
      name: "Supabase",
      status: "fail",
      summary: "NEXT_PUBLIC_SUPABASE_ANON_KEY ausente",
    };
  }

  const projectId = (() => {
    try {
      return new URL(url).hostname.split(".")[0];
    } catch {
      return "unknown";
    }
  })();

  // 1) Probe anon key against /auth/v1/settings — endpoint público que aceita
  // anon key e funciona em qualquer projeto, mesmo sem tabelas criadas.
  const baseUrl = url.replace(/\/+$/, "");
  const settingsUrl = `${baseUrl}/auth/v1/settings`;
  try {
    const probe = await fetch(settingsUrl, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    });
    const bodyText = await probe.text().catch(() => "");
    if (probe.status === 401 || probe.status === 403) {
      return {
        name: "Supabase",
        status: "fail",
        summary: `project: ${projectId} · anon key inválida (${probe.status})`,
        details: bodyText ? `URL probada: ${settingsUrl}\nResposta: ${bodyText.slice(0, 200)}` : undefined,
      };
    }
    if (probe.status === 404) {
      return {
        name: "Supabase",
        status: "fail",
        summary: `project: ${projectId} · 404 em ${settingsUrl}`,
        details: [
          "Possíveis causas:",
          " 1) NEXT_PUBLIC_SUPABASE_URL com path/algo extra (esperado: https://<project>.supabase.co)",
          " 2) Project pausado/deletado — checa em https://supabase.com/dashboard",
          " 3) Project ID errado",
          bodyText ? `\nResposta do servidor: ${bodyText.slice(0, 300)}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      };
    }
    if (!probe.ok) {
      return {
        name: "Supabase",
        status: "fail",
        summary: `project: ${projectId} · anon HTTP ${probe.status}`,
        details: bodyText ? `URL probada: ${settingsUrl}\nResposta: ${bodyText.slice(0, 300)}` : undefined,
      };
    }
  } catch (err) {
    return {
      name: "Supabase",
      status: "fail",
      summary: `project: ${projectId} · erro de rede no anon`,
      details: err instanceof Error ? err.message : String(err),
    };
  }

  // 2) Service role: o endpoint /rest/v1/ exige service_role e responde 200 +
  // Swagger JSON quando autorizado. É o teste binário mais limpo: 200 = OK,
  // 401 = chave não é service_role, 403 = chave revogada.
  if (!serviceKey) {
    return {
      name: "Supabase",
      status: "fail",
      summary: `project: ${projectId} · SUPABASE_SERVICE_ROLE_KEY ausente`,
    };
  }
  const restRoot = `${baseUrl}/rest/v1/`;
  try {
    const probe = await fetch(restRoot, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    const bodyText = await probe.text().catch(() => "");
    if (probe.status === 401 || probe.status === 403) {
      const usingAnon = /service_role/i.test(bodyText);
      return {
        name: "Supabase",
        status: "fail",
        summary: `project: ${projectId} · service role inválida (${probe.status}${usingAnon ? " — você colou a anon key no SUPABASE_SERVICE_ROLE_KEY?" : ""})`,
        details: `URL probada: ${restRoot}\nResposta: ${bodyText.slice(0, 300)}`,
      };
    }
    if (!probe.ok) {
      return {
        name: "Supabase",
        status: "fail",
        summary: `project: ${projectId} · service role HTTP ${probe.status}`,
        details: bodyText.slice(0, 300),
      };
    }
  } catch (err) {
    return {
      name: "Supabase",
      status: "fail",
      summary: `project: ${projectId} · erro de rede no service role`,
      details: err instanceof Error ? err.message : String(err),
    };
  }
  // Sanity: também verifica que o cliente Supabase consegue inicializar (não
  // chama nada que possa falhar por falta de tabela).
  void createClient(url, serviceKey, { auth: { persistSession: false } });

  return {
    name: "Supabase",
    status: "ok",
    summary: `project: ${projectId}.supabase.co · anon + service`,
  };
}

// ---------------------------------------------------------------------------
// TEST 3 — Resend
// ---------------------------------------------------------------------------
async function testResend(): Promise<Result> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return {
      name: "Resend",
      status: "fail",
      summary: "RESEND_API_KEY ausente",
    };
  }

  const targetDomain = "levilael.com.br";

  let res: Response;
  try {
    res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
    });
  } catch (err) {
    return {
      name: "Resend",
      status: "fail",
      summary: "erro de rede",
      details: err instanceof Error ? err.message : String(err),
    };
  }

  if (res.status === 401) {
    return { name: "Resend", status: "fail", summary: "401 chave inválida" };
  }
  if (!res.ok) {
    return {
      name: "Resend",
      status: "fail",
      summary: `HTTP ${res.status}`,
      details: await res.text().catch(() => ""),
    };
  }

  const body = (await res.json()) as {
    data?: Array<{ name: string; status: string; region?: string }>;
  };
  const domains = body.data ?? [];
  const target = domains.find(
    (d) => d.name?.toLowerCase() === targetDomain.toLowerCase(),
  );

  if (!target) {
    return {
      name: "Resend",
      status: "fail",
      summary: `${targetDomain} não está na conta (${domains.length} domains)`,
      details:
        domains.length > 0
          ? `Domínios disponíveis: ${domains.map((d) => `${d.name} (${d.status})`).join(", ")}`
          : "Nenhum domínio adicionado ainda — adicione em https://resend.com/domains",
    };
  }

  if (target.status !== "verified") {
    return {
      name: "Resend",
      status: "fail",
      summary: `${targetDomain} status: ${target.status} (esperado: verified)`,
      details:
        "Vá em https://resend.com/domains e siga as instruções de DNS para concluir a verificação.",
    };
  }

  return {
    name: "Resend",
    status: "ok",
    summary: `domain ${targetDomain} verified`,
  };
}

// ---------------------------------------------------------------------------
// TEST 4 — Notion
// ---------------------------------------------------------------------------
const EXPECTED_NOTION_PROPS = [
  "Title",
  "Slug",
  "Pillar",
  "Status",
  "Published Date",
  "Excerpt",
  "Featured",
  "Reading Time",
  "Cover Image",
  "Meta Title",
  "Meta Description",
] as const;

async function testNotion(): Promise<Result> {
  const key = process.env.NOTION_API_KEY;
  const dbId = process.env.NOTION_DATABASE_ID_BLOG;
  if (!key) {
    return {
      name: "Notion",
      status: "fail",
      summary: "NOTION_API_KEY ausente",
    };
  }
  if (!dbId) {
    return {
      name: "Notion",
      status: "fail",
      summary: "NOTION_DATABASE_ID_BLOG ausente",
    };
  }

  // SDK v5 do Notion (API 2025-09-03+) separou properties em "data sources" —
  // databases.retrieve só devolve metadata. Pra esse teste de integração eu uso
  // fetch direto com a versão antiga da API (2022-06-28) que ainda retorna
  // properties no payload. Isso desacopla o teste de qual versão a aplicação usa.
  let response: Record<string, unknown>;
  try {
    const res = await fetch(
      `https://api.notion.com/v1/databases/${encodeURIComponent(dbId)}`,
      {
        headers: {
          Authorization: `Bearer ${key}`,
          "Notion-Version": "2022-06-28",
        },
      },
    );
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const code = (body?.code as string) ?? "";
      let hint = "";
      if (res.status === 401 || code === "unauthorized") {
        hint = "chave inválida ou integration não conectada à database";
      } else if (res.status === 404 || code === "object_not_found") {
        hint = "Database ID errado, ou integration não tem acesso (compartilhe a página com a integration)";
      } else if (res.status === 400 || code === "validation_error") {
        hint = "Database ID malformado";
      }
      return {
        name: "Notion",
        status: "fail",
        summary: `${res.status} ${hint || code || "erro"}`,
        details: typeof body?.message === "string" ? body.message : JSON.stringify(body).slice(0, 300),
      };
    }
    response = body;
  } catch (err) {
    return {
      name: "Notion",
      status: "fail",
      summary: "erro de rede",
      details: err instanceof Error ? err.message : String(err),
    };
  }

  const properties = response?.properties as
    | Record<string, { type?: string }>
    | undefined;
  const objectKind = (response?.object as string | undefined) ?? "?";

  if (!properties || typeof properties !== "object") {
    return {
      name: "Notion",
      status: "fail",
      summary: `objeto retornado não é uma database (object: ${objectKind})`,
      details: [
        "O ID em NOTION_DATABASE_ID_BLOG aponta pra um objeto sem properties.",
        "Causas comuns:",
        " 1) ID é de uma página comum, não de uma database. Crie uma database (full-page) e use o ID dela.",
        ` Resumo do retorno: ${JSON.stringify({ object: objectKind, id: response?.id }).slice(0, 200)}`,
      ].join("\n"),
    };
  }

  const existingProps = Object.keys(properties);
  const existingLower = new Set(existingProps.map((p) => p.toLowerCase()));
  const missing = EXPECTED_NOTION_PROPS.filter(
    (p) => !existingLower.has(p.toLowerCase()),
  );

  if (missing.length === 0) {
    return {
      name: "Notion",
      status: "ok",
      summary: `database OK · ${existingProps.length} properties (${EXPECTED_NOTION_PROPS.length} obrigatórias presentes)`,
    };
  }

  return {
    name: "Notion",
    status: "fail",
    summary: `${missing.length}/${EXPECTED_NOTION_PROPS.length} properties faltando: ${missing.join(", ")}`,
    details: `Properties existentes na database: ${existingProps.join(", ")}\n\nA convenção esperada (do brief): ${EXPECTED_NOTION_PROPS.join(", ")}`,
  };
}

// ---------------------------------------------------------------------------
// TEST 5 — Cal.com (URL ping only — sem API)
// ---------------------------------------------------------------------------
async function testCalcom(): Promise<Result> {
  const url = process.env.NEXT_PUBLIC_CALCOM_URL?.trim();
  if (!url) {
    return {
      name: "Cal.com",
      status: "skip",
      summary:
        "NEXT_PUBLIC_CALCOM_URL vazio — CTAs caem pra mailto:hello@levilael.com.br (fallback intencional)",
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return {
      name: "Cal.com",
      status: "fail",
      summary: `URL inválida: ${url}`,
    };
  }

  // Try HEAD first; some sites respond only to GET.
  let res: Response;
  try {
    res = await fetch(parsed.toString(), {
      method: "HEAD",
      redirect: "follow",
    });
    if (res.status === 405 || res.status === 404) {
      // HEAD não aceito ou retornou 404 — tenta GET
      res = await fetch(parsed.toString(), { method: "GET", redirect: "follow" });
    }
  } catch (err) {
    return {
      name: "Cal.com",
      status: "fail",
      summary: `erro de rede em ${parsed.host}`,
      details: err instanceof Error ? err.message : String(err),
    };
  }

  if (res.ok) {
    return {
      name: "Cal.com",
      status: "ok",
      summary: `${res.status} · ${parsed.toString()}`,
    };
  }

  return {
    name: "Cal.com",
    status: "fail",
    summary: `HTTP ${res.status} em ${parsed.toString()}`,
  };
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
function printReport(): void {
  const sep = "═".repeat(72);
  console.log("\n" + c.dim(sep));
  console.log(c.bold("RELATÓRIO DE INTEGRAÇÕES — Levi Lael Site"));
  console.log(c.dim(sep));
  console.log();

  const namePad = Math.max(...results.map((r) => r.name.length)) + 2;
  for (const r of results) {
    console.log(
      `${ICON[r.status]} ${c.bold(r.name.padEnd(namePad))} ${STATUS_LABEL[r.status]}  ${c.dim(r.summary)}`,
    );
  }

  console.log();
  console.log(c.dim(sep));

  const ok = results.filter((r) => r.status === "ok").length;
  const skip = results.filter((r) => r.status === "skip").length;
  const fail = results.filter((r) => r.status === "fail").length;
  const total = results.length;

  const headline =
    fail === 0
      ? c.green(c.bold(`RESULTADO: ${ok}/${total} OK${skip ? ` · ${skip} skipped` : ""}`))
      : c.red(c.bold(`RESULTADO: ${ok}/${total} OK · ${fail} falharam${skip ? ` · ${skip} skipped` : ""}`));
  console.log(headline);
  console.log(c.dim(sep));

  const failures = results.filter((r) => r.status === "fail");
  if (failures.length > 0) {
    console.log("\n" + c.bold("Detalhes dos erros:"));
    for (const f of failures) {
      console.log(`\n${c.red(`[${f.name}]`)} ${f.summary}`);
      if (f.details) console.log(c.dim(f.details));
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log(c.cyan(c.bold("\n🔌 Testando 5 integrações externas...\n")));

  await runTest("Anthropic", testAnthropic);
  await runTest("Supabase", testSupabase);
  await runTest("Resend", testResend);
  await runTest("Notion", testNotion);
  await runTest("Cal.com", testCalcom);

  printReport();

  const hasFail = results.some((r) => r.status === "fail");
  process.exit(hasFail ? 1 : 0);
}

main().catch((err) => {
  console.error(c.red("Erro inesperado:"), err);
  process.exit(2);
});
