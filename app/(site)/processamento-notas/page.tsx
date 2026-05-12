import type { Metadata } from "next";
import { LpPageTracker } from "@/components/marketing/lp-v2/lp-page-tracker";
import { LpSectionTracker } from "@/components/marketing/lp-v2/lp-section-tracker";
import { LpHero } from "@/components/marketing/lp-v2/lp-hero";
import { LpImpactCalculator } from "@/components/marketing/lp-v2/lp-impact-calculator";
import { LpHowItWorks } from "@/components/marketing/lp-v2/lp-how-it-works";
import { LpAuthorBio } from "@/components/marketing/lp-v2/lp-author-bio";
import { LpFaq } from "@/components/marketing/lp-v2/lp-faq";
import { LpDualCta } from "@/components/marketing/lp-v2/lp-dual-cta";

const LP_SLUG = "processamento-notas";

export const metadata: Metadata = {
  title:
    "Automação de processamento de notas fiscais — escritórios contábeis",
  description:
    "Sua equipe ainda digita dados de NF manualmente? Automação sob medida com revisão humana onde faz diferença.",
  robots: {
    index: false,
    follow: false,
    noimageindex: true,
    nocache: true,
  },
};

const dtrVariants: Record<string, string> = {
  "automatizar processamento notas fiscais":
    "Automatize o processamento de notas fiscais no seu escritório.",
  "automatizar nfe contabilidade":
    "Automatize a entrada de NF-e no fluxo do seu escritório.",
  "extrair dados nfe": "Extração automática de dados de nota fiscal.",
  "automatizar nota fiscal":
    "Automatize o processamento de notas fiscais.",
  "sistema processamento notas":
    "Sistema de processamento automático de notas para contabilidade.",
};

export default function Page() {
  return (
    <>
      <LpPageTracker lpSlug={LP_SLUG} />

      <LpHero
        lpSlug={LP_SLUG}
        eyebrow="Para escritórios de contabilidade"
        defaultHeadline="Sua equipe ainda digita dados de nota fiscal manualmente?"
        dtrVariants={dtrVariants}
        subHeadline="Automação de processamento de notas fiscais para escritórios contábeis. Extração + validação + integração com seu ERP. Revisão humana só nos casos que precisam."
      />

      <LpSectionTracker lpSlug={LP_SLUG} sectionName="impact_calculator">
        <LpImpactCalculator
          title="O custo invisível da digitação manual"
          rows={[
            { label: "Notas processadas por dia", value: "200" },
            { label: "Tempo médio por nota", value: "3 minutos" },
            { label: "Total diário", value: "10 horas" },
            { label: "Total mensal", value: "200 horas" },
            { label: "Custo médio da hora", value: "R$ 30" },
          ]}
          total={{
            label: "Custo mensal de processamento manual",
            value: "R$ 6.000",
          }}
          subtitle="Sem contar retrabalho de erro humano — em média 5-10% das notas precisam ser corrigidas."
        />
      </LpSectionTracker>

      <LpSectionTracker lpSlug={LP_SLUG} sectionName="how_it_works">
        <LpHowItWorks
          title="Como funciona"
          steps={[
            {
              number: 1,
              title: "Nota chega em qualquer formato",
              description:
                "PDF, XML, foto, scan — sistema aceita todos. Não precisa padronizar antes.",
            },
            {
              number: 2,
              title: "Sistema treinado pro seu padrão",
              description:
                "Não é leitor genérico. É treinado especificamente no formato de notas que SEU escritório processa.",
            },
            {
              number: 3,
              title: "Valida automaticamente",
              description:
                "CNPJ existe? Valor bate? Tributação correta? Sistema cruza dados e sinaliza divergências antes de entrar no ERP.",
            },
            {
              number: 4,
              title: "Output direto pro seu sistema",
              description:
                "Dados estruturados entram automaticamente no Domínio, Onvio, Sage ou planilha. Sua equipe só revisa o que precisa.",
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
              question: "Funciona com NF-e e NFS-e?",
              answer:
                "Sim, ambas. NF-e é mais simples (já vem em XML estruturado). NFS-e varia por prefeitura — adaptamos pro seu município ou pros municípios dos seus clientes.",
            },
            {
              question: "E notas escaneadas em papel?",
              answer:
                "Também funciona. A precisão é um pouco menor que em NF-e estruturada, mas suficiente pra automação. Casos duvidosos vão pra revisão humana automaticamente.",
            },
            {
              question: "Qual a precisão do sistema?",
              answer:
                "Tipicamente 95-98% em notas digitais estruturadas. 90-95% em escaneadas. Comparado a 90-95% de precisão humana — mas mais rápido e com trilha de auditoria completa.",
            },
            {
              question: "Quanto custa por nota processada?",
              answer:
                "Custo unitário cai conforme volume. Em médias de mercado: R$ 0,10-0,30 por nota processada. Comparado a R$ 1,50 (3 min × R$ 30/h) de processamento humano.",
            },
          ]}
        />
      </LpSectionTracker>

      <LpDualCta
        lpSlug={LP_SLUG}
        headline="Quanto a digitação manual de notas está custando?"
      />
    </>
  );
}
