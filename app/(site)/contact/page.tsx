import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ContactForm } from "@/components/forms/contact-form";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Para parcerias, dúvidas ou imprensa. Para diagnósticos e propostas, prefira a ferramenta de diagnóstico — é mais rápido.",
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
        Para parcerias, dúvidas ou outros assuntos. Para diagnósticos e
        propostas, prefira a{" "}
        <Link
          href="/diagnosis"
          className="text-foreground underline decoration-brand decoration-2 underline-offset-4 font-medium"
        >
          ferramenta de diagnóstico
        </Link>{" "}
        — é mais rápido.
      </p>

      <div className="mt-10 rounded-2xl border border-border bg-card p-6 md:p-8">
        <Suspense
          fallback={<div className="h-72 animate-pulse rounded-xl bg-muted" />}
        >
          <ContactForm />
        </Suspense>
      </div>
    </section>
  );
}
