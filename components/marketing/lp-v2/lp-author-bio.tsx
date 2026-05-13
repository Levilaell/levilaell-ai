import { LpCalcomCta } from "@/components/marketing/lp-v2/lp-calcom-cta";
import { LpCtaButton } from "@/components/marketing/lp-v2/lp-cta-button";

interface LpAuthorBioProps {
  lpSlug: string;
}

export function LpAuthorBio({ lpSlug }: LpAuthorBioProps) {
  return (
    <div className="container-page py-16 md:py-20">
      <div className="max-w-2xl mx-auto">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Equipe
        </p>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-4">
          Engenharia de automação para escritórios contábeis.
        </h2>
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Combinamos engenharia técnica (sistemas de IA em produção em fintech
          e automação B2B) com experiência em contabilidade e gestão
          financeira. Sob medida pro fluxo do seu escritório, não SaaS pronto.
          Revisão humana onde importa.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
          <LpCalcomCta lpSlug={lpSlug} ctaPosition="inline" size="lg">
            Agendar conversa de descoberta
          </LpCalcomCta>
          <LpCtaButton
            lpSlug={lpSlug}
            ctaPosition="inline"
            variant="outline"
            size="lg"
          >
            Fazer diagnóstico
          </LpCtaButton>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Diagnóstico gratuito sem compromisso. Proposta só se fizer sentido
          pra você.
        </p>
      </div>
    </div>
  );
}
