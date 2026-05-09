/**
 * scripts/debug-notion-schema.ts
 *
 * Diagnose por que o preflight de blog publish (lib/notion-publish.ts) está
 * reclamando que "Property 'Title' não existe no Notion DB" quando o user
 * confirma que a property existe.
 *
 * - Bate na API com 2 versões diferentes (2022-06-28 igual lib/notion.ts, e
 *   sem header explícito pra deixar SDK escolher) e compara.
 * - Imprime cada property com nome cru + length + char codes (detecta zero-
 *   width, espaços invisíveis, NFC vs NFD).
 * - Compara o set de properties retornado contra o que o preflight espera.
 *
 * Run:  pnpm tsx scripts/debug-notion-schema.ts
 *       (não precisa adicionar script no package.json — tsx é dev dep)
 */
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: resolve(process.cwd(), ".env.local") });

const ansi = (code: string) => (s: string) => `\x1b[${code}m${s}\x1b[0m`;
const c = {
  green: ansi("32"),
  red: ansi("31"),
  yellow: ansi("33"),
  cyan: ansi("36"),
  magenta: ansi("35"),
  bold: ansi("1"),
  dim: ansi("2"),
};

// O preflight em lib/notion-publish.ts espera EXATAMENTE essas properties
// nessas chaves e tipos. Também espera options no Pillar e no Status.
const EXPECTED_PROPERTIES: ReadonlyArray<readonly [string, string]> = [
  ["Title", "title"],
  ["Slug", "rich_text"],
  ["Status", "select"],
  ["Pillar", "select"],
  ["Excerpt", "rich_text"],
  ["Published Date", "date"],
  ["Reading Time", "number"],
  ["Meta Title", "rich_text"],
  ["Meta Description", "rich_text"],
];

const EXPECTED_PILLAR_OPTIONS = [
  "ai-applied",
  "automation-stack",
  "professional-operations",
];

const EXPECTED_STATUS_OPTIONS = ["Published"];

function visualizeWhitespace(s: string): string {
  return s
    .replace(/ /g, "·") // espaço normal
    .replace(/\t/g, "→") // tab
    .replace(/ /g, "[NBSP]")
    .replace(/​/g, "[ZWSP]") // zero-width space
    .replace(/‌/g, "[ZWNJ]") // zero-width non-joiner
    .replace(/‍/g, "[ZWJ]") // zero-width joiner
    .replace(/﻿/g, "[BOM]")
    .replace(/\n/g, "↵");
}

function charCodes(s: string): string {
  return Array.from(s)
    .map((ch) => ch.codePointAt(0)?.toString(16).padStart(4, "0") ?? "????")
    .map((hex) => `U+${hex.toUpperCase()}`)
    .join(" ");
}

function describeNorm(s: string): string {
  const nfc = s.normalize("NFC");
  const nfd = s.normalize("NFD");
  if (s === nfc && s === nfd) return "(ASCII / sem combining)";
  const tags: string[] = [];
  if (s === nfc) tags.push("NFC");
  if (s === nfd) tags.push("NFD");
  if (tags.length === 0) tags.push("non-normalized");
  if (s.length !== nfc.length) tags.push(`nfc.len=${nfc.length}`);
  if (s.length !== nfd.length) tags.push(`nfd.len=${nfd.length}`);
  return `(${tags.join(", ")})`;
}

type RawDb = {
  id: string;
  title?: Array<{ plain_text?: string }>;
  properties?: Record<
    string,
    {
      id: string;
      name?: string;
      type: string;
      select?: { options?: Array<{ id: string; name: string }> };
      [key: string]: unknown;
    }
  >;
  url?: string;
  [key: string]: unknown;
};

async function fetchDb(
  apiKey: string,
  dbId: string,
  notionVersion: string,
): Promise<RawDb> {
  const res = await fetch(
    `https://api.notion.com/v1/databases/${encodeURIComponent(dbId)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Notion-Version": notionVersion,
      },
    },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 400)}`);
  }
  return (await res.json()) as RawDb;
}

function dumpProperties(db: RawDb): void {
  const props = db.properties ?? {};
  const entries = Object.entries(props);
  console.log(c.dim(`Total properties retornadas: ${entries.length}`));
  console.log();

  for (const [key, value] of entries) {
    const name = value.name ?? key;
    const type = value.type;
    const id = value.id;
    const visualKey = visualizeWhitespace(key);
    const visualName = visualizeWhitespace(name);
    const keyMatches = key === name;
    console.log(
      `${c.cyan(c.bold(`▸ ${visualKey}`))} ${c.dim(
        `(len=${key.length}, type=${type}, id=${id})`,
      )}`,
    );
    if (!keyMatches) {
      console.log(
        `  ${c.yellow("⚠ key !== name")} → name=${c.magenta(visualName)} (len=${name.length})`,
      );
    }
    console.log(`  codepoints: ${c.dim(charCodes(key))}`);
    console.log(`  norm:       ${c.dim(describeNorm(key))}`);
    if (value.select?.options) {
      const optNames = value.select.options
        .map((o) => `"${visualizeWhitespace(o.name)}" (len=${o.name.length})`)
        .join(", ");
      console.log(`  options:    ${optNames}`);
    }
    console.log();
  }
}

