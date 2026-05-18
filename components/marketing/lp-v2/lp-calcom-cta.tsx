"use client";

import * as React from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SchedulingDialog } from "@/components/ui/scheduling-dialog";
import { cn } from "@/lib/utils";
import { track, trackLpEvent } from "@/lib/tracking";
import { extractTrackingParams } from "@/lib/marketing/utm";

type CtaPosition = "hero" | "final" | "inline";

interface LpCalcomCtaProps {
  lpSlug: string;
  ctaPosition: CtaPosition;
  children: React.ReactNode;
  size?: "lg" | "xl";
  className?: string;
}

/**
 * CTA primário das LPs. Antes apontava direto pro Cal.com em nova aba;
 * desde 2026-05-18 abre o SchedulingDialog (form próprio → Telegram pro
 * Levi/comercial → contato manual via WhatsApp). Mantém o disparo do
 * lp_cta_clicked pra atribuição do funil.
 */
export function LpCalcomCta({
  lpSlug,
  ctaPosition,
  children,
  size = "xl",
  className,
}: LpCalcomCtaProps) {
  const [open, setOpen] = React.useState(false);
  const source = `lp_${lpSlug}_${ctaPosition}`;

  function handleClick() {
    if (typeof window !== "undefined") {
      const utmParams = extractTrackingParams(window.location.search);
      trackLpEvent("lp_cta_clicked", {
        lp_slug: lpSlug,
        cta_position: ctaPosition,
        cta_target: "scheduling_dialog",
        ...utmParams,
      });
    }
    track({
      type: "scheduling_dialog_opened",
      data: { source, diagnosis_id: null },
    });
    setOpen(true);
  }

  return (
    <>
      <Button
        type="button"
        variant="brand"
        size={size}
        className={cn("rounded-xl shadow-sm", className)}
        onClick={handleClick}
      >
        <span>{children}</span>
        <ArrowUpRight className="size-4" aria-hidden />
      </Button>
      <SchedulingDialog open={open} onOpenChange={setOpen} source={source} />
    </>
  );
}
