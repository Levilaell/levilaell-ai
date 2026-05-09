import { listPipeline, PipelineError } from "@/lib/admin-pipeline";
import { isSupabaseConfigured } from "@/lib/supabase";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!isSupabaseConfigured()) {
    return <ConfigError reason="Supabase não configurado." />;
  }

  const result = await loadInitial();
  if (!result.ok) return <ConfigError reason={result.reason} />;

  const sp = await searchParams;
  const idParam = typeof sp.id === "string" && UUID_RE.test(sp.id) ? sp.id : null;

  return (
    <AdminDashboard
      initialItems={result.items}
      initialSelectedId={idParam}
    />
  );
}

async function loadInitial(): Promise<
  | { ok: true; items: Awaited<ReturnType<typeof listPipeline>> }
  | { ok: false; reason: string }
> {
  try {
    const items = await listPipeline();
    return { ok: true, items };
  } catch (err) {
    const reason =
      err instanceof PipelineError ? err.message : "Erro ao carregar pipeline.";
    return { ok: false, reason };
  }
}

function ConfigError({ reason }: { reason: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-sm rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-semibold">Não foi possível carregar o admin.</p>
        <p className="mt-1">{reason}</p>
        <p className="mt-3 text-xs text-amber-900/70">
          Confira <code className="font-mono">.env.local</code> e a migration
          0004.
        </p>
      </div>
    </div>
  );
}
