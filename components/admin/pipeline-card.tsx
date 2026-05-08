"use client";

import { useState, useTransition } from "react";
import { Eye, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PipelineStatusBadge } from "@/components/admin/pipeline-status-badge";
import { CHANNEL_EMOJI, CHANNEL_LABELS, formatBRL, relativeTime } from "@/lib/admin-format";
import type { PipelineRow } from "@/types/admin";

type Props = {
  item: PipelineRow;
  onDeleted: (id: string) => void;
  onOpenDetails: (item: PipelineRow) => void;
};

export function PipelineCard({ item, onDeleted, onOpenDetails }: Props) {
  const [isDeleting, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onDelete = () => {
    if (!confirm(`Excluir "${item.topic}"?`)) return;
    startDelete(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/admin/pipeline/${item.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `Erro ${res.status}`);
        }
        onDeleted(item.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao excluir.");
      }
    });
  };

  return (
    <article className="group rounded-xl border border-border bg-card p-4 ring-1 ring-foreground/5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span
              aria-label={CHANNEL_LABELS[item.channel]}
              className="inline-flex h-5 items-center gap-1 rounded-full bg-muted px-2 text-[11px] font-medium text-muted-foreground"
            >
              <span aria-hidden>{CHANNEL_EMOJI[item.channel]}</span>
              {CHANNEL_LABELS[item.channel]}
            </span>
            <PipelineStatusBadge status={item.status} />
            {item.pillar && (
              <span className="inline-flex h-5 items-center rounded-full bg-zinc-50 px-2 text-[11px] text-zinc-600 ring-1 ring-inset ring-zinc-200">
                Pilar {item.pillar}
              </span>
            )}
          </div>
          <h3 className="font-medium leading-snug text-foreground">
            {item.topic}
          </h3>
          {item.keyword && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              keyword: <span className="font-mono">{item.keyword}</span>
            </p>
          )}
          <p className="mt-1.5 text-xs text-muted-foreground">
            {relativeTime(item.created_at)}
            {item.cost_estimate_brl > 0 && (
              <>
                <span className="mx-1.5">·</span>
                {formatBRL(item.cost_estimate_brl)}
              </>
            )}
            {item.tokens_used > 0 && (
              <>
                <span className="mx-1.5">·</span>
                {item.tokens_used.toLocaleString("pt-BR")} tokens
              </>
            )}
          </p>
          {item.error_message && (
            <p className="mt-2 rounded-md bg-rose-50 px-2 py-1 text-xs text-rose-800">
              {item.error_message}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => onOpenDetails(item)}
            aria-label="Detalhes"
          >
            <Eye className="size-4" aria-hidden />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onDelete}
            disabled={isDeleting}
            aria-label="Excluir"
            className="text-muted-foreground hover:text-destructive"
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="size-4" aria-hidden />
            )}
          </Button>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}
    </article>
  );
}
