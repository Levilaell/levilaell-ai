import { LpCalcomCta } from "@/components/marketing/lp-v2/lp-calcom-cta";
import { LpCtaButton } from "@/components/marketing/lp-v2/lp-cta-button";

interface LpDualCtaProps {
  lpSlug: string;
  headline: string;
  subtitle?: string;
  primaryCtaText?: string;
  secondaryCtaText?: string;
}

export function LpDualCta({
  lpSlug,
  headline,
  subtitle = "Agende uma conversa de 30 minutos ou faça o diagnóstico em 2 minutos.",
  primaryCtaText = "Agendar conversa",
  secondaryCtaText = "Fazer diagnóstico",
}: LpDualCtaProps) {
  return (
    <section className="bg-zinc-950 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-950">
      <div className="container-page py-20 md:py-28 text-center">
        <h2 className="heading-1">{headline}</h2>
        {subtitle && (
          <p className="text-lead mt-6 max-w-2xl mx-auto !text-zinc-300 dark:!text-zinc-700">
            {subtitle}
          </p>
        )}
        <div className="mt-10 flex flex-col sm:flex-row sm:flex-wrap justify-center gap-3">
          <LpCalcomCta lpSlug={lpSlug} ctaPosition="final">
            {primaryCtaText}
          </LpCalcomCta>
          <LpCtaButton
            lpSlug={lpSlug}
            ctaPosition="final"
            variant="outline"
            className="bg-transparent text-zinc-50 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-50 dark:text-zinc-950 dark:border-zinc-300 dark:hover:bg-zinc-200 dark:hover:text-zinc-950"
          >
            {secondaryCtaText}
          </LpCtaButton>
        </div>
      </div>
    </section>
  );
}
