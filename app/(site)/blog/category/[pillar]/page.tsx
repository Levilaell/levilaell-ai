import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/blog/article-card";
import { BlogFilters } from "@/components/blog/blog-filters";
import { BlogSidebar } from "@/components/blog/blog-sidebar";
import { listArticles } from "@/lib/notion";
import { PILLARS, PILLAR_ORDER } from "@/lib/blog/articles";
import type { Pillar } from "@/types/blog";

type Props = {
  params: Promise<{ pillar: string }>;
};

export const revalidate = 600;

export function generateStaticParams() {
  return PILLAR_ORDER.map((p) => ({ pillar: p }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pillar } = await params;
  const meta = PILLARS[pillar as Pillar];
  if (!meta) return { title: "Categoria" };
  return {
    title: meta.label,
    description: meta.description,
    alternates: { canonical: `/blog/category/${meta.slug}` },
  };
}

export default async function PillarCategoryPage({ params }: Props) {
  const { pillar } = await params;
  const meta = PILLARS[pillar as Pillar];
  if (!meta) notFound();

  const articles = await listArticles({ pillar: meta.slug });

  return (
    <section className="container-page py-16 md:py-20">
      <header className="max-w-3xl">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
          Pilar
        </p>
        <h1 className="heading-1">{meta.label}</h1>
        <p className="text-lead mt-5">{meta.description}</p>
      </header>

      <div className="mt-10">
        <BlogFilters active={meta.slug} />
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="grid gap-5 md:grid-cols-2">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
          {articles.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum artigo neste pilar ainda.
            </p>
          )}
        </div>
        <div className="lg:col-span-4">
          <BlogSidebar />
        </div>
      </div>
    </section>
  );
}
