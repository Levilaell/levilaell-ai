"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackLpEvent } from "@/lib/tracking";
import { buildDiagnosisUrl, extractTrackingParams } from "@/lib/marketing/utm";

type CtaPosition = "hero" | "final" | "inline";
type CtaVariant = "brand" | "outline";

interface LpCtaButtonProps {
  lpSlug: string;
  ctaPosition: CtaPosition;
  children: React.ReactNode;
  size?: "lg" | "xl";
  variant?: CtaVariant;
  className?: string;
  withArrow?: boolean;
}

/**
 * CTA pra /diagnosis nas LPs. Preserva UTMs no href (server + client) e
 * dispara `lp_cta_clicked` com `cta_target: 'diagnosis'`. Href atualiza
 * no useEffect pra cobrir middle/right-click (que não disparam onClick).
 */
export function LpCtaButton({
  lpSlug,
  ctaPosition,
  children,
  size = "xl",
  variant = "brand",
  className,
  withArrow = false,
}: LpCtaButtonProps) {
  const [href, setHref] = useState(`/diagnosis?from_lp=${lpSlug}`);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHref(buildDiagnosisUrl(lpSlug, window.location.search));
  }, [lpSlug]);

  function handleClick() {
    if (typeof window === "undefined") return;
    const utmParams = extractTrackingParams(window.location.search);
    trackLpEvent("lp_cta_clicked", {
      lp_slug: lpSlug,
      cta_position: ctaPosition,
      cta_target: "diagnosis",
      ...utmParams,
    });
  }

  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={cn("rounded-xl", className)}
    >
      <Link href={href} onClick={handleClick}>
        <span>{children}</span>
        {withArrow && <ArrowRight className="size-4" aria-hidden />}
      </Link>
    </Button>
  );
}
