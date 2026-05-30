import type { Metadata } from "next";
import { LpPageTracker } from "@/components/marketing/lp-v2/lp-page-tracker";
import { LpSectionTracker } from "@/components/marketing/lp-v2/lp-section-tracker";
import { LpHero } from "@/components/marketing/lp-v2/lp-hero";
import { LpImpactCalculator } from "@/components/marketing/lp-v2/lp-impact-calculator";
import { LpHowItWorks } from "@/components/marketing/lp-v2/lp-how-it-works";
import { LpAuthorBio } from "@/components/marketing/lp-v2/lp-author-bio";
import { LpFaq } from "@/components/marketing/lp-v2/lp-faq";
import { LpDualCta } from "@/components/marketing/lp-v2/lp-dual-cta";

const LP_SLUG = "automacao-contabil";

export const metadata: Metadata = {
  title: "Automação de processos para escritórios contábeis | Levi Lael",
  description:
    "Sistemas sob medida para automatizar triagem, cobrança e processamento de documentos no seu escritório contábil.",
  alternates: { canonical: "/automacao-contabil" },
};

const dtrVariants: Record<string, string> = {
  "automacao escritorio contabil":
    "Automação de processos para escritório contábil.",
  "automatizar contabilidade":
    "Automatize processos no seu escritório contábil.",
  "automacao contabil":
    "Automação contábil sob medida pra escritório.",
  "automacao processos contabilidade":
    "Automação de processos para escritório contábil.",
  "ia contabilidade":
    "Automação técnica de processos para escritório contábil.",
};

export default function Page() {
  return (
    <>
      <LpPageTracker lpSlug={LP_SLUG} />

      <LpHero
        lpSlug={LP_SLUG}
        eyebrow="Para escritórios de contabilidade"
        defaultHeadline="Automação de processos para escritórios contábeis."
        dtrVariants={dtrVariants}
        subHeadline="Sistema sob medida pro fluxo do seu escritório. Triagem de documentos, cobrança automatizada, processamento de notas — automatize o que sua equipe faz manualmente."
      />

      <LpSectionTracker lpSlug={LP_SLUG} sectionName="impact_calculator">
        <LpImpactCalculator
          title="Onde escritórios contábeis perdem tempo"
          rows={[
            { label: "Triagem documentos", value: "3,3h/dia" },
            { label: "Cobrança cliente", value: "2h/dia" },
            { label: "Notas fiscais", value: "10h/dia" },
          ]}
          total={{
            label: "Total de processo manual no escritório",
            value: "15,3h/dia",
          }}
          subtitle="Equivale a 2 funcionários full-time só em tarefa manual. Total mensal: ~337 horas. Cada hora dessa é repetitiva, propensa a erro humano, e desmotiva sua equipe."
        />
      </LpSectionTracker>

      <LpSectionTracker lpSlug={LP_SLUG} sectionName="how_it_works">
        <LpHowItWorks
          title="Por que não é mais um software"
          steps={[
            {
              number: 1,
              title: "Construído sob medida",
              description:
                "Sistema desenhado pro fluxo específico do seu escritório. Não é configuração de software pronto.",
            },
            {
              number: 2,
              title: "Conecta com seu ERP",
              description:
                "Via API ou import automático. Suporta Domínio, Onvio, Sage, Alterdata, MasterMaq e outros. Sistema soma ao que você já usa, não substitui.",
            },
            {
              number: 3,
              title: "Equipe não precisa virar técnica",
              description:
                "Sua equipe usa o sistema como sempre usou seu ERP. Sem treinamento técnico, sem curva de aprendizado pesada.",
            },
            {
              number: 4,
              title: "Suporte direto com a equipe técnica",
              description:
                "Não tem fila de suporte. Quando algo trava, você fala direto com a equipe que construiu o seu sistema, não com primeiro nível terceirizado.",
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
                "Depende do escopo. Projetos pontuais começam em R$ 5.000. Implementações mais robustas vão até R$ 25.000. Na conversa rápida eu já te dou uma estimativa baseada no seu caso.",
            },
            {
              question: "Quanto tempo demora?",
              answer:
                "Sprint de 2-4 semanas pra primeiro fluxo em produção. Depois iteramos com base no uso real. Não é projeto de 6 meses sem entregar nada.",
            },
            {
              question: "Funciona com qual ERP?",
              answer:
                "Conectamos via API ou import automático. Suporta Domínio, Onvio, Sage, Alterdata, MasterMaq e outros — sistema é construído pra integrar com o que você usa, no caminho que o ERP permitir.",
            },
            {
              question: "Como funciona a conversa?",
              answer:
                "Uma conversa rápida (uns 15 min) pra eu entender seu fluxo — ERP, volume, onde trava — e te dizer com honestidade o que dá pra automatizar primeiro (inclui 'ainda não é hora' quando for o caso). Sem pitch de vendedor.",
            },
          ]}
        />
      </LpSectionTracker>

      <LpDualCta
        lpSlug={LP_SLUG}
        headline="Onde seu escritório está perdendo tempo agora?"
      />
    </>
  );
}
