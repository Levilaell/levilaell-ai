"use client";

/**
 * Dialog que envolve o SchedulingRequestForm. Usado pelo SchedulingButton /
 * SchedulingLink — substituiu o redirect direto pro Cal.com.
 *
 * Stateful: controla open/closed internamente (default uncontrolled), mas
 * aceita `open` + `onOpenChange` se o caller quiser controlar de fora.
 */

import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
import {
  SchedulingRequestForm,
  type SchedulingFormPrefill,
} from "@/components/forms/scheduling-request-form";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: string;
  diagnosisId?: string;
  /** Pré-preenche os campos (lead que voltou pelo link no email do diagnóstico) */
  prefill?: SchedulingFormPrefill;
  /** Override do título do dialog (default: "Vamos conversar.") */
  title?: string;
  /** Override do subtítulo (default explica os 6h e o WhatsApp) */
  description?: string;
};

export function SchedulingDialog({
  open,
  onOpenChange,
  source,
  diagnosisId,
  prefill,
  title = "Vamos conversar.",
  description = "Te chamo no WhatsApp em alguns minutos.",
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <SchedulingRequestForm
          source={source}
          diagnosisId={diagnosisId}
          prefill={prefill}
          onSuccess={() => {
            // Fecha o dialog 2.5s após o sucesso pra dar tempo de ler.
            window.setTimeout(() => onOpenChange(false), 2500);
          }}
        />
      </DialogPopup>
    </Dialog>
  );
}
