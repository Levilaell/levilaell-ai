"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { PipelineModal } from "@/components/admin/pipeline-modal";
import type { PipelineRow } from "@/types/admin";

const POLL_INTERVAL_MS = 5_000;

type Props = {
  initialItems: PipelineRow[];
  initialSelectedId?: string | null;
};

export function AdminDashboard({ initialItems, initialSelectedId }: Props) {
  const [items, setItems] = useState<PipelineRow[]>(initialItems);
  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [newOpen, setNewOpen] = useState(false);
  const [modalItem, setModalItem] = useState<PipelineRow | null>(() => {
    if (!initialSelectedId) return null;
    return initialItems.find((i) => i.id === initialSelectedId) ?? null;
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [busyByItem, setBusyByItem] = useState<Record<string, "generate" | "publish" | undefined>>(
    {},
  );

  // Cost summary do mês computada das próprias linhas já carregadas. Custo é
  // sempre 0 antes de gerar; só itens gerados/publicados pesam. Sem query
  // extra no servidor — barata e suficiente pro warning bar.
  const costMonthBRL = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    ).getTime();
    return items.reduce((acc, it) => {
      if (new Date(it.created_at).getTime() < monthStart) return acc;
      return acc + Number(it.cost_estimate_brl ?? 0);
    }, 0);
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (channel !== "all" && item.channel !== channel) return false;
      if (status !== "all" && item.status !== status) return false;
      return true;
    });
  }, [items, channel, status]);

  const hasInFlight = useMemo(
    () =>
      items.some(
        (i) => i.status === "generating" || i.status === "publishing",
      ),
    [items],
  );

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

  // Polling — só corre enquanto algo estiver gerando ou publicando.
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);
  useEffect(() => {
    if (!hasInFlight) return;
    const id = setInterval(() => refreshRef.current(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hasInFlight]);

  const replaceItem = useCallback((entry: PipelineRow) => {
    setItems((prev) => prev.map((i) => (i.id === entry.id ? entry : i)));
    // Mantém o modal apontado pro item atualizado caso ele continue aberto.
    setModalItem((current) => (current && current.id === entry.id ? entry : current));
  }, []);

  const onCreated = (entry: PipelineRow) => {
    setItems((prev) => [entry, ...prev]);
  };

  const onDeleted = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const setBusy = (id: string, kind: "generate" | "publish" | undefined) => {
    setBusyByItem((prev) => {
      if (!kind) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: kind };
    });
  };

  const onGenerate = async (item: PipelineRow) => {
    setBusy(item.id, "generate");
    try {
      const res = await fetch(`/api/admin/pipeline/${item.id}/generate`, {
        method: "POST",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? `Erro ${res.status}`);
      replaceItem({
        ...item,
        status: "generating",
        error_message: null,
        generated_content: null,
        edited_content: null,
      });
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : "Falha ao gerar.");
    } finally {
      setBusy(item.id, undefined);
    }
  };

  const onReview = (item: PipelineRow) => {
    setModalItem(item);
  };

  const onPublish = async (item: PipelineRow) => {
    setBusy(item.id, "publish");
    try {
      const res = await fetch(`/api/admin/pipeline/${item.id}/publish`, {
        method: "POST",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? `Erro ${res.status}`);
      replaceItem(body.entry as PipelineRow);
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : "Falha ao publicar.");
    } finally {
      setBusy(item.id, undefined);
    }
  };

  return (
    <>
      <AdminHeader
        onNewTopicClick={() => setNewOpen(true)}
        costMonthBRL={costMonthBRL}
      />

      <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Pipeline editorial
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Fila → IA → revisão → publicação. {items.length} item
              {items.length === 1 ? "" : "s"} no total.
              {hasInFlight && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-blue-700">
                  <Loader2 className="size-3 animate-spin" aria-hidden />
                  atualizando ao vivo
                </span>
              )}
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
                onOpenDetails={setModalItem}
                onGenerate={onGenerate}
                onReview={onReview}
                onPublish={onPublish}
                isGenerating={busyByItem[item.id] === "generate"}
                isPublishing={busyByItem[item.id] === "publish"}
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
      <PipelineModal
        item={modalItem}
        onClose={() => setModalItem(null)}
        onUpdated={replaceItem}
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
