import { LpCalcomCta } from "@/components/marketing/lp-v2/lp-calcom-cta";
import { LpCtaButton } from "@/components/marketing/lp-v2/lp-cta-button";

interface LpDualCtaProps {
  lpSlug: string;
  headline: string;
  subtitle?: string;
  /** CTA primária → /diagnosis (funil diagnóstico-first). */
  ctaText?: string;
  /** Mostra também "Agendar conversa" (gate de contato). Off por padrão. */
  showScheduling?: boolean;
  schedulingText?: string;
}

export function LpDualCta({
  lpSlug,
  headline,
  subtitle = "Leva 2 minutos, é de graça e sem compromisso. No fim, você sai com o retrato do que dá pra automatizar primeiro.",
  ctaText = "Fazer diagnóstico gratuito",
  showScheduling = false,
  schedulingText = "Agendar conversa",
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
          <LpCtaButton lpSlug={lpSlug} ctaPosition="final" withArrow>
            {ctaText}
          </LpCtaButton>
          {showScheduling && (
            <LpCalcomCta
              lpSlug={lpSlug}
              ctaPosition="final"
              className="bg-transparent text-zinc-50 border border-zinc-700 shadow-none hover:bg-zinc-800 dark:text-zinc-950 dark:border-zinc-300 dark:hover:bg-zinc-200"
            >
              {schedulingText}
            </LpCalcomCta>
          )}
        </div>
      </div>
    </section>
  );
}
