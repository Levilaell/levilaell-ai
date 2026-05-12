import { LpCtaButton } from "@/components/marketing/lp/lp-cta-button";

interface LpFinalCtaProps {
  lpSlug: string;
  headline: string;
  ctaText?: string;
  subtitle?: string;
}

export function LpFinalCta({
  lpSlug,
  headline,
  ctaText = "Fazer diagnóstico em 2 minutos",
  subtitle = "Diagnóstico em 2 minutos · Análise por IA personalizada · Sem cadastro de cartão",
}: LpFinalCtaProps) {
  return (
    <section className="bg-zinc-900 text-zinc-50 px-6 py-20 md:py-28">
      <div className="mx-auto w-full max-w-3xl text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] text-white">
          {headline}
        </h2>
        <div className="mt-10">
          <LpCtaButton lpSlug={lpSlug} ctaPosition="final">
            {ctaText}
          </LpCtaButton>
        </div>
        {subtitle && (
          <p className="mt-5 text-xs md:text-sm text-zinc-400">{subtitle}</p>
        )}
      </div>
    </section>
  );
}
