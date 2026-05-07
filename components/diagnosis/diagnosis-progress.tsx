import { cn } from "@/lib/utils";

type Props = {
  step: number;
  total: number;
};

export function DiagnosisProgress({ step, total }: Props) {
  const pct = Math.min(100, Math.max(0, (step / total) * 100));
  const display = Math.min(step + 1, total);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-muted-foreground">
        <span>
          Pergunta {display}/{total}
        </span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full bg-brand transition-all duration-300 ease-out")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
