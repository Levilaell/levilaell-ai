import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import {
  deletePipelineEntry,
  getPipelineById,
  patchPipelineEntry,
  PipelineError,
} from "@/lib/admin-pipeline";
import { patchPipelineSchema } from "@/types/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function guard(request: Request, paramsPromise: Params) {
  if (!(await isAdminAuthorized(request))) {
    return {
      error: NextResponse.json({ error: "Não autorizado." }, { status: 401 }),
    };
  }
  const { id } = await paramsPromise;
  if (!UUID_RE.test(id)) {
    return {
      error: NextResponse.json({ error: "ID inválido." }, { status: 400 }),
    };
  }
  return { id };
}

export async function GET(request: Request, ctx: { params: Params }) {
  const g = await guard(request, ctx.params);
  if ("error" in g) return g.error;

  try {
    const entry = await getPipelineById(g.id);
    if (!entry) {
      return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ entry });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(request: Request, ctx: { params: Params }) {
  const g = await guard(request, ctx.params);
  if ("error" in g) return g.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = patchPipelineSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Dados inválidos.",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 422 },
    );
  }

  try {
    const entry = await patchPipelineEntry(g.id, parsed.data);
    return NextResponse.json({ entry });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(request: Request, ctx: { params: Params }) {
  const g = await guard(request, ctx.params);
  if ("error" in g) return g.error;

  try {
    await deletePipelineEntry(g.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

function errorResponse(err: unknown) {
  if (err instanceof PipelineError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("[admin/pipeline/:id] unexpected", err);
  return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
}
