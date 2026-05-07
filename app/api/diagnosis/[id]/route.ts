import { NextResponse } from "next/server";
import { getSupabaseService, isSupabaseConfigured } from "@/lib/supabase";

type Params = {
  params: Promise<{ id: string }>;
};

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Diagnóstico não persistido (Supabase não configurado)." },
      { status: 404 },
    );
  }
  const supabase = getSupabaseService();
  if (!supabase) {
    return NextResponse.json({ error: "Storage indisponível." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("diagnoses")
    .select("id, created_at, name, ai_analysis, status")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }
  if (data.status !== "completed" || !data.ai_analysis) {
    return NextResponse.json({ status: data.status }, { status: 202 });
  }

  return NextResponse.json({
    id: data.id,
    createdAt: data.created_at,
    name: data.name,
    analysis: data.ai_analysis,
  });
}
