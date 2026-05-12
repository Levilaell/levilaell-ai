"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { trackLpEvent } from "@/lib/tracking";

interface LpSectionTrackerProps {
  lpSlug: string;
  sectionName: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper que dispara `lp_section_viewed` quando 50% da section entra
 * no viewport. Fire-once por mount.
 */
export function LpSectionTracker({
  lpSlug,
  sectionName,
  children,
  className,
}: LpSectionTrackerProps) {
  const ref = useRef<HTMLElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof IntersectionObserver === "undefined") return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !fired.current) {
            fired.current = true;
            trackLpEvent("lp_section_viewed", {
              lp_slug: lpSlug,
              section_name: sectionName,
            });
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [lpSlug, sectionName]);

  return (
    <section ref={ref} className={className}>
      {children}
    </section>
  );
}
