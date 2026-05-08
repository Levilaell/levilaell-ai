import type { Channel } from "@/types/admin";

export const CHANNEL_LABELS: Record<Channel, string> = {
  blog: "Blog",
  newsletter: "Newsletter",
  x: "X (Twitter)",
};

export const CHANNEL_EMOJI: Record<Channel, string> = {
  blog: "📝",
  newsletter: "📨",
  x: "𝕏",
};

const RTF =
  typeof Intl !== "undefined" && "RelativeTimeFormat" in Intl
    ? new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" })
    : null;

export function relativeTime(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = date.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const abs = Math.abs(diffSec);

  if (!RTF) return date.toISOString();

  if (abs < 60) return RTF.format(diffSec, "second");
  if (abs < 3600) return RTF.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return RTF.format(Math.round(diffSec / 3600), "hour");
  if (abs < 86400 * 30) return RTF.format(Math.round(diffSec / 86400), "day");
  if (abs < 86400 * 365)
    return RTF.format(Math.round(diffSec / (86400 * 30)), "month");
  return RTF.format(Math.round(diffSec / (86400 * 365)), "year");
}

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

export function formatBRL(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return BRL.format(value);
}
