import { ArrowRight, Clock, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackedLink } from "@/components/tracking/tracked-link";

export function FinalCTA() {
  return (
    <section className="bg-zinc-950 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-950">
      <div className="container-page py-24 md:py-32 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-4">
          Última parada
        </p>
        <h2 className="heading-1">
          Sua operação tem mais oportunidades do que você imagina.
        </h2>
        <p className="text-lead mt-6 max-w-2xl mx-auto !text-zinc-300 dark:!text-zinc-700">
          A maioria dos escritórios contábeis perde dezenas de horas por semana em tarefas que software resolveria. O diagnóstico te mostra exatamente onde — em 2 minutos.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="xl" variant="brand" className="rounded-xl">
            <TrackedLink href="/diagnosis" trackLabel="home_final_diagnosis">
              Iniciar diagnóstico gratuito
              <ArrowRight className="size-4" aria-hidden />
            </TrackedLink>
          </Button>
        </div>
        <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-zinc-400 dark:text-zinc-600">
          <li className="inline-flex items-center gap-1.5">
            <Mail className="size-3.5" aria-hidden /> Receba seu relatório no e-mail
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden /> Sem cadastro pra começar
          </li>
          <li className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" aria-hidden /> Sem ligações de vendedor
          </li>
        </ul>
      </div>
    </section>
  );
}
