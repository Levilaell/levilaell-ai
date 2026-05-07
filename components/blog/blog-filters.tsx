import Link from "next/link";
import { cn } from "@/lib/utils";
import { PILLARS, PILLAR_ORDER } from "@/lib/blog/articles";
import type { Pillar } from "@/types/blog";

type Props = {
  active?: Pillar | "all";
};

export function BlogFilters({ active = "all" }: Props) {
  const items = [
    { slug: "all" as const, label: "Todos", href: "/blog" },
    ...PILLAR_ORDER.map((p) => ({
      slug: p,
      label: PILLARS[p].short,
      href: `/blog/category/${p}`,
    })),
  ];

  return (
    <nav className="flex flex-wrap items-center gap-2" aria-label="Filtros de pilar">
      {items.map((item) => {
        const isActive = item.slug === active;
        return (
          <Link
            key={item.slug}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/40",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
