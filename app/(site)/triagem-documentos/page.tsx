import type { Metadata } from "next";
import { LpPageTracker } from "@/components/marketing/lp-v2/lp-page-tracker";
import { LpSectionTracker } from "@/components/marketing/lp-v2/lp-section-tracker";
import { LpHero } from "@/components/marketing/lp-v2/lp-hero";
import { LpImpactCalculator } from "@/components/marketing/lp-v2/lp-impact-calculator";
import { LpHowItWorks } from "@/components/marketing/lp-v2/lp-how-it-works";
import { LpAuthorBio } from "@/components/marketing/lp-v2/lp-author-bio";
import { LpFaq } from "@/components/marketing/lp-v2/lp-faq";
import { LpDualCta } from "@/components/marketing/lp-v2/lp-dual-cta";

const LP_SLUG = "triagem-documentos";

export const metadata: Metadata = {
  title: "Triagem automática de documentos para escritórios contábeis",
  description:
    "Automatize horas de triagem manual de notas, recibos e contratos. Sistema sob medida pro fluxo do seu escritório.",
  robots: {
    index: false,
    follow: false,
    noimageindex: true,
    nocache: true,
  },
};

const dtrVariants: Record<string, string> = {
  "triagem automatica documentos":
    "Triagem automática de documentos para o seu escritório.",
  "automatizar triagem contabilidade":
    "Automatize a triagem do seu escritório contábil.",
  "automatizar classificacao documentos":
    "Automatize a classificação de documentos do escritório.",
  "ia escritorio contabil":
    "Automação de triagem para escritório contábil.",
  "automacao escritorio contabil":
    "Automação de processos para escritório contábil — comece pela triagem.",
};

export default function Page() {
  return (
    <>
      <LpPageTracker lpSlug={LP_SLUG} />

      <LpHero
        lpSlug={LP_SLUG}
        eyebrow="Para escritórios de contabilidade"
        defaultHeadline="Sua equipe gasta horas todo dia fazendo triagem de documentos."
        dtrVariants={dtrVariants}
        subHeadline="Sistema sob medida para automatizar a triagem de notas, recibos e contratos. Construído pro fluxo específico do seu escritório, com revisão humana onde faz diferença."
      />

      <LpSectionTracker lpSlug={LP_SLUG} sectionName="impact_calculator">
        <LpImpactCalculator
          title="O custo real da triagem manual"
          rows={[
            { label: "Documentos processados por dia (no escritório)", value: "200" },
            { label: "Tempo médio por documento", value: "1 minuto" },
            { label: "Tempo total mensal", value: "~73 horas" },
            { label: "Custo médio da hora", value: "R$ 30" },
          ]}
          total={{
            label: "Custo mensal de triagem manual",
            value: "R$ 2.200",
          }}
          subtitle="Equivale a um funcionário part-time só fazendo triagem. Quanto custa pro seu escritório?"
        />
      </LpSectionTracker>

      <LpSectionTracker lpSlug={LP_SLUG} sectionName="how_it_works">
        <LpHowItWorks
          title="Como funciona"
          steps={[
            {
              number: 1,
              title: "Sistema treinado pro seu padrão",
              description:
                "Não é software genérico. É construído baseado nos documentos que SEU escritório recebe, da forma que SEU fluxo organiza.",
            },
            {
              number: 2,
              title: "Aprende com você",
              description:
                "Cada correção sua melhora a próxima categorização. Sistema fica mais preciso ao longo do tempo.",
            },
            {
              number: 3,
              title: "Revisão humana onde importa",
              description:
                "Sistema passa direto onde tem certeza. Pergunta antes nos casos duvidosos. Sua equipe foca no que não pode automatizar.",
            },
            {
              number: 4,
              title: "Conecta com seu ERP",
              description:
                "Via API ou import automático. Suporta Domínio, Onvio, Sage, Alterdata, MasterMaq e outros. Os documentos triados entram no seu fluxo atual.",
            },
          ]}
        />
      </LpSectionTracker>

      <LpSectionTracker lpSlug={LP_SLUG} sectionName="author_bio">
        <LpAuthorBio lpSlug={LP_SLUG} />
      </LpSectionTracker>

      <LpSectionTracker lpSlug={LP_SLUG} sectionName="faq">
        <LpFaq
          lpSlug={LP_SLUG}
          items={[
            {
              question: "Quanto custa um projeto?",
              answer:
                "Depende do volume e da complexidade. Projetos começam em R$ 5.000 e vão até R$ 25.000 para implementações mais robustas. O diagnóstico gratuito traz uma estimativa baseada no seu caso.",
            },
            {
              question: "Quanto tempo demora pra implementar?",
              answer:
                "Sprint de 2-4 semanas pra primeiro fluxo rodando. Depois iteramos com base no uso real. Não é projeto de 6 meses sem entregar nada.",
            },
            {
              question: "Funciona com meu sistema atual?",
              answer:
                "Sim. Conectamos com seu ERP via API ou import automático — Domínio, Onvio, Sage, Alterdata, MasterMaq e outros. O sistema é construído pra integrar com seu fluxo, não substituir suas ferramentas.",
            },
            {
              question: "E se meu formato de documento for muito específico?",
              answer:
                "Melhor ainda. Sistema sob medida funciona exatamente nesse caso. Software pronto falha quando o formato escapa da média. Construído sob medida resolve.",
            },
          ]}
        />
      </LpSectionTracker>

      <LpDualCta
        lpSlug={LP_SLUG}
        headline="Quanto seu escritório perde com triagem manual?"
      />
    </>
  );
}
