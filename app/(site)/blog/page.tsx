import type { Metadata } from "next";
import { ArticleCard } from "@/components/blog/article-card";
import { BlogFilters } from "@/components/blog/blog-filters";
import { BlogSidebar } from "@/components/blog/blog-sidebar";
import { listArticles, getFeaturedArticle } from "@/lib/notion";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Insights práticos sobre IA aplicada, automação com n8n e profissionalização de operações.",
  alternates: { canonical: "/blog" },
};

export const revalidate = 600;

export default async function BlogPage() {
  const [allArticles, featured] = await Promise.all([
    listArticles(),
    getFeaturedArticle(),
  ]);
  const restArticles = featured
    ? allArticles.filter((a) => a.id !== featured.id)
    : allArticles;

  return (
    <section className="container-page py-16 md:py-20">
      <header className="max-w-3xl">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
          Conteúdo
        </p>
        <h1 className="heading-1">
          Insights sobre IA, automação e profissionalização de operações.
        </h1>
        <p className="text-lead mt-5">
          Conteúdo para quem decide e para quem implementa.
        </p>
      </header>

      <div className="mt-10">
        <BlogFilters active="all" />
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-12">
          {featured && (
            <section>
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
                Em destaque
              </p>
              <ArticleCard article={featured} variant="featured" />
            </section>
          )}

          <section>
            {featured && (
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-5">
                Todos os artigos
              </p>
            )}
            <div className="grid gap-5 md:grid-cols-2">
              {restArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
            {restArticles.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum artigo publicado ainda.
              </p>
            )}
          </section>
        </div>

        <div className="lg:col-span-4">
          <BlogSidebar />
        </div>
      </div>
    </section>
  );
}
