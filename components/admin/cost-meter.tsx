import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/admin-format";
import { severity } from "@/lib/admin-cost";
import type { CostSummary } from "@/lib/admin-stats";

const SEVERITY_BAR: Record<ReturnType<typeof severity>, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-400",
  near: "bg-orange-500",
  over: "bg-rose-500",
};
const SEVERITY_TEXT: Record<ReturnType<typeof severity>, string> = {
  ok: "text-emerald-700",
  warn: "text-amber-700",
  near: "text-orange-700",
  over: "text-rose-700",
};

export function CostMeter({ cost }: { cost: CostSummary }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 ring-1 ring-foreground/5">
      <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Custo IA
      </h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <Row
          label="Hoje"
          used={cost.todayBRL}
          limit={cost.dailyLimitBRL}
        />
        <Row
          label="Este mês"
          used={cost.monthBRL}
          limit={cost.monthlyLimitBRL}
        />
      </div>
    </section>
  );
}

function Row({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const sev = severity(used, limit);
  const ratio = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={cn("text-sm font-medium tabular-nums", SEVERITY_TEXT[sev])}>
          {formatBRL(used)}{" "}
          <span className="text-muted-foreground">/ {formatBRL(limit)}</span>
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full transition-[width] duration-300",
            SEVERITY_BAR[sev],
          )}
          style={{ width: `${ratio}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}
