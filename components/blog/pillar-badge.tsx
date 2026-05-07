import Link from "next/link";
import type { Pillar } from "@/types/blog";
import { PILLARS } from "@/lib/blog/articles";
import { cn } from "@/lib/utils";

type Props = {
  pillar: Pillar;
  size?: "sm" | "md";
  asLink?: boolean;
  className?: string;
};

export function PillarBadge({ pillar, size = "sm", asLink = false, className }: Props) {
  const meta = PILLARS[pillar];
  const padding = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  const inner = (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-mono uppercase tracking-wider",
        meta.className,
        padding,
        className,
      )}
    >
      {meta.short}
    </span>
  );
  if (asLink) {
    return (
      <Link href={`/blog/category/${pillar}`} className="inline-flex">
        {inner}
      </Link>
    );
  }
  return inner;
}
