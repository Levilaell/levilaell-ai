import Link from "next/link";
import { getStats, type StatsPayload } from "@/lib/admin-stats";
import { isSupabaseConfigured } from "@/lib/supabase";
import { StatsDashboard } from "@/components/admin/stats-dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminStatsPage() {
  if (!isSupabaseConfigured()) {
    return <ConfigError reason="Supabase não configurado." />;
  }

  let initial: StatsPayload | null = null;
  let error: string | null = null;
  try {
    initial = await getStats();
  } catch (err) {
    error = err instanceof Error ? err.message : "Erro ao carregar stats.";
  }

  if (error || !initial) {
    return <ConfigError reason={error ?? "Erro desconhecido."} />;
  }

  return <StatsDashboard initial={initial} />;
}

function ConfigError({ reason }: { reason: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-sm rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-semibold">Não foi possível carregar stats.</p>
        <p className="mt-1">{reason}</p>
        <p className="mt-3">
          <Link href="/admin" className="underline-offset-2 hover:underline">
            ← Voltar pro pipeline
          </Link>
        </p>
      </div>
    </div>
  );
}
