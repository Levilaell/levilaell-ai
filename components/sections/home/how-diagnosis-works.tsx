import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { TrackedLink } from "@/components/tracking/tracked-link";

const steps = [
  {
    title: "Você responde 8 perguntas estratégicas sobre sua operação atual",
    detail: "2 minutos · sem cadastro pra começar",
  },
  {
    title:
      "IA analisa as respostas e identifica padrões, gargalos e oportunidades específicas do seu caso",
    detail: "análise feita por modelo especializado em consultoria",
  },
  {
    title:
      "Você recebe um relatório personalizado com priorização do que automatizar primeiro, ordem de impacto e estimativa de retorno",
    detail: "no e-mail · acessível por link permanente",
  },
  {
    title: "Se quiser implementar, agenda uma call comigo — sem compromisso",
    detail: "sem ligação de vendedor · sem letra miúda",
  },
];

export function HowDiagnosisWorks() {
  return (
    <section className="bg-muted/40 border-b border-border/60">
      <div className="container-page py-20 md:py-24">
        <SectionHeading
          eyebrow="Como funciona"
          title="Do diagnóstico ao próximo passo, em 4 etapas"
          align="center"
        />
        <ol className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="relative rounded-2xl border border-border bg-card p-6"
            >
              <span
                aria-hidden
                className="font-mono text-3xl font-semibold text-brand block mb-4"
              >
                0{i + 1}
              </span>
              <p className="font-semibold text-base leading-snug">{s.title}</p>
              <p className="mt-3 text-xs text-muted-foreground font-mono">
                {s.detail}
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-12 flex justify-center">
          <Button asChild size="xl" variant="brand" className="rounded-xl">
            <TrackedLink
              href="/diagnosis"
              trackLabel="home_how_works_diagnosis"
            >
              Quero meu diagnóstico
              <ArrowRight className="size-4" aria-hidden />
            </TrackedLink>
          </Button>
        </div>
      </div>
    </section>
  );
}
