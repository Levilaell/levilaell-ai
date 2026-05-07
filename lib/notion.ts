import { Client as NotionClient } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import type { Article, ArticleSummary, Pillar } from "@/types/blog";
import { mockArticles, mockArticleMarkdown } from "@/lib/blog/articles";

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28"; // Estável: ainda devolve properties direto.

export function isNotionConfigured(): boolean {
  return Boolean(process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID_BLOG);
}

let client: NotionClient | null = null;
function getClient(): NotionClient | null {
  if (!process.env.NOTION_API_KEY) return null;
  if (!client) {
    client = new NotionClient({
      auth: process.env.NOTION_API_KEY,
      notionVersion: NOTION_VERSION,
    });
  }
  return client;
}

let n2m: NotionToMarkdown | null = null;
function getN2M(): NotionToMarkdown | null {
  const c = getClient();
  if (!c) return null;
  if (!n2m) n2m = new NotionToMarkdown({ notionClient: c });
  return n2m;
}

async function notionFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const key = process.env.NOTION_API_KEY!;
  const res = await fetch(`${NOTION_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Notion API ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Property extractors — defensivos
// ---------------------------------------------------------------------------
type NotionProp = Record<string, unknown>;

function extractTitle(prop: NotionProp | undefined): string {
  if (!prop) return "";
  const title = prop.title as Array<{ plain_text?: string }> | undefined;
  return Array.isArray(title) ? title.map((t) => t.plain_text ?? "").join("") : "";
}

function extractRichText(prop: NotionProp | undefined): string {
  if (!prop) return "";
  const rt = prop.rich_text as Array<{ plain_text?: string }> | undefined;
  return Array.isArray(rt) ? rt.map((t) => t.plain_text ?? "").join("") : "";
}

function extractSelect(prop: NotionProp | undefined): string {
  if (!prop) return "";
  const sel = prop.select as { name?: string } | null | undefined;
  return sel?.name ?? "";
}

function extractDate(prop: NotionProp | undefined): string {
  if (!prop) return "";
  const d = prop.date as { start?: string } | null | undefined;
  return d?.start ?? "";
}

function extractNumber(prop: NotionProp | undefined): number {
  if (!prop) return 0;
  return typeof prop.number === "number" ? prop.number : 0;
}

function extractCheckbox(prop: NotionProp | undefined): boolean {
  if (!prop) return false;
  return prop.checkbox === true;
}

function extractFileUrl(prop: NotionProp | undefined): string | undefined {
  if (!prop) return undefined;
  const files = prop.files as
    | Array<{ file?: { url?: string }; external?: { url?: string } }>
    | undefined;
  if (!Array.isArray(files) || files.length === 0) return undefined;
  return files[0].file?.url ?? files[0].external?.url ?? undefined;
}

type NotionPage = {
  id: string;
  created_time?: string;
  properties?: Record<string, NotionProp>;
};

function pageToSummary(page: NotionPage): ArticleSummary | null {
  const props = page.properties ?? {};
  const slug = extractRichText(props["Slug"] as NotionProp);
  const title = extractTitle(props["Title"] as NotionProp);
  const status = extractSelect(props["Status"] as NotionProp);
  if (!slug || !title || status !== "Published") return null;

  const pillar = extractSelect(props["Pillar"] as NotionProp) as Pillar;
  if (!pillar) return null;

  return {
    id: page.id,
    slug,
    title,
    excerpt: extractRichText(props["Excerpt"] as NotionProp),
    pillar,
    publishedAt:
      extractDate(props["Published Date"] as NotionProp) || page.created_time || "",
    readingTime: extractNumber(props["Reading Time"] as NotionProp) || 5,
    featured: extractCheckbox(props["Featured"] as NotionProp),
    coverImage: extractFileUrl(props["Cover Image"] as NotionProp),
    metaTitle: extractRichText(props["Meta Title"] as NotionProp) || undefined,
    metaDescription:
      extractRichText(props["Meta Description"] as NotionProp) || undefined,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export async function listArticles(options?: {
  pillar?: string;
  limit?: number;
}): Promise<ArticleSummary[]> {
  if (!isNotionConfigured()) {
    let list = [...mockArticles];
    if (options?.pillar) list = list.filter((a) => a.pillar === options.pillar);
    list.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
    if (options?.limit) list = list.slice(0, options.limit);
    return list;
  }

  const dbId = process.env.NOTION_DATABASE_ID_BLOG!;
  const filterAnd: Array<Record<string, unknown>> = [
    { property: "Status", select: { equals: "Published" } },
  ];
  if (options?.pillar) {
    filterAnd.push({ property: "Pillar", select: { equals: options.pillar } });
  }

  try {
    const response = await notionFetch<{ results: NotionPage[] }>(
      `/databases/${encodeURIComponent(dbId)}/query`,
      {
        method: "POST",
        body: JSON.stringify({
          filter: { and: filterAnd },
          sorts: [{ property: "Published Date", direction: "descending" }],
          page_size: options?.limit ?? 50,
        }),
      },
    );
    const summaries = response.results
      .map(pageToSummary)
      .filter((a): a is ArticleSummary => a !== null);
    return options?.limit ? summaries.slice(0, options.limit) : summaries;
  } catch (err) {
    console.error("[notion] listArticles error:", err);
    return [];
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (!isNotionConfigured()) {
    const summary = mockArticles.find((a) => a.slug === slug);
    if (!summary) return null;
    return { ...summary, markdown: mockArticleMarkdown[slug] ?? "" };
  }

  const dbId = process.env.NOTION_DATABASE_ID_BLOG!;
  const md = getN2M();
  if (!md) return null;

  try {
    const response = await notionFetch<{ results: NotionPage[] }>(
      `/databases/${encodeURIComponent(dbId)}/query`,
      {
        method: "POST",
        body: JSON.stringify({
          filter: {
            and: [
              { property: "Status", select: { equals: "Published" } },
              { property: "Slug", rich_text: { equals: slug } },
            ],
          },
          page_size: 1,
        }),
      },
    );

    const page = response.results[0];
    if (!page) return null;

    const summary = pageToSummary(page);
    if (!summary) return null;

    const blocks = await md.pageToMarkdown(page.id);
    const mdString = md.toMarkdownString(blocks);
    const markdown = typeof mdString === "string" ? mdString : (mdString.parent ?? "");

    return { ...summary, markdown };
  } catch (err) {
    console.error("[notion] getArticleBySlug error:", err);
    return null;
  }
}

export async function getFeaturedArticle(): Promise<ArticleSummary | null> {
  const articles = await listArticles();
  return articles.find((a) => a.featured) ?? articles[0] ?? null;
}

export async function getRelatedArticles(
  current: ArticleSummary,
  limit = 3,
): Promise<ArticleSummary[]> {
  const all = await listArticles();
  return all
    .filter((a) => a.slug !== current.slug && a.pillar === current.pillar)
    .slice(0, limit);
}
