import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DiagnosisResult } from "@/components/diagnosis/diagnosis-result";
import { DiagnosisResultFallback } from "@/components/diagnosis/diagnosis-result-fallback";
import { getDiagnosisById } from "@/lib/supabase";

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

export default async function DiagnosisResultPage({ params }: Props) {
  const { id } = await params;
  const record = await getDiagnosisById(id);
  const hasCompleted = record && record.status === "completed" && record.analysis;

  return (
    <div className="container-prose py-12 md:py-16">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="rounded-lg mb-6 -ml-3"
      >
        <Link href="/">
          <ArrowLeft className="size-4" aria-hidden /> Início
        </Link>
      </Button>
      {hasCompleted ? (
        <DiagnosisResult
          name={record.name}
          createdAt={record.createdAt}
          analysis={record.analysis!}
          timeline={record.q8_timeline}
        />
      ) : (
        <DiagnosisResultFallback id={id} />
      )}
    </div>
  );
}
