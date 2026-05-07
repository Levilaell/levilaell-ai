import type { Metadata } from "next";
import { DiagnosisForm } from "@/components/diagnosis/diagnosis-form";

export const metadata: Metadata = {
  title: "Diagnóstico de operação com IA",
  description:
    "Em 2 minutos, descubra onde sua operação está perdendo tempo, dinheiro e oportunidades. Análise gerada por IA personalizada para o seu negócio.",
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
          Onde sua operação está perdendo tempo e dinheiro?
        </h1>
        <p className="text-lead mt-4">
          Responda 8 perguntas. Em até 2 minutos eu te mando uma análise personalizada com priorização, ROI estimado e quick win pra esta semana.
        </p>
      </header>
      <DiagnosisForm />
    </section>
  );
}
