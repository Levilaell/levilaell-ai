import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CalendarClock } from "lucide-react";
import { ContactForm } from "@/components/forms/contact-form";
import { SchedulingButton } from "@/components/ui/scheduling-button";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Para parcerias, dúvidas ou imprensa. Para diagnósticos, prefira a ferramenta de diagnóstico — é mais rápido.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <section className="container-prose py-16 md:py-20">
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
        Contato
      </p>
      <h1 className="heading-1">Vamos conversar.</h1>
      <p className="text-lead mt-5">
        Para parcerias, dúvidas ou outros assuntos. Para diagnósticos, prefira a{" "}
        <Link
          href="/diagnosis"
          className="text-foreground underline decoration-brand decoration-2 underline-offset-4 font-medium"
        >
          ferramenta de diagnóstico
        </Link>{" "}
        — é mais rápido.
      </p>

      <div className="mt-10 rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="hidden sm:grid size-10 place-items-center rounded-lg bg-muted text-foreground shrink-0">
            <CalendarClock className="size-5" aria-hidden />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-base md:text-lg">
              Prefere conversar direto?
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              30min de conversa técnica — não é pitch comercial. Se eu não for a
              melhor pessoa pro seu caso, te indico quem é.
            </p>
            <div className="mt-4">
              <SchedulingButton
                size="default"
                variant="primary"
                source="contact_page"
                subject="Conversa técnica — Levi Lael"
                label="Agendar call de 30min"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 md:p-8">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
          Ou escreva
        </p>
        <Suspense
          fallback={<div className="h-72 animate-pulse rounded-xl bg-muted" />}
        >
          <ContactForm />
        </Suspense>
      </div>
    </section>
  );
}
