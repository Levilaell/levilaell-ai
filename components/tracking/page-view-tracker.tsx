"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { track } from "@/lib/tracking";

/** Dispara `page_view` em cada mudança de rota client-side. */
export function PageViewTracker() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    track({
      type: "page_view",
      data: {
        path: pathname,
        search: search?.toString() || undefined,
      },
    });
  }, [pathname, search]);

  return null;
}
