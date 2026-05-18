import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DiagnosisResult } from "@/components/diagnosis/diagnosis-result";
import { DiagnosisResultFallback } from "@/components/diagnosis/diagnosis-result-fallback";
import { DiagnosisLoadingState } from "@/components/diagnosis/diagnosis-loading-state";
import { DiagnosisFailedState } from "@/components/diagnosis/diagnosis-failed-state";
import { TrackOnMount } from "@/components/tracking/track-on-mount";
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

  return (
    <div className="container-prose py-12 md:py-16">
      <TrackOnMount
        type="diagnosis_result_viewed"
        data={{ id, status: record?.status ?? "unknown" }}
      />
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
      {renderBody(id, record)}
    </div>
  );
}

function renderBody(
  id: string,
  record: Awaited<ReturnType<typeof getDiagnosisById>>,
) {
  // Sem registro no Supabase: cai no fallback localStorage (dev mode, ou
  // diagnósticos pré-Supabase). Mantém comportamento legacy.
  if (!record) {
    return <DiagnosisResultFallback id={id} />;
  }
  if (record.status === "completed" && record.analysis) {
    return (
      <DiagnosisResult
        name={record.name}
        createdAt={record.createdAt}
        analysis={record.analysis}
        timeline={record.q8_timeline}
        diagnosisId={id}
      />
    );
  }
  if (record.status === "failed") {
    return (
      <DiagnosisFailedState
        id={id}
        name={record.name}
        errorDetail={record.error_message}
        retryUsed={record.retry_count >= 1}
      />
    );
  }
  // status === "processing" (a.k.a. pending na API) OU completed mas sem
  // analysis (estado intermediário curto entre update statuses).
  return <DiagnosisLoadingState id={id} name={record.name} />;
}
