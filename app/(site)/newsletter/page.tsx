import type { Metadata } from "next";
import { CheckCircle2, Gift } from "lucide-react";
import { NewsletterForm } from "@/components/forms/newsletter-form";

export const metadata: Metadata = {
  title: "Newsletter",
  description:
    "Toda terça, um insight prático sobre IA, automação e profissionalização de operações. Direto, sem fluff.",
  alternates: { canonical: "/newsletter" },
};

const promises = [
  "Um insight estratégico por semana (3-5 minutos de leitura)",
  "Cases reais (anonimizados) de operações que automatizei",
  "Frameworks de decisão que uso com clientes",
  "Acesso antecipado a novos conteúdos e produtos",
];

export default function NewsletterPage() {
  return (
    <section className="container-prose py-16 md:py-20">
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
        Newsletter semanal
      </p>
      <h1 className="heading-1">A newsletter de quem leva operação a sério.</h1>
      <p className="text-lead mt-5">
        Toda terça, um insight prático sobre IA, automação ou profissionalização. Direto. Sem fluff. Para quem decide ou implementa.
      </p>

      <ul className="mt-10 space-y-3">
        {promises.map((p) => (
          <li key={p} className="flex items-start gap-3 text-base">
            <CheckCircle2 className="size-5 text-brand mt-0.5 shrink-0" aria-hidden />
            <span className="text-foreground/90 leading-relaxed">{p}</span>
          </li>
        ))}
      </ul>

      <div className="mt-12 grid gap-8 md:grid-cols-5 items-start">
        <div className="md:col-span-3 rounded-2xl border border-border bg-card p-6 md:p-7">
          <NewsletterForm />
          <p className="mt-4 text-xs text-muted-foreground">
            Sem spam. Você sai quando quiser, com 1 clique.
          </p>
        </div>

        <aside className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:bg-amber-950/30 dark:border-amber-900">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="size-5 text-amber-700 dark:text-amber-300" aria-hidden />
            <p className="font-mono text-xs uppercase tracking-widest text-amber-900 dark:text-amber-100">
              Lead magnet
            </p>
          </div>
          <h2 className="font-semibold text-lg leading-snug text-amber-950 dark:text-amber-100">
            Mapa de Operação Inteligente
          </h2>
          <p className="mt-3 text-sm text-amber-900/80 dark:text-amber-100/80 leading-relaxed">
            Ao assinar, você recebe imediatamente o framework em PDF de 12 páginas que uso com meus clientes pra mapear oportunidades de automação. Vale R$ 0 se você assinar hoje.
          </p>
          <p className="mt-4 text-xs font-mono text-amber-900/70 dark:text-amber-100/60">
            12 páginas · PDF · pt-BR
          </p>
        </aside>
      </div>
    </section>
  );
}
