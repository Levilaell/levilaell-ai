import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackedLink } from "@/components/tracking/tracked-link";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "Engenheiro de operações com IA e automação. Como cheguei aqui, no que acredito, e como trabalho.",
  alternates: { canonical: "/about" },
};

const stack = [
  "n8n",
  "Make",
  "Python",
  "Node.js",
  "APIs REST",
  "LLMs (Claude, GPT)",
  "Supabase",
  "PostgreSQL",
];

const specialties = [
  "Agentes de IA",
  "Automação de processos",
  "Integração de sistemas",
  "Análise de documentos com LLM",
  "Pipelines de dados",
  "Workflows internos",
];

export default function AboutPage() {
  return (
    <>
      <section className="container-page py-16 md:py-20">
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
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
              Sobre
            </p>
            <h1 className="heading-display">Eu sou Levi Lael.</h1>
            <p className="text-lead mt-6">
              Engenheiro de operações com IA e automação. Tradutor profissional de caos em sistema.
            </p>
          </div>
        </div>
      </section>

      <section className="container-prose pb-16 md:pb-20">
        <h2 className="heading-2">Como cheguei aqui</h2>
        <div className="mt-10 space-y-12">
          <Act
            title="Ato 1 — O começo"
            paragraphs={[
              "Comecei a programar antes de saber por quê. Era o tipo de adolescente que abria computador pra ver como funcionava por dentro — e quase sempre fechava com peça sobrando.",
              "Em 2023 entrei como estagiário numa agência, fazendo HTML e CSS pra clientes. Foi onde percebi que código não era o trabalho real: o trabalho real era operação. As pessoas não me pagavam pra escrever divs — me pagavam pra resolver problemas que se repetiam todo dia.",
              "Ali nasceu a obsessão que me trouxe até aqui: por que tanta empresa contrata gente pra fazer trabalho que software faria melhor?",
            ]}
          />
          <Act
            title="Ato 2 — A virada"
            paragraphs={[
              "Em 2024 saí pra construir coisas próprias. Comecei com pipelines de conteúdo automatizados — sistemas que geravam vídeos longos e artigos completos sem intervenção humana, com controle de custo por execução. O foco não era o conteúdo. Era provar que dava pra rodar IA em produção sem quebrar e sem queimar dinheiro.",
              "Em 2025 levei isso pro mercado: construí o CaixaHub, um SaaS financeiro pra PMEs brasileiras que integrava com 100+ bancos via Open Finance. Sozinho. Webhook handlers com retry exponencial, OCR de boleto com revisão humana, motor de categorização que aprendia com cada correção. Cheguei a ter clientes pagantes antes de pausar a operação.",
              "Foi ali que a tese travou: a maior parte dos projetos de \"IA\" hoje são demos. Funcionam no palco e quebram em produção. A diferença entre demo e sistema é a parte chata — idempotência, retry, telemetria de custo, orquestração multi-provedor. É exatamente o que o mercado não quer construir e por isso me contrata pra construir.",
            ]}
          />
          <Act
            title="Ato 3 — Hoje"
            paragraphs={[
              "Hoje, com a FastDevBuilds, construo sistemas que automatizam prospecção B2B de ponta a ponta — descoberta de leads, qualificação por IA, abordagem personalizada, geração de demos de site em menos de 90 segundos. Tudo com controle de custo unitário e arquitetura que aguenta volume real.",
              "Mas além dos meus projetos, ofereço algo diferente pro mercado: empresas que querem IA em produção, não em apresentação. Eu pego um processo manual, decomponho em pipeline orquestrado por LLM, e devolvo um sistema que roda sozinho — com retry logic, observabilidade de custo, e código que não vira dívida técnica daqui a 6 meses.",
              "Trabalho com quem entende que sua próxima contratação não precisa ser uma pessoa. Precisa ser um sistema. Se você está nesse momento, vamos conversar.",
            ]}
          />
        </div>
      </section>

      <section className="bg-muted/40 border-y border-border/60">
        <div className="container-prose py-16 md:py-20">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
            Manifesto
          </p>
          <h2 className="heading-2">O que eu acredito sobre operações</h2>
          <div className="mt-8 space-y-6 text-base md:text-lg leading-relaxed text-foreground/90">
            <p className="font-semibold text-foreground">
              Empresas não falham por falta de gente. Falham por falta de sistema.
            </p>
            <p>
              Vejo todo dia empresas contratando pessoas pra resolver problemas que software resolveria em 2 semanas. Não por má-fé — por hábito. "Sempre fizemos assim." "É mais rápido fazer no manual." "Automação é caro."
            </p>
            <p>
              Mas a conta nunca fecha. Cada nova contratação é mais salário, mais gestão, mais ponto de falha. E daqui a 5 anos, a empresa que automatizou está faturando o dobro com metade da equipe — enquanto a empresa que insistiu no manual está pagando tudo o que ganha em folha.
            </p>
            <p className="font-semibold text-foreground">
              A pergunta certa não é "vale a pena automatizar?". É "quanto custa não automatizar?".
            </p>
            <p>
              É isso que eu construo: a resposta pra essa pergunta, na forma de sistemas que rodam sozinhos.
            </p>
          </div>
        </div>
      </section>

      <section className="container-prose py-16 md:py-20">
        <h2 className="heading-2">Como eu trabalho</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
              Stack principal
            </p>
            <ul className="flex flex-wrap gap-2">
              {stack.map((s) => (
                <li
                  key={s}
                  className="rounded-md border border-border bg-card px-2.5 py-1 text-sm font-mono"
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
              Especialidades
            </p>
            <ul className="flex flex-wrap gap-2">
              {specialties.map((s) => (
                <li
                  key={s}
                  className="rounded-md border border-border bg-card px-2.5 py-1 text-sm"
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60">
        <div className="container-page py-16 md:py-20 flex flex-col items-center text-center gap-6">
          <h2 className="heading-2">Vamos conversar?</h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="xl" variant="brand" className="rounded-xl">
              <TrackedLink href="/diagnosis" trackLabel="about_final_diagnosis">
                Fazer diagnóstico
                <ArrowRight className="size-4" aria-hidden />
              </TrackedLink>
            </Button>
            <Button asChild size="xl" variant="outline" className="rounded-xl">
              <TrackedLink href="/services" trackLabel="about_final_services">
                Ver serviços
              </TrackedLink>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function Act({
  title,
  paragraphs,
}: {
  title: string;
  paragraphs: string[];
}) {
  return (
    <article>
      <h3 className="heading-3 mb-4">{title}</h3>
      <div className="space-y-4 text-base md:text-lg leading-relaxed text-foreground/85">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </article>
  );
}
