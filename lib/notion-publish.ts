import { Client } from "@notionhq/client";
import { markdownToBlocks } from "@tryfabric/martian";
import {
  PILLAR_SLUG_MAP,
  type BlogEditedOutput,
  type PipelineRow,
} from "@/types/admin";

// O nome de cada select option no Notion DB. SLUGS, não display labels —
// `lib/notion.ts` filtra por essas mesmas strings.
const PILLAR_OPTION_NAMES = Object.values(PILLAR_SLUG_MAP) as string[];

// Notion `pages.create` aceita até 100 children. Para artigos longos, criamos
// a página com os primeiros 100 e fazemos `blocks.children.append` em chunks.
const NOTION_CHILDREN_LIMIT = 100;

export class NotionPublishError extends Error {
  status: number;
  pageId?: string;
  constructor(message: string, opts: { status?: number; pageId?: string } = {}) {
    super(message);
    this.name = "NotionPublishError";
    this.status = opts.status ?? 500;
    this.pageId = opts.pageId;
  }
}

function getDatabaseId(): string {
  const id = process.env.NOTION_DATABASE_ID_BLOG;
  if (!id) {
    throw new NotionPublishError(
      "NOTION_DATABASE_ID_BLOG ausente. Defina no .env.local.",
      { status: 503 },
    );
  }
  return id;
}

function getClient(): Client {
  const key = process.env.NOTION_API_KEY;
  if (!key) {
    throw new NotionPublishError(
      "NOTION_API_KEY ausente. Defina no .env.local.",
      { status: 503 },
    );
  }
  // SDK 5.x default = "2025-09-03"; nessa versão databases.retrieve não
  // devolve properties (movidas pra data_sources). Pin na mesma versão de
  // lib/notion.ts pra os dois consumirem o mesmo schema.
  return new Client({ auth: key, notionVersion: "2022-06-28" });
}

// ---------------------------------------------------------------------------
// Preflight — valida DB existe + Pillar tem options esperadas.
// Roda antes de qualquer create. Sem isso, um DB mal-configurado retorna
// 400 do Notion difícil de ler depois de já ter consumido a IA.
// ---------------------------------------------------------------------------
export type PreflightResult =
  | { ok: true }
  | { ok: false; reason: string };

export async function preflightNotionBlog(): Promise<PreflightResult> {
  let dbId: string;
  let client: Client;
  try {
    dbId = getDatabaseId();
    client = getClient();
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "Notion não configurado.",
    };
  }

  try {
    const db = await client.databases.retrieve({ database_id: dbId });
    const props = (db as { properties?: Record<string, unknown> }).properties ?? {};

    const required = [
      ["Title", "title"],
      ["Slug", "rich_text"],
      ["Status", "select"],
      ["Pillar", "select"],
      ["Excerpt", "rich_text"],
      ["Published Date", "date"],
      ["Reading Time", "number"],
      ["Meta Title", "rich_text"],
      ["Meta Description", "rich_text"],
    ] as const;

    for (const [name, type] of required) {
      const p = props[name] as { type?: string } | undefined;
      if (!p) {
        return {
          ok: false,
          reason: `Property "${name}" não existe no Notion DB.`,
        };
      }
      if (p.type !== type) {
        return {
          ok: false,
          reason: `Property "${name}" precisa ser do tipo ${type} (atual: ${p.type}).`,
        };
      }
    }

    // Pillar precisa ter os 3 slugs como options.
    const pillarProp = props["Pillar"] as
      | { select?: { options?: Array<{ name: string }> } }
      | undefined;
    const pillarOptions =
      pillarProp?.select?.options?.map((o) => o.name) ?? [];
    const missing = PILLAR_OPTION_NAMES.filter(
      (n) => !pillarOptions.includes(n),
    );
    if (missing.length > 0) {
      return {
        ok: false,
        reason: `Pillar select precisa ter as options: ${missing.join(", ")}. Crie no Notion antes.`,
      };
    }

    // Status precisa ter "Published".
    const statusProp = props["Status"] as
      | { select?: { options?: Array<{ name: string }> } }
      | undefined;
    const statusOptions =
      statusProp?.select?.options?.map((o) => o.name) ?? [];
    if (!statusOptions.includes("Published")) {
      return {
        ok: false,
        reason: 'Status select precisa ter a option "Published".',
      };
    }

    return { ok: true };
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 404) {
      return {
        ok: false,
        reason: "Notion DB não encontrado. Cheque NOTION_DATABASE_ID_BLOG.",
      };
    }
    return {
      ok: false,
      reason:
        err instanceof Error ? err.message : "Erro ao validar Notion DB.",
    };
  }
}

