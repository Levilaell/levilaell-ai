/**
 * Queries de leitura pra /admin/stats.
 *
 * Custos: content_pipeline tem cost_estimate_brl persistido por entry; somamos
 * em Node (PostgREST não tem SUM nativo). Pra escala atual (poucos rows/mês)
 * é suficiente. Reavaliar se passar de ~10k rows/mês.
 *
 * Funil: única fonte = tracking_events. Não é o mesmo que count(diagnoses) —
 * eventos caem fora por DNT, ad blockers, race. Não misturar as métricas.
 */
import { getSupabaseService } from "@/lib/supabase";
import type { Channel, PipelineStatus } from "@/types/admin";

const FUNNEL_DAYS_DEFAULT = 30;
const PERF_DAYS_DEFAULT = 30;

export type CostSummary = {
  todayBRL: number;
  monthBRL: number;
  dailyLimitBRL: number;
  monthlyLimitBRL: number;
};

export type ContentSummaryRow = {
  channel: Channel;
  generated: number;
  published: number;
  queued: number;
  failed: number;
  rejected: number;
};

export type FunnelStep = {
  key: string;
  label: string;
  count: number;
};

export type FunnelStats = {
  windowDays: number;
  steps: FunnelStep[];
};

export type LeadSummary = {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  company: string | null;
  q2_business_model: string;
  q8_timeline: string;
  q9_budget: string;
  lead_score: number | null;
  created_at: string;
  contacted_at: string | null;
  qualified_at: string | null;
};

