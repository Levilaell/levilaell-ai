import { NextResponse, after } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { isAnthropicReady } from "@/lib/admin-anthropic";
import {
  claimForGeneration,
  PipelineError,
} from "@/lib/admin-pipeline";
import { runGeneration } from "@/lib/admin-generators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Params = Promise<{ id: string }>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request, ctx: { params: Params }) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (!isAnthropicReady()) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY ausente. Defina no .env.local antes de gerar.",
      },
      { status: 503 },
    );
  }

  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  let entry;
  try {
    entry = await claimForGeneration(id);
  } catch (err) {
    if (err instanceof PipelineError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[generate] claim failed", err);
    return NextResponse.json(
      { error: "Erro ao reservar o item pra geração." },
      { status: 500 },
    );
  }

  if (!entry) {
    return NextResponse.json(
      {
        error:
          "Item não está na fila (status precisa ser 'queued' ou 'failed').",
      },
      { status: 409 },
    );
  }

  // Geração roda *depois* da resposta voltar pro cliente. O front faz
  // polling em /api/admin/pipeline pra detectar quando vira 'generated'.
  after(async () => {
    await runGeneration(entry);
  });

  return NextResponse.json({ id: entry.id, status: entry.status });
}
