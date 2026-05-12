import { DynamicHeadline } from "@/components/marketing/lp/dynamic-headline";
import { LpCtaButton } from "@/components/marketing/lp/lp-cta-button";

interface LpHeroProps {
  lpSlug: string;
  eyebrow?: string;
  defaultHeadline: string;
  dtrVariants: Record<string, string>;
  subHeadline: string;
  ctaText?: string;
  reassurance?: string;
}

export function LpHero({
  lpSlug,
  eyebrow,
  defaultHeadline,
  dtrVariants,
  subHeadline,
  ctaText = "Fazer diagnóstico em 2 minutos",
  reassurance = "Análise por IA personalizada · Sem cadastro de cartão",
}: LpHeroProps) {
  return (
    <section className="bg-zinc-900 text-zinc-50 px-6 py-20 md:py-28 lg:py-32 min-h-[80vh] flex items-center">
      <div className="mx-auto w-full max-w-4xl text-center">
        {eyebrow && (
          <p className="font-mono text-xs uppercase tracking-widest text-amber-400/90 mb-5">
            {eyebrow}
          </p>
        )}
        <DynamicHeadline
          defaultHeadline={defaultHeadline}
          variants={dtrVariants}
          className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] text-white"
        />
        <p className="mt-6 text-lg md:text-xl text-zinc-300 max-w-3xl mx-auto leading-relaxed">
          {subHeadline}
        </p>
        <div className="mt-10">
          <LpCtaButton lpSlug={lpSlug} ctaPosition="hero">
            {ctaText}
          </LpCtaButton>
        </div>
        <p className="mt-4 text-xs md:text-sm text-zinc-400">{reassurance}</p>
      </div>
    </section>
  );
}
