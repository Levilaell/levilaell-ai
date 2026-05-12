"use client";

import { useEffect } from "react";
import { trackLpEvent } from "@/lib/tracking";
import { extractTrackingParams } from "@/lib/marketing/utm";
import { metaPixel } from "@/lib/tracking/meta";
import { googleTracking } from "@/lib/tracking/google";

interface LpPageTrackerProps {
  lpSlug: string;
}

/**
 * Dispara `lp_viewed` no mount, anexando UTMs/click IDs capturados da URL.
 * Também dispara ViewContent (Meta Pixel) e view_landing_page (GA4) com
 * o slug como content_name pra distinguir LPs em campanhas.
 */
export function LpPageTracker({ lpSlug }: LpPageTrackerProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const utmParams = extractTrackingParams(window.location.search);
    trackLpEvent("lp_viewed", { lp_slug: lpSlug, ...utmParams });
    metaPixel.viewContent({
      content_name: lpSlug,
      content_category: "landing-page",
    });
    googleTracking.viewLandingPage(lpSlug);
    // Fire-once por mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
