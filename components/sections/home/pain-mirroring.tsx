import { SectionHeading } from "@/components/ui/section-heading";

const symptoms = [
  "Sua equipe vive apagando incêndio em vez de avançar",
  "Tarefas repetitivas comem horas que deveriam ser estratégicas",
  "Decisões dependem de você porque os dados estão espalhados",
];

export function PainMirroring() {
  return (
    <section className="bg-muted/40 border-y border-border/60">
      <div className="container-page py-20 md:py-24">
        <SectionHeading
          eyebrow="Por que você está aqui"
          title="Sua empresa cresceu — mas a operação não acompanhou."
          description="Os processos que funcionavam com 5 pessoas não escalam pra 20. As planilhas viraram caos. As tarefas manuais multiplicam. E você sabe que tem gente sendo paga pra fazer trabalho que software já deveria estar resolvendo."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {symptoms.map((s, i) => (
            <article
              key={s}
              className="rounded-2xl border border-border bg-card p-6 md:p-7 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="inline-block size-2.5 rounded-full bg-red-500"
                  aria-hidden
                />
                <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Sintoma {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="font-semibold text-base md:text-lg leading-snug">
                {s}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
