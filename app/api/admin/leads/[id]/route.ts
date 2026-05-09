import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { getLeadDetail } from "@/lib/admin-stats";
import { getSupabaseService } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const patchSchema = z.object({
  contacted: z.boolean().optional(),
  qualified: z.boolean().optional(),
  notes: z.string().max(2000).optional().nullable(),
});

async function guard(request: Request, params: Params) {
  if (!(await isAdminAuthorized(request))) {
    return {
      error: NextResponse.json({ error: "Não autorizado." }, { status: 401 }),
    };
  }
  const { id } = await params;
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

  const detail = await getLeadDetail(g.id);
  if (!detail) {
    return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
  }
  return NextResponse.json(detail);
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
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const supabase = getSupabaseService();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase service client não configurado." },
      { status: 503 },
    );
  }

  const update: Database["public"]["Tables"]["diagnoses"]["Update"] = {};
  if (typeof parsed.data.contacted === "boolean") {
    update.contacted_at = parsed.data.contacted ? new Date().toISOString() : null;
  }
  if (typeof parsed.data.qualified === "boolean") {
    update.qualified_at = parsed.data.qualified ? new Date().toISOString() : null;
  }
  if (parsed.data.notes !== undefined) {
    update.lead_notes = parsed.data.notes;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true, updated: 0 });
  }

  const { data, error } = await supabase
    .from("diagnoses")
    .update(update)
    .eq("id", g.id)
    .select(
      "id, contacted_at, qualified_at, lead_notes",
    )
    .single();

  if (error) {
    console.error("[admin/leads/:id] PATCH failed", { id: g.id, error });
    return NextResponse.json(
      { error: error.message ?? "Erro ao atualizar." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, lead: data });
}
