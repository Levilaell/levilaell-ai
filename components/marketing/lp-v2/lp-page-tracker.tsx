"use client";

import { useEffect } from "react";
import { trackLpEvent } from "@/lib/tracking";
import { extractTrackingParams } from "@/lib/marketing/utm";
import { metaPixel } from "@/lib/tracking/meta";
import { googleTracking } from "@/lib/tracking/google";
import { captureAttribution } from "@/lib/tracking/attribution";

interface LpPageTrackerProps {
  lpSlug: string;
}

export function LpPageTracker({ lpSlug }: LpPageTrackerProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    captureAttribution();
    const utmParams = extractTrackingParams(window.location.search);
    trackLpEvent("lp_viewed", { lp_slug: lpSlug, ...utmParams });
    metaPixel.viewContent({
      content_name: lpSlug,
      content_category: "landing-page",
    });
    googleTracking.viewLandingPage(lpSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
