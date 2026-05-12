import type { Metadata } from "next";
import { LpPageTracker } from "@/components/marketing/lp/lp-page-tracker";
import { LpSectionTracker } from "@/components/marketing/lp/lp-section-tracker";
import { LpHero } from "@/components/marketing/lp/lp-hero";
import { LpImpactCalculator } from "@/components/marketing/lp/lp-impact-calculator";
import { LpHowItWorks } from "@/components/marketing/lp/lp-how-it-works";
import { LpAuthorBio } from "@/components/marketing/lp/lp-author-bio";
import { LpFaq } from "@/components/marketing/lp/lp-faq";
import { LpFinalCta } from "@/components/marketing/lp/lp-final-cta";

const LP_SLUG = "invoice-extraction";

export const metadata: Metadata = {
  title: "Extração automática de notas fiscais — IA para escritório contábil",
  description:
    "OCR custom + IA validadora + integração direta com seu ERP. Reduza 10h/dia em extração manual. Diagnóstico gratuito.",
};

const dtrVariants: Record<string, string> = {
  "extração automática nota fiscal":
    "Extração automática de NF que entende seu formato específico.",
  "ocr nota fiscal":
    "OCR para nota fiscal: sistema sob medida pro seu fluxo contábil.",
  "extrair dados nfe":
    "Extrair dados de NF-e automaticamente com revisão onde importa.",
  "automatizar nota fiscal":
    "Automatizar processamento de notas fiscais no seu escritório.",
  "ia leitura nota fiscal":
    "IA que lê nota fiscal com 95-98% de precisão.",
};

export default function Page() {
  return (
    <>
      <LpPageTracker lpSlug={LP_SLUG} />

      <LpHero
        lpSlug={LP_SLUG}
        eyebrow="Para escritórios de contabilidade"
        defaultHeadline="Extrair dados de nota fiscal não deveria ser tarefa humana. Mas é. E custa caro."
        dtrVariants={dtrVariants}
        subHeadline="OCR custom + IA validadora + integração direta com seu ERP. Revisão humana só nos 5% duvidosos. O resto roda sozinho."
      />

      <LpSectionTracker lpSlug={LP_SLUG} sectionName="impact_calculator">
        <LpImpactCalculator
          title="Faça a conta:"
          rows={[
            { label: "Notas processadas por dia", value: "200" },
            { label: "Tempo médio por nota", value: "3 minutos" },
            { label: "Total diário", value: "10 horas" },
            { label: "Total mensal", value: "200 horas" },
            { label: "Custo médio da hora", value: "R$ 30" },
          ]}
          total={{
            label: "Custo mensal de extração manual",
            value: "R$ 6.000",
          }}
          subtitle="Sem contar re-trabalho por erro humano: 5-10% das notas precisam ser revisadas."
        />
      </LpSectionTracker>

      <LpSectionTracker lpSlug={LP_SLUG} sectionName="how_it_works">
        <LpHowItWorks
          title="Como funciona:"
          steps={[
            {
              number: 1,
              title: "Nota chega em qualquer formato",
              description:
                "PDF, XML, foto de papel, scan — sistema aceita todos. Não precisa padronizar antes.",
            },
            {
              number: 2,
              title: "OCR treinado pro seu formato",
              description:
                "Não é OCR genérico. Sistema é treinado especificamente no padrão de notas que você processa.",
            },
            {
              number: 3,
              title: "IA valida automaticamente",
              description:
                "CNPJ existe? Valor bate? Tributação consistente? Sistema cruza e sinaliza divergências.",
            },
            {
              number: 4,
              title: "Output direto pro ERP",
              description:
                "Dados estruturados entram automaticamente no seu sistema (Domínio, Onvio, etc.) ou planilha.",
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
                "Sim, ambas. NF-e é mais fácil (já vem estruturado em XML). NFS-e varia por prefeitura — adaptamos pro seu município. NF de serviço de outras prefeituras também funcionam.",
            },
            {
              question: "E notas escaneadas em papel?",
              answer:
                "Também funciona, com OCR. Acuracidade é menor que XML (90-95% vs 99%), mas suficiente pra automação. Casos duvidosos vão pra revisão humana automaticamente.",
            },
            {
              question: "Qual a precisão real do sistema?",
              answer:
                "95-98% em notas digitais estruturadas. 90-95% em escaneadas. Comparado a 90-95% de precisão humana (e mais lento). Sistema processa mais rápido e tem trilha de auditoria.",
            },
            {
              question: "Quanto custa por nota processada?",
              answer:
                "Custo unitário cai conforme volume. Em médias de mercado: R$ 0,10-0,30 por nota processada. Comparado a R$ 1,50 (3 min × R$ 30/h) humano. Payback rápido.",
            },
          ]}
        />
      </LpSectionTracker>

      <LpFinalCta
        lpSlug={LP_SLUG}
        headline="Quanto a extração manual está custando?"
      />
    </>
  );
}