function compareToExpected(db: RawDb, version: string): void {
  const props = db.properties ?? {};
  const propKeys = Object.keys(props);
  console.log(c.bold(`\n=== Comparação com o preflight (Notion-Version=${version}) ===`));

  const issues: string[] = [];

  for (const [expectedName, expectedType] of EXPECTED_PROPERTIES) {
    const exact = props[expectedName];
    if (exact) {
      if (exact.type !== expectedType) {
        issues.push(
          `${c.red("type mismatch")}: "${expectedName}" esperado=${expectedType} mas é ${exact.type}`,
        );
      } else {
        console.log(
          `  ${c.green("✓")} ${expectedName} (type=${exact.type})`,
        );
      }
      continue;
    }

    // Busca fuzzy: compara em lower + trim + normalize
    const target = expectedName.toLowerCase().trim().normalize("NFC");
    const candidates = propKeys.filter(
      (k) => k.toLowerCase().trim().normalize("NFC") === target,
    );
    if (candidates.length > 0) {
      issues.push(
        `${c.yellow("near-match")}: "${expectedName}" não existe exato. Mais perto: ${candidates
          .map((k) => `"${visualizeWhitespace(k)}" (len=${k.length}, codes=${charCodes(k)})`)
          .join(" | ")}`,
      );
      continue;
    }

    issues.push(
      `${c.red("MISSING")}: "${expectedName}" (esperava type=${expectedType}). Properties existentes: ${propKeys
        .map((k) => `"${visualizeWhitespace(k)}"`)
        .join(", ")}`,
    );
  }

  // Pillar options
  const pillar = props["Pillar"] as
    | { select?: { options?: Array<{ name: string }> } }
    | undefined;
  if (pillar?.select?.options) {
    const optNames = pillar.select.options.map((o) => o.name);
    const missing = EXPECTED_PILLAR_OPTIONS.filter((n) => !optNames.includes(n));
    if (missing.length > 0) {
      issues.push(
        `${c.red("Pillar options missing")}: ${missing.join(", ")} · existentes: ${optNames
          .map((n) => `"${visualizeWhitespace(n)}"`)
          .join(", ")}`,
      );
    } else {
      console.log(`  ${c.green("✓")} Pillar tem todas options esperadas`);
    }
  }

  // Status options
  const status = props["Status"] as
    | { select?: { options?: Array<{ name: string }> } }
    | undefined;
  if (status?.select?.options) {
    const optNames = status.select.options.map((o) => o.name);
    const missing = EXPECTED_STATUS_OPTIONS.filter((n) => !optNames.includes(n));
    if (missing.length > 0) {
      issues.push(
        `${c.red("Status options missing")}: ${missing.join(", ")} · existentes: ${optNames
          .map((n) => `"${visualizeWhitespace(n)}"`)
          .join(", ")}`,
      );
    } else {
      console.log(`  ${c.green("✓")} Status tem option "Published"`);
    }
  }

  if (issues.length > 0) {
    console.log();
    for (const i of issues) console.log(`  ${i}`);
  } else {
    console.log(c.green("\n  Todas as properties batem. Preflight deveria passar."));
  }
}

async function main(): Promise<void> {
  const apiKey = process.env.NOTION_API_KEY;
  const dbId = process.env.NOTION_DATABASE_ID_BLOG;

  console.log(c.bold("=== Notion Schema Diagnostic ==="));
  console.log();
  console.log(`  NOTION_API_KEY:           ${apiKey ? c.green("set") : c.red("MISSING")} (len=${apiKey?.length ?? 0})`);
  console.log(`  NOTION_DATABASE_ID_BLOG:  ${dbId ?? c.red("MISSING")}`);
  console.log();

  if (!apiKey || !dbId) {
    console.error(c.red("Faltam env vars no .env.local. Aborta."));
    process.exit(1);
  }

  // 2 versões pra detectar diferença de schema entre versão antiga
  // (lib/notion.ts) e default do SDK (lib/notion-publish.ts).
  const versions: Array<{ label: string; v: string }> = [
    { label: "lib/notion.ts (REST direto)", v: "2022-06-28" },
    // SDK 5.x default. Se quebrar, usa explicit string mais nova.
    { label: "Notion-Version mais recente", v: "2025-09-03" },
  ];

  for (const { label, v } of versions) {
    console.log(c.bold(`\n──── Notion-Version: ${v} (${label}) ────`));
    try {
      const db = await fetchDb(apiKey, dbId, v);
      console.log(`  database id=${db.id}`);
      const dbTitle = db.title?.map((t) => t.plain_text ?? "").join("") ?? "";
      console.log(`  title="${dbTitle}"`);
      console.log();
      dumpProperties(db);
      compareToExpected(db, v);
    } catch (err) {
      console.error(c.red(`  Falhou: ${err instanceof Error ? err.message : err}`));
    }
  }

  console.log();
  console.log(c.bold("=== End ==="));
}

main().catch((err) => {
  console.error(c.red("Erro fatal:"), err);
  process.exit(1);
});
