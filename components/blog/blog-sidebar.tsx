import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArticleCard } from "@/components/blog/article-card";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { TrackedLink } from "@/components/tracking/tracked-link";
import { listArticles } from "@/lib/notion";

export async function BlogSidebar() {
  const popular = (await listArticles({ limit: 3 })).slice(0, 3);

  return (
    <aside className="space-y-8">
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Newsletter
        </p>
        <h3 className="font-semibold text-base mb-2">
          Insight semanal direto no e-mail.
        </h3>

        <NewsletterForm source="blog_sidebar" variant="compact" />
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-amber-900 dark:text-amber-100 mb-3">
          Diagnóstico gratuito
        </p>
        <h3 className="font-semibold text-amber-950 dark:text-amber-100 mb-3">
          Onde sua operação está perdendo tempo?
        </h3>
        <Button
          asChild
          size="default"
          variant="brand"
          className="rounded-lg w-full"
        >
          <TrackedLink href="/diagnosis" trackLabel="blog_sidebar_diagnosis">
            Iniciar diagnóstico
            <ArrowRight className="size-4" aria-hidden />
          </TrackedLink>
        </Button>
      </div>

      {popular.length > 0 && (
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">
            Mais lidos
          </p>
          <div className="space-y-3">
            {popular.map((a) => (
              <ArticleCard key={a.id} article={a} variant="compact" />
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
