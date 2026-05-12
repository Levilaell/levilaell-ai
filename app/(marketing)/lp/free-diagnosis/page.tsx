import type { Metadata } from "next";
import { LpPageTracker } from "@/components/marketing/lp/lp-page-tracker";
import { LpSectionTracker } from "@/components/marketing/lp/lp-section-tracker";
import { LpHero } from "@/components/marketing/lp/lp-hero";
import { LpImpactCalculator } from "@/components/marketing/lp/lp-impact-calculator";
import { LpHowItWorks } from "@/components/marketing/lp/lp-how-it-works";
import { LpAuthorBio } from "@/components/marketing/lp/lp-author-bio";
import { LpFaq } from "@/components/marketing/lp/lp-faq";
import { LpFinalCta } from "@/components/marketing/lp/lp-final-cta";

const LP_SLUG = "free-diagnosis";

export const metadata: Metadata = {
  title: "Engenharia de IA para escritórios contábeis — diagnóstico gratuito",
  description:
    "Sistemas de automação sob medida para escritórios de contabilidade. Stack moderna, retry logic, telemetria de custo. Diagnóstico gratuito em 2 minutos.",
};

const dtrVariants: Record<string, string> = {
  "automacao escritorio contabil":
    "Automação para escritório contábil que funciona em produção.",
  "ia para contadores":
    "IA para contadores: engenharia sob medida, não SaaS genérico.",
  "automatizar contabilidade":
    "Automatizar contabilidade com engenharia, não consultoria.",
  "consultoria automacao contabil":
    "Engenharia de automação para contabilidade.",
  "engenharia ia contabilidade":
    "Engenharia de IA para escritórios de contabilidade.",
  "produtividade escritorio contabil":
    "Produtividade no escritório contábil sem contratar mais.",
};

export default function Page() {
  return (
    <>
      <LpPageTracker lpSlug={LP_SLUG} />

      <LpHero
        lpSlug={LP_SLUG}
        eyebrow="Para escritórios de contabilidade"
        defaultHeadline="Engenharia de IA em produção, não em apresentação."
        dtrVariants={dtrVariants}
        subHeadline="Sistemas de automação sob medida pra escritórios contábeis que querem escalar sem contratar mais. Stack moderna. Retry logic. Telemetria de custo. Não quebra quando o volume cresce."
      />

      <LpSectionTracker lpSlug={LP_SLUG} sectionName="impact_calculator">
        <LpImpactCalculator
          title="Onde escritórios contábeis sangram tempo:"
          rows={[
            { label: "Classificação manual de documentos", value: "5h/dia" },
            { label: "Cobrança repetitiva de cliente", value: "2h/dia" },
            { label: "Extração de notas fiscais", value: "10h/dia" },
            {
              label: "Total horas perdidas (1 funcionário)",
              value: "17h/dia",
            },
            { label: "Em uma equipe de 5 pessoas", value: "85h/dia" },
          ]}
          total={{
            label: "Mensal: 1.700 horas. Anual: 20.400 horas.",
            value: "Que custam muito mais que automatizar.",
          }}
          subtitle="Cada hora dessa é repetitiva, propensa a erro humano, e desmotiva sua equipe."
        />
      </LpSectionTracker>

      <LpSectionTracker lpSlug={LP_SLUG} sectionName="how_it_works">
        <LpHowItWorks
          title="Por que NÃO é mais um SaaS:"
          steps={[
            {
              number: 1,
              title: "Engenharia, não consultoria genérica",
              description:
                "Sistema construído pra SEU fluxo. Não é configuração de software pronto.",
            },
            {
              number: 2,
              title: "Idempotência e retry",
              description:
                "Sistema não processa em duplicidade. Não quebra na primeira falha de rede.",
            },
            {
              number: 3,
              title: "Telemetria de custo",
              description:
                "Você vê quanto cada chamada de IA custa. Sem surpresa na fatura.",
            },
            {
              number: 4,
              title: "Integração com seu ERP",
              description:
                "Domínio, Onvio, Sage, Alterdata — todos. Sistema soma, não substitui.",
            },
          ]}
        />
      </LpSectionTracker>

      <LpSectionTracker lpSlug={LP_SLUG} sectionName="author_bio">
        <LpAuthorBio />
      </LpSectionTracker>

      <LpSectionTracker lpSlug={LP_SLUG} sectionName="faq">
        <LpFaq
          lpSlug={LP_SLUG}
          items={[
            {
              question: "Quanto custa um projeto?",
              answer:
                "Depende do escopo. Projetos pontuais começam em R$ 5.000. Implementações mais robustas vão até R$ 25.000. O diagnóstico gratuito te dá faixa específica baseada no seu caso.",
            },
            {
              question: "Quanto tempo demora?",
              answer:
                "Sprint de 2-4 semanas pra primeiro fluxo em produção. Depois iteramos com base no uso real. Não é projeto de 6 meses sem entregar nada.",
            },
            {
              question: "Funciona com qual ERP?",
              answer:
                "Sistemas mais comuns no mercado contábil: Domínio, Onvio, Sage, Alterdata, MasterMaq. Outros também funcionam — sistema é construído pra integrar com o que você usa.",
            },
            {
              question: "Como funciona o diagnóstico?",
              answer:
                "10 perguntas em 2 minutos. IA gera análise personalizada com 3 oportunidades priorizadas, estimativa de ROI e recomendação honesta (inclui \"ainda não é hora\" quando aplicável).",
            },
          ]}
        />
      </LpSectionTracker>

      <LpFinalCta
        lpSlug={LP_SLUG}
        headline="Onde seu escritório está perdendo tempo agora?"
      />
    </>
  );
}
