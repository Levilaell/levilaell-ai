import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { listArticles } from "@/lib/notion";
import { examples } from "@/content/examples";
import { PILLAR_ORDER } from "@/lib/blog/articles";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, "");
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "/",
    "/automacao-contabil",
    "/diagnosis",
    "/about",
    "/blog",
    "/newsletter",
    "/contact",
    "/privacy",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.8,
  }));

  const pillarRoutes: MetadataRoute.Sitemap = PILLAR_ORDER.map((pillar) => ({
    url: `${base}/blog/category/${pillar}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const articles = await listArticles();
  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${base}/blog/${article.slug}`,
    lastModified: new Date(article.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const exampleRoutes: MetadataRoute.Sitemap = examples.map((example) => ({
    url: `${base}/diagnosis/examples/${example.slug}`,
    lastModified: new Date(example.publishedAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...pillarRoutes, ...articleRoutes, ...exampleRoutes];
}
