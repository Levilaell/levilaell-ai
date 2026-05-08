import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import {
  getPipelineById,
  patchPipelineEntry,
  PipelineError,
} from "@/lib/admin-pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request, ctx: { params: Params }) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  let entry;
  try {
    entry = await getPipelineById(id);
  } catch (err) {
    return errorResponse(err);
  }

  if (!entry) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }
  if (entry.status !== "approved") {
    return NextResponse.json(
      {
        error: `Publish exige status 'approved' (atual: ${entry.status}).`,
      },
      { status: 409 },
    );
  }

  try {
    if (entry.channel === "x") {
      // X é manual — usuário copia e cola. Marcamos como 'publishing'
      // (transitório) e em seguida 'published' pra registrar published_at.
      const transit = await patchPipelineEntry(id, { status: "publishing" });
      const published = await patchPipelineEntry(transit.id, {
        status: "published",
      });
      return NextResponse.json({ entry: published });
    }

    // Phase 3 (blog) e Phase 4 (newsletter) plugam aqui.
    return NextResponse.json(
      {
        error: `Publish para canal ${entry.channel} ainda não implementado.`,
      },
      { status: 501 },
    );
  } catch (err) {
    return errorResponse(err);
  }
}

function errorResponse(err: unknown) {
  if (err instanceof PipelineError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("[admin/publish] unexpected", err);
  return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
}
