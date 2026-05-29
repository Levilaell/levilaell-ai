import type { Metadata } from "next";
import { DescobertaExperience } from "@/components/descoberta/descoberta-experience";

export const metadata: Metadata = {
  title: "Diagnóstico contábil com IA",
  description:
    "Em 2 minutos, mapeie onde seu escritório contábil perde tempo. A IA faz perguntas sob medida pro seu cenário e aponta o que dá pra resolver primeiro.",
  alternates: { canonical: "/diagnosis" },
};

export default async function DiagnosisPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; d?: string }>;
}) {
  const sp = await searchParams;
  const source = typeof sp.source === "string" ? sp.source : undefined;
  const diagnosisId = typeof sp.d === "string" ? sp.d : undefined;

  return (
    <section className="container-prose py-16 md:py-20">
      <header className="mb-10 md:mb-12">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
          Diagnóstico gratuito · 2 minutos
        </p>
        <h1 className="heading-1">
          Onde seu escritório contábil está perdendo tempo?
        </h1>
        <p className="text-lead mt-4">
          Responde algumas perguntas e a IA mapeia o seu cenário — aponta o
          gargalo principal e o que dá pra automatizar primeiro no seu
          escritório.
        </p>
      </header>
      <DescobertaExperience source={source} diagnosisId={diagnosisId} />
    </section>
  );
}
