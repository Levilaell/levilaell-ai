"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminHeader } from "@/components/admin/admin-header";
import { LeadsTable } from "@/components/admin/leads-table";
import { LeadDetailModal } from "@/components/admin/lead-detail-modal";
import { CostMeter } from "@/components/admin/cost-meter";
import { ContentSummary } from "@/components/admin/content-summary";
import { FunnelTracker } from "@/components/admin/funnel-tracker";
import { PerfMetrics } from "@/components/admin/perf-metrics";
import type { LeadSummary, StatsPayload } from "@/lib/admin-stats";

type Props = {
  initial: StatsPayload;
};

export function StatsDashboard({ initial }: Props) {
  const [stats, setStats] = useState<StatsPayload>(initial);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<LeadSummary | null>(null);
  const [tickedLeads, setTickedLeads] = useState<Record<string, Partial<LeadSummary>>>({});

  const refresh = async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Erro ${res.status}`);
      }
      const next = (await res.json()) as StatsPayload;
      setStats(next);
      setTickedLeads({});
    } catch (err) {
      setRefreshError(
        err instanceof Error ? err.message : "Falha ao atualizar.",
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // Apply local-only flips when the user marca contacted/qualified no modal.
  const leadsWithLocal = useMemo(() => {
    return stats.topLeads.map((l) => {
      const patch = tickedLeads[l.id];
      return patch ? { ...l, ...patch } : l;
    });
  }, [stats.topLeads, tickedLeads]);

  const onLeadUpdated = (id: string, patch: Partial<LeadSummary>) => {
    setTickedLeads((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...patch } }));
    setSelectedLead((current) => (current && current.id === id ? { ...current, ...patch } : current));
  };

  useEffect(() => {
    // Notifica o admin que stats foi visto (analytics interno).
    fetch("/api/tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "admin_stats_viewed",
        sessionId: "admin",
        pagePath: "/admin/stats",
      }),
      keepalive: true,
    }).catch(() => {});
  }, []);

  return (
    <>
      <AdminHeader
        costMonthBRL={stats.cost.monthBRL}
        monthlyLimitBRL={stats.cost.monthlyLimitBRL}
      />

      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3" aria-hidden />
              Voltar pra pipeline
            </Link>
            <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight">
              Stats
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Custo, conteúdo, funil e leads dos últimos 30 dias.
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

        <CostMeter cost={stats.cost} />

        <div className="grid gap-4 lg:grid-cols-2">
          <ContentSummary rows={stats.content} />
          <FunnelTracker funnel={stats.funnel} />
        </div>

        <PerfMetrics perf={stats.perf} />

        <LeadsTable
          leads={leadsWithLocal}
          onSelect={(l) => setSelectedLead(l)}
        />

        <p className="text-[11px] text-muted-foreground">
          Funil = tracking_events (caem fora por DNT/ad blockers).
          Leads = tabela diagnoses (fonte primária).
        </p>
      </main>

      <LeadDetailModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdated={onLeadUpdated}
      />
    </>
  );
}
