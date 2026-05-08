import { cn } from "@/lib/utils";
import type { PipelineStatus } from "@/types/admin";

const STATUS_LABELS: Record<PipelineStatus, string> = {
  queued: "Na fila",
  generating: "Gerando",
  generated: "Aguardando revisão",
  approved: "Aprovado",
  publishing: "Publicando",
  published: "Publicado",
  rejected: "Rejeitado",
  failed: "Falhou",
};

const STATUS_CLASSES: Record<PipelineStatus, string> = {
  queued: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  generating: "bg-blue-50 text-blue-800 ring-blue-200 animate-pulse",
  generated: "bg-amber-50 text-amber-900 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  publishing: "bg-blue-50 text-blue-800 ring-blue-200 animate-pulse",
  published: "bg-emerald-100 text-emerald-900 ring-emerald-300",
  rejected: "bg-zinc-100 text-zinc-500 ring-zinc-200",
  failed: "bg-rose-50 text-rose-800 ring-rose-200",
};

export function PipelineStatusBadge({
  status,
  className,
}: {
  status: PipelineStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium tracking-wide ring-1 ring-inset",
        STATUS_CLASSES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export const STATUS_LABEL_MAP = STATUS_LABELS;
