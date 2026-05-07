import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { SchedulingButton } from "@/components/ui/scheduling-button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Serviços",
  description:
    "Três formas de trabalhar comigo: diagnóstico estratégico, automação sob medida e operação inteligente como parceria contínua.",
  alternates: { canonical: "/services" },
};

const packages = [
  {
    icon: "🎯",
    title: "Diagnóstico Estratégico",
    description:
      "Análise profunda da sua operação com mapa de oportunidades priorizado e roadmap de 90 dias.",
    price: "A partir de R$ 3.000",
    timeline: "Entrega em 2 semanas",
    cta: "Quero o diagnóstico",
    serviceParam: "diagnosis",
    featured: false,
  },
  {
    icon: "⚙️",
    title: "Automação Sob Medida",
    description:
      "Implementação de automações específicas que você (ou o diagnóstico) já identificou.",
    price: "A partir de R$ 8.000",
    timeline: "Entrega em 3-6 semanas",
    cta: "Quero automatizar",
    serviceParam: "automation",
    featured: true,
  },
  {
    icon: "🚀",
    title: "Operação Inteligente",
    description:
      "Parceria contínua: eu cuido da estratégia, implementação e evolução da sua operação automatizada.",
    price: "A partir de R$ 6.000/mês",
    timeline: "Mínimo 3 meses",
    cta: "Quero parceria",
    serviceParam: "partnership",
    featured: false,
  },
] as const;

const notList = [
  {
    title: "Não sou ferramenta no-code.",
    detail:
      "Se você quer alguém que liga blocos do Zapier por R$ 500, não sou eu. Faço engenharia de operação — não montagem de fluxograma.",
  },
  {
    title: "Não vendo 'transformação digital' genérica.",
    detail:
      "Não trabalho com promessa vaga. Cada projeto tem escopo, métrica e prazo definidos.",
  },
  {
    title: "Não trabalho com quem quer terceirizar pensamento.",
    detail:
      "Eu construo o sistema, mas a estratégia precisa ser conjunta. Empresas que querem entregar tudo na minha mão vão se decepcionar.",
  },
  {
    title: "Não pego qualquer projeto.",
    detail:
      "Se eu não for a melhor pessoa pro seu caso, eu indico quem é.",
  },
];

const process = [
  {
    title: "Diagnóstico",
    detail:
      "Toda parceria começa com diagnóstico — gratuito ou pago, dependendo da profundidade.",
  },
  {
    title: "Proposta clara",
    detail:
      "Você recebe escopo, métricas, prazo e investimento por escrito.",
  },
  {
    title: "Implementação",
    detail:
      "Eu construo, testo, integro. Você acompanha em ambiente compartilhado.",
  },
  {
    title: "Documentação e handoff",
    detail:
      "Você fica com tudo: código, fluxos, manuais.",
  },
];

export default function ServicesPage() {
  return (
    <>
      <section className="container-page py-20 md:py-24">
        <SectionHeading
          eyebrow="Serviços"
          title="Três formas de trabalhar comigo."
          description="Da automação pontual à transformação completa da sua operação."
          as="h1"
          align="center"
        />
      </section>

      <section className="container-page pb-20 md:pb-24">
        <div className="grid gap-5 md:grid-cols-3 items-stretch">
          {packages.map((p) => (
            <article
              key={p.title}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-7 md:p-8",
                p.featured
                  ? "border-foreground shadow-lg ring-1 ring-foreground/5"
                  : "border-border",
              )}
            >
              {p.featured && (
                <div className="absolute -top-3 left-7 inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-3 py-1 text-xs font-medium">
                  <Star className="size-3" aria-hidden /> Mais escolhido
                </div>
              )}
              <span className="text-3xl mb-4" aria-hidden>
                {p.icon}
              </span>
              <h2 className="font-semibold text-xl tracking-tight">{p.title}</h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">
                {p.description}
              </p>
              <dl className="mt-6 space-y-3 border-t border-border pt-5 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Investimento</dt>
                  <dd className="font-medium">{p.price}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Prazo</dt>
                  <dd className="font-medium">{p.timeline}</dd>
                </div>
              </dl>
              <Button
                asChild
                size="lg"
                variant={p.featured ? "brand" : "outline"}
                className="mt-7 rounded-xl"
              >
                <Link href={`/contact?service=${p.serviceParam}`}>
                  {p.cta} <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-muted/40 border-y border-border/60">
        <div className="container-page py-20 md:py-24">
          <SectionHeading
            eyebrow="Honestidade"
            title="O que eu NÃO sou."
            description="Filtro propositalmente quem trabalha comigo. Se você se reconhece em algum dos pontos abaixo, somos um match difícil."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {notList.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-border bg-card p-6 md:p-7"
              >
                <p className="font-semibold text-base md:text-lg">{item.title}</p>
                <p className="mt-2 text-sm md:text-base text-muted-foreground leading-relaxed">
                  {item.detail}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-20 md:py-24">
        <SectionHeading
          eyebrow="Processo"
          title="Como trabalhamos"
          align="center"
        />
        <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {process.map((step, i) => (
            <li
              key={step.title}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <span className="font-mono text-3xl font-semibold text-brand block mb-4">
                0{i + 1}
              </span>
              <p className="font-semibold text-base">{step.title}</p>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {step.detail}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-zinc-950 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-950">
        <div className="container-page py-20 md:py-24 text-center">
          <h2 className="heading-2">Não sabe ainda qual pacote faz sentido?</h2>
          <p className="text-lead mt-4 max-w-xl mx-auto !text-zinc-300 dark:!text-zinc-700">
            Faça o diagnóstico gratuito. Em 2 minutos a IA recomenda a abordagem certa pro seu caso. Ou agende uma call comigo direto, se preferir conversar primeiro.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="xl" variant="brand" className="rounded-xl">
              <Link href="/diagnosis">
                Iniciar diagnóstico
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <SchedulingButton
              size="xl"
              variant="outline"
              subject="Conversa sobre serviços — Levi Lael"
              label="Agendar call gratuita"
            />
          </div>
        </div>
      </section>
    </>
  );
}
