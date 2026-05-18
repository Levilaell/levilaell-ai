"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SchedulingDialog } from "@/components/ui/scheduling-dialog";
import type { SchedulingFormPrefill } from "@/components/forms/scheduling-request-form";

type Props = {
  diagnosisId?: string;
  prefill?: SchedulingFormPrefill;
  source?: string;
};

export function AgendarClient({ diagnosisId, prefill, source }: Props) {
  // Abre o dialog automaticamente — usuário veio aqui pra preencher form,
  // não pra explorar a página. Se fechar, fica com o botão pra reabrir.
  const [open, setOpen] = useState(true);

  const firstName = prefill?.name?.split(" ")[0];

  return (
    <section className="container-prose py-16 md:py-20">
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
        Agendar conversa
      </p>
      <h1 className="heading-1">
        {firstName ? `Oi, ${firstName}.` : "Vamos conversar."}
      </h1>
      <p className="text-lead mt-5">
        Preenche os dados aqui — te chamo no WhatsApp em alguns minutos pra
        combinar o melhor horário.
      </p>

      <div className="mt-10 rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="hidden sm:grid size-10 place-items-center rounded-lg bg-muted text-foreground shrink-0">
            <CalendarClock className="size-5" aria-hidden />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-base md:text-lg">
              Conversa rápida no WhatsApp
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              {prefill
                ? "Já temos seus dados do diagnóstico — falta só dizer quando."
                : "Sem pitch comercial. Se não formos a melhor opção, indicamos quem é."}
            </p>
            <div className="mt-4">
              <Button
                type="button"
                size="lg"
                variant="brand"
                className="rounded-xl"
                onClick={() => setOpen(true)}
              >
                Abrir formulário
              </Button>
            </div>
          </div>
        </div>
      </div>

      <SchedulingDialog
        open={open}
        onOpenChange={setOpen}
        source={source}
        diagnosisId={diagnosisId}
        prefill={prefill}
      />
    </section>
  );
}
