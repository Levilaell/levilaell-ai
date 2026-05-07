import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackedLink } from "@/components/tracking/tracked-link";

export function AboutSummary() {
  return (
    <section className="border-b border-border/60">
      <div className="container-page py-20 md:py-24">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16 items-center">
          <div className="lg:col-span-4 order-2 lg:order-1">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border/60 bg-muted">
              <Image
                src="/og.png"
                alt="Levi Lael"
                fill
                sizes="(min-width: 1024px) 33vw, 100vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
          <div className="lg:col-span-8 order-1 lg:order-2">
            <span className="inline-block text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
              Sobre
            </span>
            <h2 className="heading-2">Eu sou Levi Lael.</h2>
            <div className="mt-6 space-y-5 text-base md:text-lg text-foreground/85 leading-relaxed">
              <p>
                Engenheiro de operações com IA e automação. Construo sistemas que automatizam processos repetitivos — em produção, com clientes pagantes, sem quebrar.
              </p>
              <p>
                Eu não vendo "automação". Eu vendo{" "}
                <strong className="text-foreground">operação inteligente</strong>{" "}
                — a diferença entre uma empresa que depende de gente apagando incêndio e uma que escala com previsibilidade.
              </p>
              <p className="border-l-2 border-brand pl-4">
                <strong className="block text-foreground mb-1">Minha bandeira:</strong>
                sua próxima contratação não precisa ser uma pessoa. Precisa ser um sistema.
              </p>
            </div>
            <div className="mt-8">
              <Button asChild size="lg" variant="outline" className="rounded-xl">
                <TrackedLink href="/about" trackLabel="home_about_more">
                  Conheça minha história
                  <ArrowRight className="size-4" aria-hidden />
                </TrackedLink>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