// ---------------------------------------------------------------------------
// Publish — cria página + faz append de chunks adicionais
// ---------------------------------------------------------------------------
export type PublishResult = {
  pageId: string;
  url: string;
  totalBlocks: number;
};

export async function publishArticleToNotion(
  entry: PipelineRow,
): Promise<PublishResult> {
  const content = (entry.edited_content ?? entry.generated_content) as
    | BlogEditedOutput
    | null;
  if (!content) {
    throw new NotionPublishError(
      "Sem conteúdo gerado/editado pra publicar.",
      { status: 400 },
    );
  }

  const dbId = getDatabaseId();
  const client = getClient();
  const pillarSlug = PILLAR_SLUG_MAP[content.pillar];

  // martian retorna BlockObjectRequest[] — compatível com SDK.
  const allBlocks = markdownToBlocks(content.content_markdown);
  const firstBlocks = allBlocks.slice(0, NOTION_CHILDREN_LIMIT);
  const restBlocks = allBlocks.slice(NOTION_CHILDREN_LIMIT);

  const properties = {
    Title: { title: [{ text: { content: content.title } }] },
    Slug: { rich_text: [{ text: { content: content.slug } }] },
    Status: { select: { name: "Published" } },
    Pillar: { select: { name: pillarSlug } },
    Excerpt: { rich_text: [{ text: { content: content.excerpt } }] },
    "Published Date": { date: { start: new Date().toISOString() } },
    "Reading Time": { number: content.reading_time_minutes },
    "Meta Title": { rich_text: [{ text: { content: content.meta_title } }] },
    "Meta Description": {
      rich_text: [{ text: { content: content.meta_description } }],
    },
    Featured: { checkbox: false },
  };

  let page;
  try {
    page = await client.pages.create({
      parent: { database_id: dbId },
      properties: properties as Parameters<
        typeof client.pages.create
      >[0]["properties"],
      children: firstBlocks as Parameters<
        typeof client.pages.create
      >[0]["children"],
    });
  } catch (err) {
    const status = (err as { status?: number }).status;
    throw new NotionPublishError(
      err instanceof Error ? err.message : "Erro ao criar página no Notion.",
      { status: status ?? 500 },
    );
  }

  const pageId = (page as { id: string }).id;
  const pageUrl =
    (page as { url?: string }).url ??
    `https://www.notion.so/${pageId.replace(/-/g, "")}`;

  // Append remaining chunks. Se falhar, page existe — devolve erro com
  // pageId pra retry continuar de onde parou (o caller persiste pageId
  // antes de tentar de novo).
  for (let i = 0; i < restBlocks.length; i += NOTION_CHILDREN_LIMIT) {
    const chunk = restBlocks.slice(i, i + NOTION_CHILDREN_LIMIT);
    try {
      await client.blocks.children.append({
        block_id: pageId,
        children: chunk as Parameters<
          typeof client.blocks.children.append
        >[0]["children"],
      });
    } catch (err) {
      const status = (err as { status?: number }).status;
      throw new NotionPublishError(
        `Página criada (${pageId}) mas falhou ao adicionar bloco ${i + NOTION_CHILDREN_LIMIT}+: ${
          err instanceof Error ? err.message : "erro"
        }`,
        { status: status ?? 500, pageId },
      );
    }
  }

  return {
    pageId,
    url: pageUrl,
    totalBlocks: allBlocks.length,
  };
}
