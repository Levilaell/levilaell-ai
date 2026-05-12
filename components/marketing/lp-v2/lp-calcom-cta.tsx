"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSchedulingClick } from "@/components/ui/scheduling-button";
import { cn } from "@/lib/utils";
import { trackLpEvent } from "@/lib/tracking";
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
 * CTA primário das LPs apontando pro Cal.com. Envolve `useSchedulingClick`
 * (que já dispara Schedule no Meta Pixel + Google Ads + CAPI via beacon) e
 * adiciona `lp_cta_clicked` interno com `cta_target: "calcom"` pra atribuir
 * ao funil de LP. Cai pra mailto quando `NEXT_PUBLIC_CALCOM_URL` não está
 * setado.
 */
export function LpCalcomCta({
  lpSlug,
  ctaPosition,
  children,
  size = "xl",
  className,
}: LpCalcomCtaProps) {
  const { href, isMailto, onClick } = useSchedulingClick({
    subject: `Conversa técnica — ${lpSlug}`,
    source: `lp_${lpSlug}_${ctaPosition}`,
  });
  const Icon = isMailto ? Mail : ArrowUpRight;

  function handleClick() {
    if (typeof window !== "undefined") {
      const utmParams = extractTrackingParams(window.location.search);
      trackLpEvent("lp_cta_clicked", {
        lp_slug: lpSlug,
        cta_position: ctaPosition,
        cta_target: "calcom",
        ...utmParams,
      });
    }
    onClick();
  }

  return (
    <Button
      asChild
      variant="brand"
      size={size}
      className={cn("rounded-xl shadow-sm", className)}
    >
      <Link
        href={href}
        target={isMailto ? undefined : "_blank"}
        rel={isMailto ? undefined : "noopener noreferrer"}
        onClick={handleClick}
      >
        <span>{children}</span>
        <Icon className="size-4" aria-hidden />
      </Link>
    </Button>
  );
}
