import { Client } from "@notionhq/client";
import type { Article, ArticleSummary } from "@/types/blog";
import { mockArticles, mockArticleBlocks } from "@/lib/blog/articles";

export function isNotionConfigured(): boolean {
  return Boolean(process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID_BLOG);
}

let client: Client | null = null;
function getClient(): Client | null {
  if (!process.env.NOTION_API_KEY) return null;
  if (!client) client = new Client({ auth: process.env.NOTION_API_KEY });
  return client;
}

export async function listArticles(options?: {
  pillar?: string;
  limit?: number;
}): Promise<ArticleSummary[]> {
  if (!isNotionConfigured()) {
    let articles = [...mockArticles];
    if (options?.pillar) {
      articles = articles.filter((a) => a.pillar === options.pillar);
    }
    articles.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
    if (options?.limit) articles = articles.slice(0, options.limit);
    return articles;
  }

  // TODO: Real Notion query when configured
  return [];
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (!isNotionConfigured()) {
    const summary = mockArticles.find((a) => a.slug === slug);
    if (!summary) return null;
    return { ...summary, blocks: mockArticleBlocks[slug] ?? [] };
  }

  // TODO: Real Notion query when configured
  return null;
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

// Marker for future Notion integration. Avoids "unused import" complaint.
void getClient;
