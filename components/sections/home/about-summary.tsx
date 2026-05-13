import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackedLink } from "@/components/tracking/tracked-link";

export function AboutSummary() {
  return (
    <section className="border-b border-border/60">
      <div className="container-page py-20 md:py-24">
        <div className="max-w-3xl">
          <span className="inline-block text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
            Quem somos
          </span>
          <h2 className="heading-2">
            Engenharia de automação para escritórios contábeis.
          </h2>
          <div className="mt-6 space-y-5 text-base md:text-lg text-foreground/85 leading-relaxed">
            <p>
              Combinamos engenharia técnica (sistemas de IA em produção em
              fintech e automação B2B) com experiência em contabilidade e
              gestão financeira.
            </p>
            <p>
              Construímos sistema sob medida pro fluxo do seu escritório.
              Não SaaS pronto. Revisão humana onde importa.
            </p>
          </div>
          <div className="mt-8">
            <Button asChild size="lg" variant="outline" className="rounded-xl">
              <TrackedLink href="/about" trackLabel="home_about_more">
                Saiba mais sobre a equipe
                <ArrowRight className="size-4" aria-hidden />
              </TrackedLink>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
