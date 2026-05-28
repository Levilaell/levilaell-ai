"use client";

import { cn } from "@/lib/utils";

type OrbState = "idle" | "thinking";

/**
 * Orb holográfico — representa a IA. Puro CSS (sem canvas): anéis em rotação +
 * núcleo pulsante + glow gold. Em "thinking" acelera e brilha mais.
 */
export function DescobertaOrb({
  state = "idle",
  className,
}: {
  state?: OrbState;
  className?: string;
}) {
  const thinking = state === "thinking";
  return (
    <div
      className={cn("relative grid place-items-center", className)}
      aria-hidden
    >
      {/* glow externo */}
      <div
        className={cn(
          "absolute inset-0 rounded-full blur-2xl transition-opacity duration-700",
          thinking ? "opacity-80" : "opacity-50",
        )}
        style={{
          background:
            "radial-gradient(circle, var(--brand) 0%, transparent 65%)",
        }}
      />
      {/* anel externo (cw) */}
      <div
        className="absolute inset-0 rounded-full border border-[color-mix(in_oklab,var(--brand)_45%,transparent)]"
        style={{
          animation: `ll-orb-rotate ${thinking ? "4s" : "14s"} linear infinite`,
          borderTopColor: "var(--brand)",
          borderRightColor: "transparent",
        }}
      />
      {/* anel médio (ccw) */}
      <div
        className="absolute inset-[14%] rounded-full border border-dashed border-[color-mix(in_oklab,var(--brand)_30%,transparent)]"
        style={{
          animation: `ll-orb-rotate-rev ${thinking ? "6s" : "20s"} linear infinite`,
        }}
      />
      {/* anel interno (cw) */}
      <div
        className="absolute inset-[30%] rounded-full border border-[color-mix(in_oklab,var(--brand)_55%,transparent)]"
        style={{
          animation: `ll-orb-rotate ${thinking ? "3s" : "10s"} linear infinite`,
          borderBottomColor: "var(--brand)",
        }}
      />
      {/* núcleo */}
      <div
        className="absolute inset-[42%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, #fff 0%, var(--brand) 45%, color-mix(in oklab, var(--brand) 40%, transparent) 100%)",
          boxShadow: "0 0 24px 4px color-mix(in oklab, var(--brand) 60%, transparent)",
          animation: `${thinking ? "ll-orb-pulse-fast 1.1s" : "ll-orb-pulse 3s"} ease-in-out infinite`,
        }}
      />
    </div>
  );
}
