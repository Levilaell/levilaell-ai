"use client";

import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from "@/components/ui/dialog";
import { PipelineStatusBadge } from "@/components/admin/pipeline-status-badge";
import {
  CHANNEL_EMOJI,
  CHANNEL_LABELS,
  formatBRL,
  relativeTime,
} from "@/lib/admin-format";
import type { PipelineRow } from "@/types/admin";

type Props = {
  item: PipelineRow | null;
  onOpenChange: (open: boolean) => void;
};

export function DetailsModal({ item, onOpenChange }: Props) {
  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogPopup size="lg">
        {item && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span aria-hidden className="text-base">
                  {CHANNEL_EMOJI[item.channel]}
                </span>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {CHANNEL_LABELS[item.channel]}
                </span>
                <PipelineStatusBadge status={item.status} className="ml-auto" />
              </div>
              <DialogTitle>{item.topic}</DialogTitle>
              <DialogDescription>
                Criado {relativeTime(item.created_at)}
                {item.updated_at !== item.created_at &&
                  ` · atualizado ${relativeTime(item.updated_at)}`}
              </DialogDescription>
            </DialogHeader>

            <dl className="space-y-3 text-sm">
              {item.pillar && <Field label="Pilar">{item.pillar}</Field>}
              {item.keyword && (
                <Field label="Keyword">
                  <span className="font-mono">{item.keyword}</span>
                </Field>
              )}
              {item.notes && (
                <Field label="Notas">
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {item.notes}
                  </p>
                </Field>
              )}
              <Field label="Metadata">
                <pre className="overflow-auto rounded-md bg-muted/50 p-2 text-[11px] text-muted-foreground">
                  {JSON.stringify(item.metadata, null, 2)}
                </pre>
              </Field>
              <Field label="Custo IA">
                {item.cost_estimate_brl > 0
                  ? `${formatBRL(item.cost_estimate_brl)} · ${item.tokens_used.toLocaleString("pt-BR")} tokens`
                  : "—"}
              </Field>
              {item.error_message && (
                <Field label="Erro">
                  <p className="rounded-md bg-rose-50 p-2 text-rose-800">
                    {item.error_message}
                  </p>
                </Field>
              )}
              {item.notion_page_id && (
                <Field label="Notion page id">
                  <span className="font-mono text-xs">
                    {item.notion_page_id}
                  </span>
                </Field>
              )}
            </dl>
          </>
        )}
      </DialogPopup>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-start gap-3">
      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}
