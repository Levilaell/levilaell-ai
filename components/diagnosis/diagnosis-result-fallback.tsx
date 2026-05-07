"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DiagnosisResult } from "@/components/diagnosis/diagnosis-result";
import { loadResult, type StoredResult } from "@/lib/diagnosis-storage";

export function DiagnosisResultFallback({ id }: { id: string }) {
  const [stored, setStored] = useState<StoredResult | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStored(loadResult(id));
    setHydrated(true);
  }, [id]);

  if (!hydrated) {
    return (
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Carregando seu diagnóstico…
      </div>
    );
  }

  if (!stored) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="heading-3">Não encontrei esse diagnóstico.</h1>
        <p className="mt-3 text-muted-foreground">
          O link pode ter expirado, ou o diagnóstico foi feito em outro navegador.
          Faça um novo agora — leva 2 minutos.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild variant="brand" size="lg" className="rounded-xl">
            <Link href="/diagnosis">Fazer novo diagnóstico</Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="rounded-xl">
            <Link href="/">
              <ArrowLeft className="size-4" aria-hidden /> Voltar ao início
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DiagnosisResult
      name={stored.name}
      createdAt={stored.createdAt}
      analysis={stored.analysis}
      timeline={stored.timeline}
      diagnosisId={id}
    />
  );
}
