import type { Metadata } from "next";
import { DescobertaExperience } from "@/components/descoberta/descoberta-experience";

export const metadata: Metadata = {
  title: "Descoberta com IA — monte sua proposta de automação | Levi Lael",
  description:
    "Sem call de descoberta: responda algumas perguntas e a IA monta o retrato do seu escritório pra uma proposta de automação contábil sob medida.",
};

export default async function DescobertaPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; d?: string }>;
}) {
  const sp = await searchParams;
  const diagnosisId = typeof sp.d === "string" ? sp.d : undefined;
  const source = typeof sp.source === "string" ? sp.source : undefined;

  return (
    <section className="relative overflow-hidden bg-[#070709] py-10 md:py-16">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, color-mix(in oklab, var(--brand) 60%, transparent), transparent)",
        }}
        aria-hidden
      />
      <div className="container-page relative">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-brand">
            Descoberta · IA
          </p>
          <h1 className="heading-1 mt-3 text-white">
            Sua proposta começa aqui
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-zinc-400">
            Sem reunião. Me conta o que você precisa automatizar — a IA monta o
            retrato do seu escritório e já marcamos uma call de proposta.
          </p>
        </div>
        <DescobertaExperience source={source} diagnosisId={diagnosisId} />
      </div>
    </section>
  );
}
