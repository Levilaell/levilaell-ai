import { NextResponse } from "next/server";
import { getDiagnosisById, isSupabaseConfigured } from "@/lib/supabase";

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

  const record = await getDiagnosisById(id);
  if (!record) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }
  if (record.status !== "completed" || !record.analysis) {
    return NextResponse.json({ status: record.status }, { status: 202 });
  }

  return NextResponse.json({
    id: record.id,
    createdAt: record.createdAt,
    name: record.name,
    timeline: record.q8_timeline,
    analysis: record.analysis,
  });
}
