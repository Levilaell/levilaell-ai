import { LpCalcomCta } from "@/components/marketing/lp-v2/lp-calcom-cta";
import { LpCtaButton } from "@/components/marketing/lp-v2/lp-cta-button";

interface LpDualCtaProps {
  lpSlug: string;
  headline: string;
  subtitle?: string;
  /** Texto da CTA primária — abre o form de agendar conversa (captura do lead). */
  ctaText?: string;
  /** Mostra também o link pro diagnóstico (qualificação). Off por padrão. */
  showDiagnosis?: boolean;
  diagnosisText?: string;
}

export function LpDualCta({
  lpSlug,
  headline,
  subtitle = "Uma conversa rápida pra entender o seu escritório e te mostrar onde dá pra automatizar primeiro. Sem compromisso.",
  ctaText = "Agendar conversa",
  showDiagnosis = false,
  diagnosisText = "Fazer diagnóstico",
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
            {ctaText}
          </LpCalcomCta>
          {showDiagnosis && (
            <LpCtaButton
              lpSlug={lpSlug}
              ctaPosition="final"
              variant="outline"
              className="bg-transparent text-zinc-50 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-50 dark:text-zinc-950 dark:border-zinc-300 dark:hover:bg-zinc-200 dark:hover:text-zinc-950"
            >
              {diagnosisText}
            </LpCtaButton>
          )}
        </div>
      </div>
    </section>
  );
}
