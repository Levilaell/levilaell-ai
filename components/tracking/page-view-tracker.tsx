"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { track } from "@/lib/tracking";
import { metaPixel } from "@/lib/tracking/meta";
import { googleTracking } from "@/lib/tracking/google";

/**
 * Dispara `page_view` em cada mudança de rota client-side:
 *   • Tracking interno (Supabase) via track() — em TODO mount, inclusive
 *     o primeiro (precisa registrar landing inicial).
 *   • Meta Pixel: PageView do hard load é firada pelo snippet do
 *     MetaPixelLoader (`fbq('track', 'PageView')`). Aqui só firamos em
 *     route changes subsequentes via SPA navigation.
 *   • Google Tag: idem — GA4 config dispara page_view inicial automático,
 *     manual aqui só pra route changes subsequentes.
 *
 * O skip do primeiro mount via useRef garante que não duplicamos PageView
 * no load inicial e evita race condition: se o snippet ainda não carregou
 * quando o useEffect roda, window.fbq seria undefined e a chamada seria
 * silentemente dropada — o snippet em si não tem esse risco porque define
 * window.fbq synchronously.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const search = useSearchParams();
  const isFirstMount = useRef(true);

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

    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    metaPixel.pageView();
    if (typeof window !== "undefined") {
      const fullUrl = `${window.location.origin}${pathname}${searchStr ? `?${searchStr}` : ""}`;
      googleTracking.pageView(fullUrl);
    }
  }, [pathname, search]);

  return null;
}
