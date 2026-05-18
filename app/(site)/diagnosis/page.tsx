import type { Metadata } from "next";
import { DiagnosisForm } from "@/components/diagnosis/diagnosis-form";

export const metadata: Metadata = {
  title: "Diagnóstico contábil com IA",
  description:
    "Em 2 minutos, mapeie onde seu escritório contábil perde tempo. Recebe gargalo principal, top 3 oportunidades e plano de 30/60/90 dias.",
  alternates: { canonical: "/diagnosis" },
};

export default function DiagnosisPage() {
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
          Diagnóstico em 2 minutos. Você recebe gargalo principal, top 3 oportunidades priorizadas e plano de 30/60/90 dias pro seu escritório.
        </p>
      </header>
      <DiagnosisForm />
    </section>
  );
}
