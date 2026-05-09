import type { FunnelStats } from "@/lib/admin-stats";

export function FunnelTracker({ funnel }: { funnel: FunnelStats }) {
  const top = funnel.steps[0]?.count ?? 0;

  return (
    <section className="rounded-2xl border border-border bg-card p-4 ring-1 ring-foreground/5">
      <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Funil ({funnel.windowDays} dias)
      </h2>
      <ul className="mt-3 space-y-2.5">
        {funnel.steps.map((step, i) => {
          const prev = i === 0 ? top : funnel.steps[i - 1].count;
          const ratio = top === 0 ? 0 : (step.count / top) * 100;
          const conv =
            i === 0 || prev === 0
              ? null
              : ((step.count / prev) * 100).toFixed(1);
          return (
            <li key={step.key}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span>{step.label}</span>
                <span className="tabular-nums">
                  <strong className="font-medium">
                    {step.count.toLocaleString("pt-BR")}
                  </strong>
                  {conv !== null && (
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      ({conv}%)
                    </span>
                  )}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-foreground/80 transition-[width]"
                  style={{ width: `${ratio}%` }}
                  aria-hidden
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
