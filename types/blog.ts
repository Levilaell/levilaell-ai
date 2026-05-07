export type Pillar = "ai-applied" | "automation-stack" | "professional-operations";

export type PillarMeta = {
  slug: Pillar;
  label: string;
  short: string;
  description: string;
  className: string;
};

export type ArticleSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  pillar: Pillar;
  publishedAt: string;
  readingTime: number;
  featured: boolean;
  coverImage?: string;
  metaTitle?: string;
  metaDescription?: string;
};

export type ArticleBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "quote"; text: string; cite?: string }
  | { type: "callout"; tone: "info" | "warning" | "success"; text: string }
  | { type: "code"; language: string; code: string };

export type Article = ArticleSummary & {
  blocks: ArticleBlock[];
};
