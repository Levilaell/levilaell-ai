import type { Metadata } from "next";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { SchedulingButton } from "@/components/ui/scheduling-button";
import { TrackedLink } from "@/components/tracking/tracked-link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Serviços",
  description:
    "Três formas de trabalhar comigo: automação sob demanda, sprint de IA dedicado e desenvolvedor dedicado mensal.",
  alternates: { canonical: "/services" },
};

const packages = [
  {
    icon: "🛠️",
    title: "Automação Sob Demanda",
    description:
      "Você me traz o problema; eu construo a solução técnica. Pode ser uma integração específica, um agente de IA, um pipeline de dados, um webhook handler robusto, ou qualquer sistema que automatize um processo seu.",
    price: "A partir de R$ 2.500",
    timeline: "Entrega em 1-2 semanas",
    idealFor:
      "Empresas que já sabem o que precisam construir e querem alguém técnico pra entregar bem feito.",
    cta: "Quero automatizar",
    serviceParam: "automation",
    featured: false,
  },
  {
    icon: "🚀",
    title: "Sprint de IA",
    description:
      "Sprint focado pra colocar UM caso de uso de IA rodando em produção na sua empresa. Inclui: arquitetura, implementação, deploy, telemetria de custo e documentação técnica.",
    price: "R$ 7.500",
    timeline: "Entrega em 2 semanas",
    idealFor:
      "Empresas que querem IA real (não POC) num caso de uso específico — atendimento, análise de documentos, geração de conteúdo, etc.",
    cta: "Quero o sprint",
    serviceParam: "ai-sprint",
    featured: true,
  },
  {
    icon: "👨‍💻",
    title: "Desenvolvedor Dedicado",
    description:
      "Trabalho 40h/mês com você como desenvolvedor remoto dedicado: construo, mantenho, evoluo seus sistemas de automação e IA. Reuniões semanais. Stack 100% sua.",
    price: "R$ 5.000/mês",
    timeline: "Mínimo 2 meses",
    idealFor:
      "Empresas com várias necessidades técnicas contínuas que preferem horas dedicadas em vez de projetos fechados.",
    cta: "Quero parceria",
    serviceParam: "dedicated-dev",
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
      "Toda parceria começa com o diagnóstico gratuito do site. Em 2 minutos, a IA identifica onde faz sentido começar.",
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
          description="Da automação pontual à parceria contínua como desenvolvedor dedicado."
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
              <p className="mt-5 text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Ideal para:</strong>{" "}
                {p.idealFor}
              </p>
              <Button
                asChild
                size="lg"
                variant={p.featured ? "brand" : "outline"}
                className="mt-7 rounded-xl"
              >
                <TrackedLink
                  href={`/contact?service=${p.serviceParam}`}
                  trackLabel={`services_card_${p.serviceParam}`}
                >
                  {p.cta} <ArrowRight className="size-4" aria-hidden />
                </TrackedLink>
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
              <TrackedLink
                href="/diagnosis"
                trackLabel="services_final_diagnosis"
              >
                Iniciar diagnóstico
                <ArrowRight className="size-4" aria-hidden />
              </TrackedLink>
            </Button>
            <SchedulingButton
              size="xl"
              variant="white"
              subject="Conversa sobre serviços — Levi Lael"
              label="Agendar call gratuita"
            />
          </div>
        </div>
      </section>
    </>
  );
}
