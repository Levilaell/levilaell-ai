import { NextResponse } from "next/server";
import { getDiagnosisStatusLite, isSupabaseConfigured } from "@/lib/supabase";

type Params = {
  params: Promise<{ id: string }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Polling lite — usado pelo DiagnosisLoadingState. Não retorna ai_analysis
// nem PII; só o que muda durante o processamento. Quando status=completed,
// o client chama router.refresh() pra carregar SSR completo (que faz
// getDiagnosisById pesado).
//
// Mapeamento DB → API: 'processing' → 'pending' (preserva a API contract
// do brief; o check constraint do banco só aceita processing/completed/failed
// e migrar enum dá trabalho desproporcional).
const NO_STORE = {
  "Cache-Control": "no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
};

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase não configurado." },
      { status: 503, headers: NO_STORE },
    );
  }

  const lite = await getDiagnosisStatusLite(id);
  if (!lite) {
    return NextResponse.json(
      { error: "Diagnóstico não encontrado." },
      { status: 404, headers: NO_STORE },
    );
  }

  const apiStatus =
    lite.status === "processing" ? "pending" : lite.status;

  return NextResponse.json(
    {
      status: apiStatus,
      ready: lite.status === "completed",
      error: lite.status === "failed" ? lite.error_message : undefined,
      retry_count: lite.retry_count,
    },
    { headers: NO_STORE },
  );
}
