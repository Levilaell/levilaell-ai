"use client";

import { useEffect } from "react";
import { trackLpEvent } from "@/lib/tracking";
import { extractTrackingParams } from "@/lib/marketing/utm";

interface LpPageTrackerProps {
  lpSlug: string;
}

/**
 * Dispara `lp_viewed` no mount, anexando UTMs/click IDs capturados da URL.
 * Garante atribuição mesmo quando user pula direto pra outra página depois.
 */
export function LpPageTracker({ lpSlug }: LpPageTrackerProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const utmParams = extractTrackingParams(window.location.search);
    trackLpEvent("lp_viewed", { lp_slug: lpSlug, ...utmParams });
    // Fire-once por mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
