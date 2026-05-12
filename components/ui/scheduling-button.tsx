"use client";

import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getCalcomRedirectUrl,
  getCalcomUrl,
  getSchedulingTarget,
} from "@/lib/calcom";
import { track } from "@/lib/tracking";
import { metaPixel } from "@/lib/tracking/meta";
import { googleTracking } from "@/lib/tracking/google";
import { EVENT_VALUE_BRL } from "@/lib/tracking/types";
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

type Props = {
  subject?: string;
  label?: string;
  size?: "default" | "lg" | "xl";
  variant?: CalcomVariant;
  className?: string;
  /**
   * Quando passado, o botão usa o redirector interno (/r/calcom/[id]) que
   * cancela a sequência de e-mails antes de jogar o lead pro Cal.com.
   */
  diagnosisId?: string;
  /** Origem usada no tracking event (ex: "result_page", "services_cta") */
  source?: string;
};

export function SchedulingButton({
  subject,
  label = "Agendar call gratuita",
  size = "lg",
  variant = "primary",
  className,
  diagnosisId,
  source,
}: Props) {
  const fallback = getSchedulingTarget(subject);
  const calcomBase = getCalcomUrl();
  const useRedirector = Boolean(diagnosisId && calcomBase);
  const href = useRedirector
    ? getCalcomRedirectUrl(diagnosisId!)
    : fallback.href;
  const isMailto = !useRedirector && fallback.isMailto;
  const Icon = isMailto ? Mail : ArrowUpRight;

  function handleClick() {
    track({
      type: "calcom_clicked",
      data: {
        source: source ?? null,
        diagnosis_id: diagnosisId ?? null,
        is_mailto: isMailto,
      },
    });

    // Mailto não é evento de agendamento — skipa Pixel/gtag/CAPI.
    if (isMailto) return;

    // event_id determinístico quando temos diagnosisId (mesmo click no
    // result page ou via SchedulingButton da home gera mesmo event_id).
    // Sem diagnosisId (ex: visitante direto), UUID aleatório.
    const eventId =
      diagnosisId ??
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sched_${Date.now()}_${Math.random().toString(36).slice(2)}`);

    void metaPixel.schedule({
      event_id: eventId,
      value: EVENT_VALUE_BRL.schedule,
    });
    googleTracking.scheduleCall({ value: EVENT_VALUE_BRL.schedule });

    // CAPI espelho server-side via beacon — sobrevive a navegação mesmo
    // se target fosse same-tab (aqui é _blank, então cur tab continua viva
    // de qualquer jeito).
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const payload = JSON.stringify({
        event_id: eventId,
        diagnosis_id: diagnosisId,
      });
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/tracking/calcom", blob);
    }
  }

  return (
    <Button
      asChild
      size={size}
      variant={baseVariant[variant]}
      className={cn("rounded-xl", variantClasses[variant], className)}
    >
      <Link
        href={href}
        target={isMailto ? undefined : "_blank"}
        rel={isMailto ? undefined : "noopener noreferrer"}
        onClick={handleClick}
      >
        <Icon className="size-4" aria-hidden />
        <span>{label}</span>
      </Link>
    </Button>
  );
}

// Alias mais explícito.
export const CalcomButton = SchedulingButton;
