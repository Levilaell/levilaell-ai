import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DiagnosisResult } from "@/components/diagnosis/diagnosis-result";
import { TrackedLink } from "@/components/tracking/tracked-link";
import { examples, examplesBySlug } from "@/content/examples";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return examples.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const example = examplesBySlug[slug];
  if (!example) return { title: "Exemplo de diagnóstico" };
  return {
    title: example.title,
    description: example.metaDescription,
    alternates: { canonical: `/diagnosis/examples/${slug}` },
    openGraph: {
      title: example.title,
      description: example.metaDescription,
    },
  };
}

export default async function DiagnosisExamplePage({ params }: Props) {
  const { slug } = await params;
  const example = examplesBySlug[slug];
  if (!example) notFound();

  return (
    <div className="container-prose py-12 md:py-16">
      <Button asChild variant="ghost" size="sm" className="rounded-lg mb-6 -ml-3">
        <Link href="/blog">
          <ArrowLeft className="size-4" aria-hidden /> Conteúdo
        </Link>
      </Button>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 md:p-6 mb-10 dark:bg-amber-950/30 dark:border-amber-900">
        <p className="text-sm md:text-base font-medium text-amber-950 dark:text-amber-100">
          Este é um exemplo de diagnóstico real (anonimizado).
          Quer um para sua operação?{" "}
          <Link
            href="/diagnosis"
            className="underline decoration-2 underline-offset-2 font-semibold"
          >
            Fazer meu diagnóstico
          </Link>
        </p>
        <p className="mt-2 text-sm text-amber-900/80 dark:text-amber-100/70">
          {example.leadProfile}
        </p>
      </div>

      <DiagnosisResult
        name={example.title.replace("Diagnóstico anonimizado: ", "")}
        createdAt={example.publishedAt}
        analysis={example.analysis}
        timeline={example.timeline}
        context="example"
      />

      <section className="mt-16 rounded-2xl border border-border bg-card p-8 md:p-10 text-center">
        <h2 className="heading-2">Esse exemplo te lembra a sua operação?</h2>
        <p className="text-lead mt-4 max-w-xl mx-auto">
          Faça o diagnóstico e veja onde a sua especificamente está perdendo tempo.
        </p>
        <div className="mt-8 flex justify-center">
          <Button asChild size="xl" variant="brand" className="rounded-xl">
            <TrackedLink
              href="/diagnosis"
              trackLabel={`example_${slug}_diagnosis`}
            >
              Iniciar diagnóstico <ArrowRight className="size-4" aria-hidden />
            </TrackedLink>
          </Button>
        </div>
      </section>
    </div>
  );
}
