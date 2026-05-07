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

export type Article = ArticleSummary & {
  markdown: string;
};
