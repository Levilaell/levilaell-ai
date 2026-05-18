"use client";

/**
 * Botões e links de "Agendar conversa".
 *
 * Antes (até 2026-05-18): redirecionavam pro Cal.com em nova aba. Lead
 * agendava sozinho, e como não tinha lembrete/follow-up estruturado,
 * as 3 calls testadas no dia 18 sumiram (zero shows). Migrado pra form
 * próprio (SchedulingDialog) que captura nome/whatsapp/email/site/urgência
 * e dispara Telegram pro Levi + comercial, que chamam no WhatsApp pra
 * combinar horário — você controla o follow-up.
 *
 * Mantém os mesmos call sites e props (subject, source, diagnosisId, label,
 * variant, etc) então nada além desse arquivo precisou ser refatorado.
 */

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SchedulingDialog } from "@/components/ui/scheduling-dialog";
import { track } from "@/lib/tracking";
import { cn } from "@/lib/utils";

type CalcomVariant = "primary" | "secondary" | "white";

const variantClasses: Record<CalcomVariant, string> = {
  primary: "",
  secondary: "",
  white:
    "bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 shadow-sm",
};

const baseVariant: Record<CalcomVariant, "brand" | "outline" | "default"> = {
  primary: "brand",
  secondary: "outline",
  white: "default",
};

function trackOpen(source: string | undefined, diagnosisId: string | undefined) {
  track({
    type: "scheduling_dialog_opened",
    data: {
      source: source ?? null,
      diagnosis_id: diagnosisId ?? null,
    },
  });
}

type Props = {
  /** Subject legado — não é mais usado, mantido pra compatibilidade de call sites. */
  subject?: string;
  label?: string;
  size?: "default" | "lg" | "xl";
  variant?: CalcomVariant;
  className?: string;
  /** Quando passado, o submit do form cancela a sequence de e-mails do diagnóstico. */
  diagnosisId?: string;
  /** Origem usada no tracking (ex: "result_page", "services_cta") */
  source?: string;
};

export function SchedulingButton({
  label = "Agendar conversa",
  size = "lg",
  variant = "primary",
  className,
  diagnosisId,
  source,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        size={size}
        variant={baseVariant[variant]}
        className={cn("rounded-xl", variantClasses[variant], className)}
        onClick={() => {
          trackOpen(source, diagnosisId);
          setOpen(true);
        }}
      >
        <ArrowUpRight className="size-4" aria-hidden />
        <span>{label}</span>
      </Button>
      <SchedulingDialog
        open={open}
        onOpenChange={setOpen}
        source={source}
        diagnosisId={diagnosisId}
      />
    </>
  );
}

type LinkProps = {
  /** Subject legado — não é mais usado. */
  subject?: string;
  source?: string;
  label?: string;
  className?: string;
  withIcon?: boolean;
  onNavigate?: () => void;
};

/**
 * Versão link textual — usado em header/footer onde um botão cheio seria
 * visualmente pesado. Comportamento é o mesmo: clica → abre dialog.
 */
export function SchedulingLink({
  source,
  label = "Agendar conversa",
  className,
  withIcon = false,
  onNavigate,
}: LinkProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          trackOpen(source, undefined);
          onNavigate?.();
          setOpen(true);
        }}
      >
        {withIcon ? (
          <span className="inline-flex items-center gap-1.5">
            {label}
            <ArrowUpRight className="size-3.5" aria-hidden />
          </span>
        ) : (
          label
        )}
      </button>
      <SchedulingDialog
        open={open}
        onOpenChange={setOpen}
        source={source}
      />
    </>
  );
}

// Alias retrocompatível.
export const CalcomButton = SchedulingButton;
