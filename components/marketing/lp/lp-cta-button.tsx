"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackLpEvent } from "@/lib/tracking";
import { buildDiagnosisUrl, extractTrackingParams } from "@/lib/marketing/utm";

type CtaPosition = "hero" | "final" | "inline";

interface LpCtaButtonProps {
  lpSlug: string;
  ctaPosition: CtaPosition;
  children: React.ReactNode;
  size?: "lg" | "xl";
  className?: string;
}

/**
 * CTA primário das LPs. Preserva UTMs no href (server + client) e dispara
 * `lp_cta_clicked` ao click. Href atualiza no useEffect pra cobrir
 * middle/right-click (que não disparam onClick).
 */
export function LpCtaButton({
  lpSlug,
  ctaPosition,
  children,
  size = "xl",
  className,
}: LpCtaButtonProps) {
  // SSR / pré-mount: href base com from_lp. Após mount, substituído por
  // versão completa com UTMs (protege middle-click e cmd-click).
  const [href, setHref] = useState(`/diagnosis?from_lp=${lpSlug}`);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHref(buildDiagnosisUrl(lpSlug, window.location.search));
  }, [lpSlug]);

  function handleClick() {
    if (typeof window === "undefined") return;
    const utmParams = extractTrackingParams(window.location.search);
    trackLpEvent("lp_cta_clicked", {
      lp_slug: lpSlug,
      cta_position: ctaPosition,
      ...utmParams,
    });
  }

  return (
    <Button
      asChild
      variant="brand"
      size={size}
      className={cn("rounded-xl shadow-lg", className)}
    >
      <Link href={href} onClick={handleClick}>
        {children}
      </Link>
    </Button>
  );
}
