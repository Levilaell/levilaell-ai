import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DiagnosisResult } from "@/components/diagnosis/diagnosis-result";
import { DiagnosisResultFallback } from "@/components/diagnosis/diagnosis-result-fallback";
import { getSupabaseService, isSupabaseConfigured } from "@/lib/supabase";
import type { DiagnosisAnalysis } from "@/types/diagnosis";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Seu diagnóstico de operação",
    robots: { index: false, follow: false },
  };
}

async function fetchDiagnosis(id: string): Promise<{
  name: string;
  createdAt: string;
  analysis: DiagnosisAnalysis;
} | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseService();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("diagnoses")
    .select("name, created_at, ai_analysis, status")
    .eq("id", id)
    .maybeSingle();

  if (error || !data || data.status !== "completed" || !data.ai_analysis) {
    return null;
  }
  return {
    name: data.name,
    createdAt: data.created_at,
    analysis: data.ai_analysis,
  };
}

export default async function DiagnosisResultPage({ params }: Props) {
  const { id } = await params;
  const record = await fetchDiagnosis(id);

  return (
    <div className="container-prose py-12 md:py-16">
      <Button asChild variant="ghost" size="sm" className="rounded-lg mb-6 -ml-3">
        <Link href="/">
          <ArrowLeft className="size-4" aria-hidden /> Início
        </Link>
      </Button>
      {record ? (
        <DiagnosisResult
          name={record.name}
          createdAt={record.createdAt}
          analysis={record.analysis}
        />
      ) : (
        <DiagnosisResultFallback id={id} />
      )}
    </div>
  );
}
