import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArticleCard } from "@/components/blog/article-card";
import { ArticleRenderer } from "@/components/blog/article-renderer";
import { InlineDiagnosisCTA } from "@/components/blog/inline-cta";
import { PillarBadge } from "@/components/blog/pillar-badge";
import { SocialShare } from "@/components/blog/social-share";
import { getArticleBySlug, getRelatedArticles, listArticles } from "@/lib/notion";
import { siteConfig } from "@/lib/site";
import { formatLongDate } from "@/lib/utils";

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 600;

function splitMarkdownAtMidpoint(markdown: string): { before: string; after: string } {
  const paragraphs = markdown.split(/\n\n+/);
  if (paragraphs.length <= 3) return { before: markdown, after: "" };
  const mid = Math.max(2, Math.floor(paragraphs.length / 2));
  return {
    before: paragraphs.slice(0, mid).join("\n\n"),
    after: paragraphs.slice(mid).join("\n\n"),
  };
}

export async function generateStaticParams() {
  const articles = await listArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Artigo não encontrado" };

  const title = article.metaTitle ?? article.title;
  const description = article.metaDescription ?? article.excerpt;
  return {
    title,
    description,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: article.publishedAt,
      url: `${siteConfig.url}/blog/${article.slug}`,
      images: article.coverImage ? [{ url: article.coverImage }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const related = await getRelatedArticles(article);
  const { before: beforeCta, after: afterCta } = splitMarkdownAtMidpoint(article.markdown);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    inLanguage: "pt-BR",
    image: article.coverImage ? [article.coverImage] : [`${siteConfig.url}/og.png`],
    author: {
      "@type": "Person",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/og.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/blog/${article.slug}`,
    },
    articleSection: article.pillar,
    timeRequired: `PT${article.readingTime}M`,
  };

  return (
    <article className="py-12 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container-prose">
        <Button asChild variant="ghost" size="sm" className="rounded-lg mb-6 -ml-3">
          <Link href="/blog">
            <ArrowLeft className="size-4" aria-hidden /> Voltar para o blog
          </Link>
        </Button>

        <header className="border-b border-border pb-8 mb-10">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <PillarBadge pillar={article.pillar} asLink />
            <span className="text-xs text-muted-foreground">
              {formatLongDate(article.publishedAt)}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              {article.readingTime} min de leitura
            </span>
          </div>
          <h1 className="heading-display">{article.title}</h1>
          <p className="text-lead mt-5">{article.excerpt}</p>
          <div className="mt-7 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/brand/levilael-logo.png"
                alt={siteConfig.name}
                width={1326}
                height={508}
                className="h-7 w-auto mix-blend-multiply"
              />
              <p className="text-xs text-muted-foreground max-w-xs">
                Engenharia de automação para escritórios contábeis
              </p>
            </div>
            <SocialShare slug={article.slug} title={article.title} />
          </div>
        </header>

        <ArticleRenderer markdown={beforeCta} />
        {afterCta && <InlineDiagnosisCTA />}
        {afterCta && <ArticleRenderer markdown={afterCta} />}

        <footer className="mt-16 pt-10 border-t border-border">
          <SocialShare slug={article.slug} title={article.title} />
        </footer>
      </div>

      {related.length > 0 && (
        <section className="container-page mt-20">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Continue lendo
          </p>
          <div className="grid gap-5 md:grid-cols-3">
            {related.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
