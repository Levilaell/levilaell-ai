import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SchedulingButton } from "@/components/ui/scheduling-button";
import { TrackedLink } from "@/components/tracking/tracked-link";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "Engenharia de automação para escritórios contábeis. Sistema sob medida pro fluxo do seu escritório.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <section className="container-page py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
            Sobre a Levi Lael
          </p>
          <h1 className="heading-display">
            Engenharia de automação para escritórios contábeis.
          </h1>
          <p className="text-lead mt-6">
            Sistema sob medida pro fluxo do seu escritório. Não SaaS pronto.
          </p>
        </div>
      </section>

      <section className="container-prose pb-16 md:pb-20">
        <h2 className="heading-2">O que fazemos</h2>
        <div className="mt-8 space-y-6 text-base md:text-lg leading-relaxed text-foreground/90">
          <p>
            Construímos sistemas de automação para escritórios contábeis que
            querem automatizar processos sem virar empresa de tecnologia.
          </p>
          <p>Focamos em três frentes principais:</p>
          <ul className="space-y-3 list-disc pl-6">
            <li>
              <strong className="text-foreground">
                Triagem de documentos
              </strong>{" "}
              — automação de classificação de notas, recibos e contratos
            </li>
            <li>
              <strong className="text-foreground">Cobrança automática</strong>{" "}
              — sistema que cobra documento do cliente via WhatsApp com
              histórico
            </li>
            <li>
              <strong className="text-foreground">
                Processamento de notas fiscais
              </strong>{" "}
              — extração, validação e integração com ERP
            </li>
          </ul>
          <p>
            Mas todo projeto começa pela mesma pergunta: onde sua equipe está
            perdendo mais tempo hoje?
          </p>
        </div>
      </section>

      <section className="bg-muted/40 border-y border-border/60">
        <div className="container-prose py-16 md:py-20">
          <h2 className="heading-2">Como trabalhamos</h2>
          <p className="mt-6 text-base md:text-lg leading-relaxed text-foreground/90">
            A operação se divide em duas frentes complementares:
          </p>
          <div className="mt-10 space-y-10">
            <div>
              <h3 className="heading-3 mb-3">Engenharia técnica</h3>
              <p className="text-base md:text-lg leading-relaxed text-foreground/85">
                Construímos os sistemas. Background em IA em produção:
                fintech, automação B2B, geração de pipelines com controle de
                custo unitário. Stack moderna, arquitetura que aguenta volume
                real, código que não vira dívida técnica.
              </p>
            </div>
            <div>
              <h3 className="heading-3 mb-3">Acompanhamento comercial</h3>
              <p className="text-base md:text-lg leading-relaxed text-foreground/85">
                Conduzimos descoberta, qualificação e acompanhamento até a
                entrega. Background em contabilidade e gestão financeira.
                Quem fala com você na primeira conversa é quem acompanha o
                projeto até o final.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-prose py-16 md:py-20">
        <h2 className="heading-2">Por que sob medida</h2>
        <div className="mt-8 space-y-6 text-base md:text-lg leading-relaxed text-foreground/90">
          <p>
            A maior parte das automações no mercado são SaaS prontos
            configurados pra parecer feitos pro seu escritório — mas não
            são. Sua equipe abandona em dois meses e volta pro manual.
          </p>
          <p>
            Construímos o oposto. Sistema desenhado pro fluxo específico do
            seu escritório, integrado ao ERP que você já usa (Domínio,
            Onvio, Sage, Alterdata, MasterMaq), com revisão humana onde
            importa.
          </p>
          <p>
            A diferença entre uma demo que impressiona e um sistema que roda
            em produção está nas partes que ninguém quer construir:
            tratamento de erro, idempotência, telemetria, retry,
            observabilidade. Construímos essas partes porque sem elas o
            sistema quebra na primeira semana.
          </p>
        </div>
      </section>

      <section className="bg-muted/40 border-y border-border/60">
        <div className="container-prose py-16 md:py-20">
          <h2 className="heading-2">Como começa</h2>
          <ol className="mt-8 space-y-5 text-base md:text-lg leading-relaxed text-foreground/90">
            <li className="flex gap-4">
              <span className="font-mono text-sm text-muted-foreground pt-1 shrink-0">
                01
              </span>
              <span>
                <strong className="text-foreground">
                  Conversa de descoberta
                </strong>{" "}
                (45 minutos, sem custo)
              </span>
            </li>
            <li className="flex gap-4">
              <span className="font-mono text-sm text-muted-foreground pt-1 shrink-0">
                02
              </span>
              <span>
                <strong className="text-foreground">
                  Diagnóstico técnico
                </strong>{" "}
                do seu fluxo atual
              </span>
            </li>
            <li className="flex gap-4">
              <span className="font-mono text-sm text-muted-foreground pt-1 shrink-0">
                03
              </span>
              <span>
                <strong className="text-foreground">Proposta</strong> com
                escopo, prazo e valor
              </span>
            </li>
            <li className="flex gap-4">
              <span className="font-mono text-sm text-muted-foreground pt-1 shrink-0">
                04
              </span>
              <span>
                <strong className="text-foreground">Você decide</strong>
              </span>
            </li>
          </ol>
          <p className="mt-8 text-sm md:text-base text-muted-foreground">
            Diagnóstico gratuito sem compromisso. Proposta só se fizer
            sentido pra você.
          </p>
        </div>
      </section>

      <section className="border-t border-border/60">
        <div className="container-page py-16 md:py-20 flex flex-col items-center text-center gap-6">
          <h2 className="heading-2">Vamos conversar?</h2>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
            <SchedulingButton
              label="Agendar conversa de descoberta"
              source="about_final"
              size="xl"
              variant="primary"
              className="rounded-xl"
            />
            <Button asChild size="xl" variant="outline" className="rounded-xl">
              <TrackedLink href="/diagnosis" trackLabel="about_final_diagnosis">
                Fazer diagnóstico em 2 min
                <ArrowRight className="size-4" aria-hidden />
              </TrackedLink>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
