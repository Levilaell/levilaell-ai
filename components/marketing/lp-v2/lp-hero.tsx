import { Sparkles } from "lucide-react";
import { DynamicHeadline } from "@/components/marketing/lp-v2/dynamic-headline";
import { LpCalcomCta } from "@/components/marketing/lp-v2/lp-calcom-cta";
import { LpCtaButton } from "@/components/marketing/lp-v2/lp-cta-button";

interface LpHeroProps {
  lpSlug: string;
  eyebrow?: string;
  defaultHeadline: string;
  dtrVariants: Record<string, string>;
  subHeadline: string;
  /** Texto da CTA primária — abre o form de agendar conversa (captura do lead). */
  ctaText?: string;
  /** Mostra também o link pro diagnóstico (qualificação). Off por padrão — o
   *  funil de tráfego pago captura o lead numa CTA só, sem dispersar. */
  showDiagnosis?: boolean;
  diagnosisText?: string;
}

export function LpHero({
  lpSlug,
  eyebrow,
  defaultHeadline,
  dtrVariants,
  subHeadline,
  ctaText = "Agendar conversa",
  showDiagnosis = false,
  diagnosisText = "Fazer diagnóstico",
}: LpHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="container-page pt-16 md:pt-24 pb-16 md:pb-20">
        <div className="mx-auto max-w-3xl text-center">
          {eyebrow && (
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background px-3 py-1 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6">
              <Sparkles className="size-3.5 text-brand" aria-hidden />
              {eyebrow}
            </div>
          )}
          <DynamicHeadline
            defaultHeadline={defaultHeadline}
            variants={dtrVariants}
            className="heading-display"
          />
          <p className="text-lead mt-6 mx-auto">{subHeadline}</p>
          <div className="mt-10 flex flex-col sm:flex-row sm:flex-wrap justify-center gap-3">
            <LpCalcomCta lpSlug={lpSlug} ctaPosition="hero">
              {ctaText}
            </LpCalcomCta>
            {showDiagnosis && (
              <LpCtaButton lpSlug={lpSlug} ctaPosition="hero" variant="outline">
                {diagnosisText}
              </LpCtaButton>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
