import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { ArticleCard } from "@/components/blog/article-card";
import { listArticles } from "@/lib/notion";

export async function RecentContent() {
  const articles = await listArticles({ limit: 3 });

  if (articles.length === 0) return null;

  return (
    <section className="bg-muted/40 border-b border-border/60">
      <div className="container-page py-20 md:py-24">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <SectionHeading
            eyebrow="Conteúdo recente"
            title="Insights práticos sobre IA, automação e profissionalização de operações."
          />
          <Button asChild size="default" variant="outline" className="rounded-lg self-start md:self-end">
            <Link href="/blog">
              Ver todos os artigos
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}