export type PerfMetrics = {
  windowDays: number;
  avgGenerationMsByChannel: Record<Channel, number | null>;
  approvalRate: number; // 0..1
  regenerationRate: number; // 0..1
  avgCostPerArticleBRL: number | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function getDailyLimitBRL(): number {
  return envNumber("ADMIN_DAILY_COST_LIMIT_BRL", 5);
}

export function getMonthlyLimitBRL(): number {
  return envNumber("ADMIN_MONTHLY_COST_LIMIT_BRL", 100);
}

function startOfTodayUTC(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfMonthUTC(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

function startOfDaysAgoUTC(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function service() {
  const c = getSupabaseService();
  if (!c) throw new Error("Supabase service client não configurado.");
  return c;
}

// ---------------------------------------------------------------------------
// Costs
// ---------------------------------------------------------------------------
export async function getCostBRLSince(
  isoStart: string,
): Promise<number> {
  const { data, error } = await service()
    .from("content_pipeline")
    .select("cost_estimate_brl")
    .gte("created_at", isoStart);
  if (error) {
    console.error("[admin-stats] getCostBRLSince", error);
    return 0;
  }
  return (data ?? []).reduce(
    (acc, r) => acc + Number(r.cost_estimate_brl ?? 0),
    0,
  );
}

export async function getCostToday(): Promise<number> {
  return getCostBRLSince(startOfTodayUTC());
}

export async function getCostMonth(): Promise<number> {
  return getCostBRLSince(startOfMonthUTC());
}

export async function getCostSummary(): Promise<CostSummary> {
  const [today, month] = await Promise.all([getCostToday(), getCostMonth()]);
  return {
    todayBRL: round2(today),
    monthBRL: round2(month),
    dailyLimitBRL: getDailyLimitBRL(),
    monthlyLimitBRL: getMonthlyLimitBRL(),
  };
}

// ---------------------------------------------------------------------------
// Content summary (last 30 days)
// ---------------------------------------------------------------------------
export async function getContentSummary(
  windowDays = 30,
): Promise<ContentSummaryRow[]> {
  const { data, error } = await service()
    .from("content_pipeline")
    .select("channel, status")
    .gte("created_at", startOfDaysAgoUTC(windowDays));

  if (error) {
    console.error("[admin-stats] getContentSummary", error);
    return [];
  }

  type CountsBucket = Omit<ContentSummaryRow, "channel">;
  const channels: Channel[] = ["blog", "x", "newsletter"];
  const init = (): CountsBucket => ({
    generated: 0,
    published: 0,
    queued: 0,
    failed: 0,
    rejected: 0,
  });
  const acc: Record<Channel, CountsBucket> = {
    blog: init(),
    x: init(),
    newsletter: init(),
  };

  for (const row of data ?? []) {
    const ch = row.channel as Channel;
    const st = row.status as PipelineStatus;
    if (!acc[ch]) continue;
    // "generated" no resumo conta tudo que já passou da geração (inclui
    // approved/published) — útil pra ver volume real produzido.
    if (
      st === "generated" ||
      st === "approved" ||
      st === "publishing" ||
      st === "published"
    ) {
      acc[ch].generated++;
    }
    if (st === "published") acc[ch].published++;
    if (st === "queued") acc[ch].queued++;
    if (st === "failed") acc[ch].failed++;
    if (st === "rejected") acc[ch].rejected++;
  }

  return channels.map((ch) => ({ channel: ch, ...acc[ch] }));
}

// ---------------------------------------------------------------------------
// Funnel (tracking_events, last 30 days)
// ---------------------------------------------------------------------------
export async function getFunnelStats(
  windowDays = FUNNEL_DAYS_DEFAULT,
): Promise<FunnelStats> {
  const since = startOfDaysAgoUTC(windowDays);

  // Buscar event_type + session_id pros eventos relevantes. PostgREST não tem
  // DISTINCT — fazemos Set-dedupe em Node. Aceitável pra escala atual; rever
  // se rows excederem ~50k.
  const { data, error } = await service()
    .from("tracking_events")
    .select("event_type, session_id")
    .gte("created_at", since)
    .in("event_type", [
      "page_view",
      "diagnosis_started",
      "diagnosis_completed",
      "cta_clicked",
      "calcom_clicked",
    ]);

  if (error) {
    console.error("[admin-stats] getFunnelStats", error);
    return { windowDays, steps: [] };
  }

  const sessionsByType = new Map<string, Set<string>>();
  for (const r of data ?? []) {
    const t = r.event_type as string;
    const s = (r.session_id as string | null) ?? "";
    if (!sessionsByType.has(t)) sessionsByType.set(t, new Set());
    sessionsByType.get(t)!.add(s);
  }

  const uniqueByType = (t: string) => sessionsByType.get(t)?.size ?? 0;

  return {
    windowDays,
    steps: [
      { key: "visitors", label: "Visitantes únicos", count: uniqueByType("page_view") },
      { key: "diagnosis_started", label: "Diagnósticos iniciados", count: uniqueByType("diagnosis_started") },
      { key: "diagnosis_completed", label: "Diagnósticos completados", count: uniqueByType("diagnosis_completed") },
      { key: "cta_clicked", label: "Cliques em CTA", count: uniqueByType("cta_clicked") },
      { key: "calcom_clicked", label: "Cliques em Cal.com", count: uniqueByType("calcom_clicked") },
    ],
  };
}

// ---------------------------------------------------------------------------
// Top leads (lightweight — sem ai_analysis)
// ---------------------------------------------------------------------------
export async function getTopLeads(limit = 10): Promise<LeadSummary[]> {
  const { data, error } = await service()
    .from("diagnoses")
    .select(
      "id, name, email, whatsapp, company, q2_business_model, q8_timeline, q9_budget, lead_score, created_at, contacted_at, qualified_at",
    )
    .eq("status", "completed")
    .order("lead_score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[admin-stats] getTopLeads", error);
    return [];
  }
  return (data ?? []) as LeadSummary[];
}

// ---------------------------------------------------------------------------
// Performance metrics (last 30 days)
// ---------------------------------------------------------------------------
export async function getPerfMetrics(
  windowDays = PERF_DAYS_DEFAULT,
): Promise<PerfMetrics> {
  const { data, error } = await service()
    .from("content_pipeline")
    .select(
      "channel, status, generated_in_ms, generation_count, cost_estimate_brl",
    )
    .gte("created_at", startOfDaysAgoUTC(windowDays));

  if (error) {
    console.error("[admin-stats] getPerfMetrics", error);
    return {
      windowDays,
      avgGenerationMsByChannel: { blog: null, x: null, newsletter: null },
      approvalRate: 0,
      regenerationRate: 0,
      avgCostPerArticleBRL: null,
    };
  }

  const ms: Record<Channel, number[]> = { blog: [], x: [], newsletter: [] };
  let totalGenerated = 0;
  let totalApproved = 0; // approved | publishing | published
  let totalRegen = 0;
  let blogCostSum = 0;
  let blogCostCount = 0;

  for (const row of data ?? []) {
    const ch = row.channel as Channel;
    const st = row.status as PipelineStatus;
    const dur = row.generated_in_ms;
    const count = row.generation_count ?? 0;
    if (typeof dur === "number" && dur > 0 && ms[ch]) ms[ch].push(dur);
    if (
      st === "generated" ||
      st === "approved" ||
      st === "publishing" ||
      st === "published" ||
      st === "rejected"
    ) {
      totalGenerated++;
      if (count >= 2) totalRegen++;
    }
    if (st === "approved" || st === "publishing" || st === "published") {
      totalApproved++;
    }
    if (ch === "blog" && st === "published") {
      blogCostSum += Number(row.cost_estimate_brl ?? 0);
      blogCostCount++;
    }
  }

  const avg = (arr: number[]): number | null =>
    arr.length === 0 ? null : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);

  return {
    windowDays,
    avgGenerationMsByChannel: {
      blog: avg(ms.blog),
      x: avg(ms.x),
      newsletter: avg(ms.newsletter),
    },
    approvalRate: totalGenerated === 0 ? 0 : totalApproved / totalGenerated,
    regenerationRate: totalGenerated === 0 ? 0 : totalRegen / totalGenerated,
    avgCostPerArticleBRL:
      blogCostCount === 0 ? null : round4(blogCostSum / blogCostCount),
  };
}

// ---------------------------------------------------------------------------
// Lead detail (completo + email_sequences)
// ---------------------------------------------------------------------------
export type LeadDetail = {
  diagnosis: Record<string, unknown>;
  email_sequences: Array<{
    email_number: number;
    scheduled_at: string;
    sent_at: string | null;
    status: "scheduled" | "sent" | "failed" | "cancelled";
    error_message: string | null;
  }>;
};

export async function getLeadDetail(id: string): Promise<LeadDetail | null> {
  const supabase = service();
  const [{ data: diag, error: dErr }, { data: seq, error: sErr }] =
    await Promise.all([
      supabase.from("diagnoses").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("email_sequences")
        .select("email_number, scheduled_at, sent_at, status, error_message")
        .eq("diagnosis_id", id)
        .order("email_number", { ascending: true }),
    ]);

  if (dErr) {
    console.error("[admin-stats] getLeadDetail diagnosis", dErr);
    return null;
  }
  if (!diag) return null;
  if (sErr) {
    console.warn("[admin-stats] getLeadDetail sequences", sErr);
  }

  return {
    diagnosis: diag as Record<string, unknown>,
    email_sequences: (seq ?? []) as LeadDetail["email_sequences"],
  };
}

// ---------------------------------------------------------------------------
// Aggregated stats payload (for /api/admin/stats)
// ---------------------------------------------------------------------------
export type StatsPayload = {
  cost: CostSummary;
  content: ContentSummaryRow[];
  funnel: FunnelStats;
  topLeads: LeadSummary[];
  perf: PerfMetrics;
};

export async function getStats(): Promise<StatsPayload> {
  const [cost, content, funnel, topLeads, perf] = await Promise.all([
    getCostSummary(),
    getContentSummary(),
    getFunnelStats(),
    getTopLeads(10),
    getPerfMetrics(),
  ]);
  return { cost, content, funnel, topLeads, perf };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
