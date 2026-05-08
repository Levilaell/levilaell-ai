"use client";

import { cn } from "@/lib/utils";
import type { Channel, PipelineStatus } from "@/types/admin";

type ChannelFilter = "all" | Channel;
type StatusFilter = "all" | PipelineStatus;

const CHANNEL_TABS: Array<{ value: ChannelFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "blog", label: "Blog" },
  { value: "newsletter", label: "Newsletter" },
  { value: "x", label: "X" },
];

const STATUS_TABS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "queued", label: "Fila" },
  { value: "generated", label: "Aguardando" },
  { value: "approved", label: "Aprovado" },
  { value: "published", label: "Publicado" },
  { value: "failed", label: "Falhou" },
];

type Props = {
  channel: ChannelFilter;
  status: StatusFilter;
  onChannelChange: (v: ChannelFilter) => void;
  onStatusChange: (v: StatusFilter) => void;
  count: number;
};

export function PipelineFilters({
  channel,
  status,
  onChannelChange,
  onStatusChange,
  count,
}: Props) {
  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Canal
        </span>
        <div className="flex flex-wrap gap-1.5">
          {CHANNEL_TABS.map((tab) => (
            <FilterPill
              key={tab.value}
              active={channel === tab.value}
              onClick={() => onChannelChange(tab.value)}
            >
              {tab.label}
            </FilterPill>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Status
        </span>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => (
            <FilterPill
              key={tab.value}
              active={status === tab.value}
              onClick={() => onStatusChange(tab.value)}
            >
              {tab.label}
            </FilterPill>
          ))}
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {count} {count === 1 ? "item" : "itens"}
        </span>
      </div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center rounded-full px-3 text-xs font-medium transition-colors",
        active
          ? "bg-foreground text-background"
          : "bg-background text-muted-foreground ring-1 ring-inset ring-border hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export type { ChannelFilter, StatusFilter };
