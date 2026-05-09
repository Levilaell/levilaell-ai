import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import {
  createPipelineEntry,
  listPipeline,
  PipelineError,
} from "@/lib/admin-pipeline";
import {
  createPipelineSchema,
  listPipelineQuerySchema,
} from "@/types/admin";
import { trackAdminEvent } from "@/lib/admin-tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = listPipelineQuerySchema.safeParse({
    channel: url.searchParams.get("channel") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parâmetros inválidos.", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  try {
    const items = await listPipeline(parsed.data);
    return NextResponse.json({ items });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = createPipelineSchema.safeParse(body);
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
    const entry = await createPipelineEntry(parsed.data);
    void trackAdminEvent("admin_pipeline_created", {
      pipeline_id: entry.id,
      channel: entry.channel,
    });
    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

function errorResponse(err: unknown) {
  if (err instanceof PipelineError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("[admin/pipeline] unexpected", err);
  return NextResponse.json(
    { error: "Erro inesperado." },
    { status: 500 },
  );
}
