"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { trackLpEvent } from "@/lib/tracking";
import { cn } from "@/lib/utils";

interface LpFaqProps {
  lpSlug: string;
  title?: string;
  items: Array<{ question: string; answer: string }>;
}

export function LpFaq({
  lpSlug,
  title = "Dúvidas frequentes",
  items,
}: LpFaqProps) {
  const [openSet, setOpenSet] = useState<Set<number>>(new Set());

  function toggle(idx: number, question: string) {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
        trackLpEvent("lp_faq_expanded", {
          lp_slug: lpSlug,
          question_text: question,
        });
      }
      return next;
    });
  }

  return (
    <div className="container-page py-16 md:py-24">
      <h2 className="heading-2 mb-10 md:mb-12 text-center">{title}</h2>
      <div className="max-w-2xl mx-auto">
        {items.map((item, idx) => {
          const open = openSet.has(idx);
          const panelId = `lp-faq-panel-${idx}`;
          return (
            <div key={idx} className="border-b border-border">
              <button
                type="button"
                onClick={() => toggle(idx, item.question)}
                aria-expanded={open}
                aria-controls={panelId}
                className="w-full flex items-center justify-between gap-4 py-5 text-left text-base md:text-lg font-medium text-foreground hover:text-brand transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 rounded-md"
              >
                <span>{item.question}</span>
                <ChevronDown
                  className={cn(
                    "size-5 shrink-0 text-muted-foreground transition-transform duration-200",
                    open && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>
              <div
                id={panelId}
                role="region"
                className={cn(
                  "grid overflow-hidden transition-all duration-300 ease-out",
                  open
                    ? "grid-rows-[1fr] opacity-100 pb-5"
                    : "grid-rows-[0fr] opacity-0",
                )}
              >
                <div className="overflow-hidden text-sm md:text-base text-muted-foreground leading-relaxed">
                  {item.answer}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
