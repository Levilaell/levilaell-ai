"use client";

import { useCallback, useMemo, useState } from "react";
import { Inbox, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminHeader } from "@/components/admin/admin-header";
import { PipelineCard } from "@/components/admin/pipeline-card";
import { PipelineFilters } from "@/components/admin/pipeline-filters";
import type {
  ChannelFilter,
  StatusFilter,
} from "@/components/admin/pipeline-filters";
import { NewTopicModal } from "@/components/admin/new-topic-modal";
import { DetailsModal } from "@/components/admin/details-modal";
import type { PipelineRow } from "@/types/admin";

type Props = {
  initialItems: PipelineRow[];
};

export function AdminDashboard({ initialItems }: Props) {
  const [items, setItems] = useState<PipelineRow[]>(initialItems);
  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [newOpen, setNewOpen] = useState(false);
  const [detailsItem, setDetailsItem] = useState<PipelineRow | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (channel !== "all" && item.channel !== channel) return false;
      if (status !== "all" && item.status !== status) return false;
      return true;
    });
  }, [items, channel, status]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetch("/api/admin/pipeline", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Erro ${res.status}`);
      }
      const body = (await res.json()) as { items: PipelineRow[] };
      setItems(body.items);
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : "Falha ao atualizar.");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const onCreated = (entry: PipelineRow) => {
    setItems((prev) => [entry, ...prev]);
  };

  const onDeleted = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <>
      <AdminHeader onNewTopicClick={() => setNewOpen(true)} />

      <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Pipeline editorial
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Fila → IA → revisão → publicação. {items.length} item
              {items.length === 1 ? "" : "s"} no total.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={refresh}
            disabled={isRefreshing}
            className="rounded-lg"
          >
            {isRefreshing ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="size-4" aria-hidden />
            )}
            Atualizar
          </Button>
        </div>

        {refreshError && (
          <p className="rounded-md bg-rose-50 p-2 text-sm text-rose-800">
            {refreshError}
          </p>
        )}

        <PipelineFilters
          channel={channel}
          status={status}
          onChannelChange={setChannel}
          onStatusChange={setStatus}
          count={filtered.length}
        />

        {filtered.length === 0 ? (
          <EmptyState
            empty={items.length === 0}
            onCreate={() => setNewOpen(true)}
          />
        ) : (
          <div className="grid gap-3">
            {filtered.map((item) => (
              <PipelineCard
                key={item.id}
                item={item}
                onDeleted={onDeleted}
                onOpenDetails={setDetailsItem}
              />
            ))}
          </div>
        )}
      </main>

      <NewTopicModal
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={onCreated}
      />
      <DetailsModal
        item={detailsItem}
        onOpenChange={(open) => !open && setDetailsItem(null)}
      />
    </>
  );
}

function EmptyState({
  empty,
  onCreate,
}: {
  empty: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 px-6 py-12 text-center">
      <Inbox className="mb-3 size-8 text-muted-foreground" aria-hidden />
      <p className="font-medium">
        {empty ? "Nenhum tema na fila ainda." : "Nenhum item para esses filtros."}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {empty
          ? "Adiciona o primeiro pra começar."
          : "Limpe os filtros ou adicione um novo tema."}
      </p>
      {empty && (
        <Button
          size="sm"
          variant="brand"
          onClick={onCreate}
          className="mt-4 rounded-lg"
        >
          Adicionar tema
        </Button>
      )}
    </div>
  );
}
