import type { Metadata } from "next";
import { CheckCircle2, Sparkles } from "lucide-react";
import { LpPageTracker } from "@/components/marketing/lp-v2/lp-page-tracker";
import { LpSectionTracker } from "@/components/marketing/lp-v2/lp-section-tracker";
import { LpCtaButton } from "@/components/marketing/lp-v2/lp-cta-button";
import { LpDualCta } from "@/components/marketing/lp-v2/lp-dual-cta";

// LP do criativo "checklist 5 sinais" (ad → esta LP → diagnóstico). Estrutura de
// conversão própria (não o kit institucional): promessa do criativo acima da
// dobra + checklist de auto-identificação (micro-compromisso) + CTA repetido pro
// diagnóstico. noindex — destino de tráfego pago, não orgânico.
const LP_SLUG = "sinais-automatizar";

export const metadata: Metadata = {
  title: "5 sinais de que seu escritório contábil precisa automatizar",
  description:
    "Marque os 5 sinais. Se 3 são verdade no seu escritório, o trabalho manual já está custando caro. Diagnóstico gratuito em 2 minutos.",
  robots: { index: false, follow: false, noimageindex: true, nocache: true },
};

const SINAIS = [
  "Sua equipe organiza documento mais do que analisa.",
  "Erro de classificação custa mais do que o sistema custaria.",
  "Cliente pergunta o que já mandou por e-mail.",
  "Crescer virou sinônimo de contratar — e contratar virou problema.",
  "ERP, fiscal, Drive e WhatsApp não se conversam.",
];

export default function Page() {
  return (
    <>
      <LpPageTracker lpSlug={LP_SLUG} />

      {/* Hero — promessa do criativo + CTA imediato */}
      <section className="border-b border-border/60">
        <div className="container-page pt-16 md:pt-24 pb-14 md:pb-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background px-3 py-1 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6">
              <Sparkles className="size-3.5 text-brand" aria-hidden />
              Diagnóstico · 5 sinais
            </div>
            <h1 className="heading-display">
              Se 3 dos 5 são verdade, já tá na hora de automatizar.
            </h1>
            <p className="text-lead mt-6 mx-auto">
              Cinco sinais de que o trabalho manual já está comendo a margem do
              seu escritório contábil. Marque os que valem pro seu caso — e veja
              onde você está.
            </p>
            <div className="mt-10 flex justify-center">
              <LpCtaButton lpSlug={LP_SLUG} ctaPosition="hero" withArrow>
                Fazer diagnóstico em 2 min
              </LpCtaButton>
            </div>
          </div>
        </div>
      </section>

      {/* Checklist — auto-identificação (micro-compromisso) */}
      <LpSectionTracker lpSlug={LP_SLUG} sectionName="sinais">
        <section className="container-page py-16 md:py-20">
          <div className="mx-auto max-w-2xl">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground text-center mb-8">
              Marque o que vale pro seu escritório
            </p>
            <ul className="space-y-3">
              {SINAIS.map((sinal) => (
                <li
                  key={sinal}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card px-5 py-4"
                >
                  <CheckCircle2
                    className="mt-0.5 size-5 shrink-0 text-brand"
                    aria-hidden
                  />
                  <span className="text-base text-foreground/90">{sinal}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10 rounded-2xl border border-brand/30 bg-brand/5 px-6 py-7 text-center">
              <p className="text-lg font-semibold text-foreground">
                Marcou 3 ou mais?
              </p>
              <p className="text-muted-foreground mt-2">
                Não é impressão — é processo manual virando custo. O diagnóstico
                mapeia onde dói e o que dá pra resolver primeiro, no seu cenário.
              </p>
              <div className="mt-6 flex justify-center">
                <LpCtaButton lpSlug={LP_SLUG} ctaPosition="inline" withArrow>
                  Ver meu diagnóstico
                </LpCtaButton>
              </div>
            </div>
          </div>
        </section>
      </LpSectionTracker>

      {/* Credibilidade curta + remoção de objeção */}
      <section className="border-t border-border/60 bg-muted/20">
        <div className="container-page py-10 text-center">
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
            Quem monta o diagnóstico é o Levi — engenheiro que automatiza
            processo de escritório contábil. Não é software de prateleira: é
            análise do seu caso.{" "}
            <span className="text-foreground/80">
              Grátis · 2 minutos · sem ligação de vendedor.
            </span>
          </p>
        </div>
      </section>

      <LpDualCta
        lpSlug={LP_SLUG}
        headline="Descubra onde seu escritório perde tempo."
      />
    </>
  );
}
