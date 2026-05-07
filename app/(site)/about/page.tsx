import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
            <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-700 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-500 grid place-items-center text-zinc-50 dark:text-zinc-900">
              <span className="font-mono text-xs uppercase tracking-widest opacity-70">
                Foto · em breve
              </span>
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
        <div className="mt-8 space-y-10">
          <Act
            title="Ato 1 — O começo"
            placeholder="{{TODO: Levi to write 3-4 sentences about technical origin — quando começou a programar, de onde vem o background técnico, primeiro contato com automação.}}"
          />
          <Act
            title="Ato 2 — A virada"
            placeholder="{{TODO: Levi to write 3-4 sentences about turning point — momento em que parou de só programar e começou a pensar em operação. Cliente, projeto ou insight que mudou a perspectiva.}}"
          />
          <Act
            title="Ato 3 — Hoje"
            placeholder="{{TODO: Levi to write 3-4 sentences about current mission — o que faz hoje, com quem trabalha, qual a visão de futuro pro próximo ano.}}"
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
              <Link href="/diagnosis">
                Fazer diagnóstico
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="rounded-xl">
              <Link href="/services">Ver serviços</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function Act({ title, placeholder }: { title: string; placeholder: string }) {
  return (
    <article className="rounded-2xl border border-dashed border-border bg-card/40 p-6 md:p-7">
      <h3 className="heading-3">{title}</h3>
      <p className="mt-3 text-sm md:text-base font-mono text-muted-foreground leading-relaxed">
        {placeholder}
      </p>
    </article>
  );
}
