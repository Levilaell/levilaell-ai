import { cn } from "@/lib/utils";
import { CHANNEL_EMOJI, CHANNEL_LABELS } from "@/lib/admin-format";
import type { ContentSummaryRow } from "@/lib/admin-stats";

const NEWSLETTER_NOTE = "Phase 4 não construída";

export function ContentSummary({ rows }: { rows: ContentSummaryRow[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 ring-1 ring-foreground/5">
      <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Conteúdo (últimos 30 dias)
      </h2>
      <ul className="mt-3 space-y-3">
        {rows.map((row) => {
          const empty =
            row.generated === 0 &&
            row.published === 0 &&
            row.queued === 0 &&
            row.failed === 0;
          const isNewsletter = row.channel === "newsletter";
          return (
            <li
              key={row.channel}
              className={cn(
                "flex flex-wrap items-center gap-x-3 gap-y-1",
                empty && isNewsletter && "opacity-60",
              )}
            >
              <span aria-hidden className="text-base">
                {CHANNEL_EMOJI[row.channel]}
              </span>
              <span className="min-w-[88px] text-sm font-medium">
                {CHANNEL_LABELS[row.channel]}
              </span>
              {isNewsletter && empty ? (
                <span className="text-xs text-muted-foreground">
                  {NEWSLETTER_NOTE}
                </span>
              ) : (
                <div className="flex flex-wrap gap-3 text-xs tabular-nums">
                  <Stat label="gerados" count={row.generated} />
                  <Stat
                    label="publicados"
                    count={row.published}
                    tone="emerald"
                  />
                  {row.queued > 0 && (
                    <Stat label="fila" count={row.queued} tone="zinc" />
                  )}
                  {row.failed > 0 && (
                    <Stat label="falharam" count={row.failed} tone="rose" />
                  )}
                  {row.rejected > 0 && (
                    <Stat label="rejeitados" count={row.rejected} tone="zinc" />
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const TONES = {
  zinc: "text-muted-foreground",
  emerald: "text-emerald-700",
  rose: "text-rose-700",
} as const;

function Stat({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone?: keyof typeof TONES;
}) {
  return (
    <span className={cn("inline-flex items-baseline gap-1", tone && TONES[tone])}>
      <span className="font-medium">{count}</span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
