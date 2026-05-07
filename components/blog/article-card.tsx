import Link from "next/link";
import { PillarBadge } from "@/components/blog/pillar-badge";
import { formatDate } from "@/lib/utils";
import type { ArticleSummary } from "@/types/blog";

type Variant = "default" | "compact" | "featured";

type Props = {
  article: ArticleSummary;
  variant?: Variant;
};

export function ArticleCard({ article, variant = "default" }: Props) {
  if (variant === "featured") {
    return (
      <Link
        href={`/blog/${article.slug}`}
        className="group block rounded-2xl border border-border bg-card p-6 md:p-8 hover:shadow-md transition-all"
      >
        <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-muted-foreground">
          <PillarBadge pillar={article.pillar} />
          <span>{formatDate(article.publishedAt)}</span>
          <span>·</span>
          <span>{article.readingTime} min de leitura</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight leading-tight group-hover:underline decoration-brand decoration-2 underline-offset-4">
          {article.title}
        </h2>
        <p className="mt-4 text-base text-muted-foreground leading-relaxed">
          {article.excerpt}
        </p>
        <p className="mt-5 text-sm font-medium text-foreground">
          Ler artigo →
        </p>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link
        href={`/blog/${article.slug}`}
        className="group block rounded-xl border border-border bg-card p-4 hover:border-brand/40 transition-colors"
      >
        <div className="flex items-center gap-2 mb-2">
          <PillarBadge pillar={article.pillar} />
        </div>
        <h3 className="font-semibold text-sm leading-snug group-hover:underline">
          {article.title}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {article.readingTime} min · {formatDate(article.publishedAt)}
        </p>
      </Link>
    );
  }

  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group flex flex-col rounded-2xl border border-border bg-card p-6 hover:shadow-sm hover:border-brand/40 transition-all h-full"
    >
      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs text-muted-foreground">
        <PillarBadge pillar={article.pillar} />
      </div>
      <h3 className="font-semibold text-lg leading-snug group-hover:underline decoration-brand decoration-2 underline-offset-4">
        {article.title}
      </h3>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">
        {article.excerpt}
      </p>
      <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatDate(article.publishedAt)}</span>
        <span>{article.readingTime} min de leitura</span>
      </div>
    </Link>
  );
}
