import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { LpPageTracker } from "@/components/marketing/lp-v2/lp-page-tracker";
import { LpSectionTracker } from "@/components/marketing/lp-v2/lp-section-tracker";
import { LpCtaButton } from "@/components/marketing/lp-v2/lp-cta-button";
import { LpDualCta } from "@/components/marketing/lp-v2/lp-dual-cta";

// LP do criativo "pergunta pro sócio: arrumar vs analisar" (ad → esta LP →
// diagnóstico). Estrutura própria: pergunta provocativa acima da dobra +
// contraste arrumar/analisar (custo do trabalho que não escala) + CTA pro
// diagnóstico. noindex — destino de tráfego pago.
const LP_SLUG = "arrumar-ou-analisar";

export const metadata: Metadata = {
  title: "Sua equipe está arrumando ou analisando? | Levi Lael",
  description:
    "Quanto da sua equipe contábil gasta tempo organizando documento em vez de analisar? O diagnóstico gratuito em 2 minutos mostra o número.",
  robots: { index: false, follow: false, noimageindex: true, nocache: true },
};

const ARRUMANDO = [
  "Baixar e renomear anexo",
  "Conferir se chegou tudo",
  "Cobrar o documento que falta",
  "Digitar nota a nota no sistema",
  "Procurar arquivo no WhatsApp",
];

const ANALISANDO = [
  "Fechar no prazo, sem correria",
  "Planejamento tributário",
  "Consultoria que o cliente paga",
  "Relacionamento e retenção de cliente",
];

export default function Page() {
  return (
    <>
      <LpPageTracker lpSlug={LP_SLUG} />

      {/* Hero — a pergunta provocativa + CTA */}
      <section className="border-b border-border/60">
        <div className="container-page pt-16 md:pt-24 pb-14 md:pb-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background px-3 py-1 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6">
              <Sparkles className="size-3.5 text-brand" aria-hidden />
              Pergunta honesta · pra sócio
            </div>
            <h1 className="heading-display">
              Quanto da sua equipe está arrumando — e quanto está analisando?
            </h1>
            <p className="text-lead mt-6 mx-auto">
              Se você não sabe responder de cabeça, já é a resposta. Todo mês
              some um caminhão de hora qualificada em tarefa de organização:
              baixar anexo, renomear, conferir, cobrar quem não mandou.
            </p>
            <div className="mt-10 flex justify-center">
              <LpCtaButton lpSlug={LP_SLUG} ctaPosition="hero" withArrow>
                Descobrir meu número
              </LpCtaButton>
            </div>
          </div>
        </div>
      </section>

      {/* Contraste arrumar vs analisar */}
      <LpSectionTracker lpSlug={LP_SLUG} sectionName="contraste">
        <section className="container-page py-16 md:py-20">
          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="mb-4 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Arrumando
              </p>
              <ul className="space-y-2.5">
                {ARRUMANDO.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-foreground/80"
                  >
                    <span
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/50"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm text-muted-foreground">
                Trabalho que o cliente não vê e não paga a mais. E não escala —
                cresceu, contrata.
              </p>
            </div>
            <div className="rounded-2xl border border-brand/30 bg-brand/5 p-6">
              <p className="mb-4 text-xs font-mono uppercase tracking-widest text-brand">
                Analisando
              </p>
              <ul className="space-y-2.5">
                {ANALISANDO.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-foreground/90"
                  >
                    <span
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-brand"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm text-muted-foreground">
                O que o cliente valoriza, paga melhor e te diferencia.
              </p>
            </div>
          </div>
          <div className="mx-auto mt-10 max-w-2xl text-center">
            <p className="text-lead">
              Cada hora em arrumação é hora que não vira receita. O diagnóstico
              mede esse buraco e mostra o que dá pra tirar da mão do seu time
              primeiro.
            </p>
            <div className="mt-8 flex justify-center">
              <LpCtaButton lpSlug={LP_SLUG} ctaPosition="inline" withArrow>
                Ver meu diagnóstico
              </LpCtaButton>
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
        headline="Descubra quanto seu time gasta arrumando papel."
      />
    </>
  );
}
