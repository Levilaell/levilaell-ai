import { formatBRL } from "@/lib/admin-format";
import type { PerfMetrics } from "@/lib/admin-stats";

export function PerfMetrics({ perf }: { perf: PerfMetrics }) {
  const fmtMs = (ms: number | null) =>
    ms === null ? "—" : `${(ms / 1000).toFixed(1).replace(".", ",")}s`;
  const pct = (r: number) => `${(r * 100).toFixed(0)}%`;

  return (
    <section className="rounded-2xl border border-border bg-card p-4 ring-1 ring-foreground/5">
      <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Performance editorial ({perf.windowDays} dias)
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric
          label="Tempo médio (Blog)"
          value={fmtMs(perf.avgGenerationMsByChannel.blog)}
        />
        <Metric
          label="Tempo médio (X)"
          value={fmtMs(perf.avgGenerationMsByChannel.x)}
        />
        <Metric
          label="Taxa de aprovação"
          value={pct(perf.approvalRate)}
        />
        <Metric
          label="Taxa de regeneração"
          value={pct(perf.regenerationRate)}
          hint={
            perf.regenerationRate > 0.3
              ? "Alta — prompt pode estar pedindo refinamento"
              : undefined
          }
        />
        <Metric
          label="Custo médio por artigo"
          value={
            perf.avgCostPerArticleBRL === null
              ? "—"
              : formatBRL(perf.avgCostPerArticleBRL)
          }
          hint="Apenas blogs publicados"
        />
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
      {hint && (
        <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
