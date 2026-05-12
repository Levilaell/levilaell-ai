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

type SchedulingClickInput = {
  subject?: string;
  diagnosisId?: string;
  source?: string;
};

type SchedulingClickResult = {
  href: string;
  isMailto: boolean;
  onClick: () => void;
};

export function useSchedulingClick({
  subject,
  diagnosisId,
  source,
}: SchedulingClickInput): SchedulingClickResult {
  const fallback = getSchedulingTarget(subject);
  const calcomBase = getCalcomUrl();
  const useRedirector = Boolean(diagnosisId && calcomBase);
  const href = useRedirector
    ? getCalcomRedirectUrl(diagnosisId!)
    : fallback.href;
  const isMailto = !useRedirector && fallback.isMailto;

  function onClick() {
    track({
      type: "calcom_clicked",
      data: {
        source: source ?? null,
        diagnosis_id: diagnosisId ?? null,
        is_mailto: isMailto,
      },
    });

    if (isMailto) return;

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

    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const payload = JSON.stringify({
        event_id: eventId,
        diagnosis_id: diagnosisId,
      });
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/tracking/calcom", blob);
    }
  }

  return { href, isMailto, onClick };
}

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
  const { href, isMailto, onClick } = useSchedulingClick({
    subject,
    diagnosisId,
    source,
  });
  const Icon = isMailto ? Mail : ArrowUpRight;

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
        onClick={onClick}
      >
        <Icon className="size-4" aria-hidden />
        <span>{label}</span>
      </Link>
    </Button>
  );
}

type LinkProps = {
  subject?: string;
  source?: string;
  label?: string;
  className?: string;
  withIcon?: boolean;
  onNavigate?: () => void;
};

/**
 * Versão link textual do SchedulingButton — pra header, footer e outros
 * lugares onde um botão cheio seria visualmente pesado.
 */
export function SchedulingLink({
  subject,
  source,
  label = "Agendar call",
  className,
  withIcon = false,
  onNavigate,
}: LinkProps) {
  const { href, isMailto, onClick } = useSchedulingClick({ subject, source });

  return (
    <Link
      href={href}
      target={isMailto ? undefined : "_blank"}
      rel={isMailto ? undefined : "noopener noreferrer"}
      onClick={() => {
        onClick();
        onNavigate?.();
      }}
      className={className}
    >
      {withIcon ? (
        <span className="inline-flex items-center gap-1.5">
          {label}
          <ArrowUpRight className="size-3.5" aria-hidden />
        </span>
      ) : (
        label
      )}
    </Link>
  );
}

// Alias mais explícito.
export const CalcomButton = SchedulingButton;
