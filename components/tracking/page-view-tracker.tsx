"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { track } from "@/lib/tracking";
import { metaPixel } from "@/lib/tracking/meta";
import { googleTracking } from "@/lib/tracking/google";

/**
 * Dispara `page_view` em cada mudança de rota client-side:
 *   • tracking interno (Supabase) via track()
 *   • Meta Pixel via fbq('track', 'PageView')
 *   • Google Tag via gtag('event', 'page_view')
 *
 * Inclui o load inicial (effect roda no mount). Loaders Meta/Google fazem
 * SÓ init — toda PageView passa por aqui pra evitar double-fire.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const searchStr = search?.toString();
    track({
      type: "page_view",
      data: {
        path: pathname,
        search: searchStr || undefined,
      },
    });
    metaPixel.pageView();
    if (typeof window !== "undefined") {
      const fullUrl = `${window.location.origin}${pathname}${searchStr ? `?${searchStr}` : ""}`;
      googleTracking.pageView(fullUrl);
    }
  }, [pathname, search]);

  return null;
}
