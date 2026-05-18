import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackedLink } from "@/components/tracking/tracked-link";
import { SchedulingButton } from "@/components/ui/scheduling-button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="container-page pt-16 md:pt-24 pb-16 md:pb-20">
        <div className="grid gap-10 lg:grid-cols-5 lg:gap-16 items-center">
          <div className="lg:col-span-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background px-3 py-1 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6">
              <Sparkles className="size-3.5 text-brand" aria-hidden />
              Para escritórios contábeis
            </div>
            <h1 className="heading-display">
              Automação de processos para escritórios contábeis que querem{" "}
              <span className="bg-foreground text-background px-2 rounded-md whitespace-nowrap">
                crescer sem virar
              </span>{" "}
              empresa de tecnologia.
            </h1>
            <p className="text-lead mt-6 max-w-2xl">
              Faça o diagnóstico gratuito e descubra, em 2 minutos, onde sua
              operação está perdendo tempo, dinheiro e oportunidades — com uma
              análise gerada por IA personalizada para o seu negócio.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="xl" variant="brand" className="rounded-xl">
                <TrackedLink href="/diagnosis" trackLabel="home_hero_diagnosis">
                  Iniciar diagnóstico
                  <ArrowRight className="size-4" aria-hidden />
                </TrackedLink>
              </Button>
              <SchedulingButton
                size="xl"
                variant="secondary"
                source="home_hero"
                subject="Conversa inicial — site"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <DiagnosisPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

function DiagnosisPreview() {
  return (
    <div className="relative">
      <div
        className="absolute -inset-2 rounded-[2rem] bg-gradient-to-br from-brand/40 via-brand/10 to-transparent blur-2xl opacity-60"
        aria-hidden
      />
      <div className="relative rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span>DIAGNÓSTICO · 2 MIN</span>
          <span>EM PROGRESSO</span>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full w-[12%] bg-brand" />
        </div>

        <p className="mt-6 text-sm font-mono uppercase tracking-widest text-muted-foreground">
          Pergunta 1
        </p>
        <h3 className="mt-2 heading-3">
          O que melhor descreve sua empresa hoje?
        </h3>

        <ul className="mt-5 space-y-2.5">
          {[
            "Profissional autônomo / freelancer",
            "Empresa pequena (até 10 pessoas)",
            "Empresa em crescimento (11-50 pessoas)",
            "Empresa estabelecida (50+ pessoas)",
          ].map((opt, i) => (
            <li
              key={opt}
              className="rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground/90 hover:border-brand/40 hover:bg-muted transition-colors flex items-center justify-between"
            >
              <span>{opt}</span>
              {i === 1 && (
                <span className="text-xs text-muted-foreground font-mono">
                  ↵
                </span>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono">Pressione ↵ para responder</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
            preview
          </span>
        </div>
      </div>
    </div>
  );
}
