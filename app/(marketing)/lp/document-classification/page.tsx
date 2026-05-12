import type { Metadata } from "next";
import { LpPageTracker } from "@/components/marketing/lp/lp-page-tracker";
import { LpSectionTracker } from "@/components/marketing/lp/lp-section-tracker";
import { LpHero } from "@/components/marketing/lp/lp-hero";
import { LpImpactCalculator } from "@/components/marketing/lp/lp-impact-calculator";
import { LpHowItWorks } from "@/components/marketing/lp/lp-how-it-works";
import { LpAuthorBio } from "@/components/marketing/lp/lp-author-bio";
import { LpFaq } from "@/components/marketing/lp/lp-faq";
import { LpFinalCta } from "@/components/marketing/lp/lp-final-cta";

const LP_SLUG = "document-classification";

export const metadata: Metadata = {
  title: "Classificação automática de documentos para contabilidade",
  description:
    "Sistema sob medida com OCR + IA que aprende a categorização do seu escritório. Reduza 5h/dia de classificação manual. Diagnóstico gratuito em 2 minutos.",
};

const dtrVariants: Record<string, string> = {
  "classificação automática":
    "Classificação automática que aprende o jeito do seu escritório.",
  "ia para contabilidade":
    "IA para contabilidade que classifica documentos em 5 segundos.",
  "automatizar escritório contábil":
    "Automatizar escritório contábil começa pela classificação.",
  "ocr contabilidade":
    "OCR sob medida para o padrão de documentos do seu escritório.",
  "produtividade contábil":
    "Equipe contábil produtiva: 5h/dia sem classificar documento.",
  "ia escritorio contabil":
    "IA pra escritório contábil: classificação que aprende seu jeito.",
};

export default function Page() {
  return (
    <>
      <LpPageTracker lpSlug={LP_SLUG} />

      <LpHero
        lpSlug={LP_SLUG}
        eyebrow="Para escritórios de contabilidade"
        defaultHeadline="Sua equipe classifica 200 documentos por dia. IA faria em 5 segundos cada."
        dtrVariants={dtrVariants}
        subHeadline="Sistema sob medida com OCR e IA que aprende a categorização específica do seu escritório. Não é SaaS genérico — é construído pro seu fluxo, com revisão humana onde importa."
      />

      <LpSectionTracker lpSlug={LP_SLUG} sectionName="impact_calculator">
        <LpImpactCalculator
          title="Faça a conta:"
          rows={[
            { label: "Documentos classificados por dia", value: "200" },
            { label: "Tempo médio por documento", value: "1 minuto" },
            { label: "Total mensal por funcionário", value: "33 horas" },
            { label: "Custo médio da hora", value: "R$ 30" },
            { label: "Custo por funcionário", value: "R$ 990/mês" },
            { label: "Em uma equipe de 5 pessoas", value: "×5" },
          ]}
          total={{
            label: "Carga operacional mensal",
            value: "R$ 4.950",
          }}
          subtitle="Não é palpite. É matemática. Quanto custa pro seu escritório?"
        />
      </LpSectionTracker>

      <LpSectionTracker lpSlug={LP_SLUG} sectionName="how_it_works">
        <LpHowItWorks
          title="Como o sistema funciona:"
          steps={[
            {
              number: 1,
              title: "OCR custom",
              description:
                "Treinado pro padrão de documentos do seu escritório, não pra média do mercado.",
            },
            {
              number: 2,
              title: "IA aprende",
              description:
                "Cada correção sua ensina o sistema a categorizar melhor da próxima vez.",
            },
            {
              number: 3,
              title: "Validação humana onde importa",
              description:
                "Sistema passa direto onde tem confiança. Pergunta antes nos casos duvidosos.",
            },
            {
              number: 4,
              title: "Integração com seu ERP",
              description:
                "Funciona com Domínio, Onvio, Sage, Alterdata e outros. Não substitui — integra.",
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
              question: "Quanto custa?",
              answer:
                "Depende do volume e complexidade. Projetos começam em R$ 5.000 e podem chegar a R$ 25.000 para implementações complexas. O diagnóstico gratuito te dá uma faixa específica baseada no seu caso.",
            },
            {
              question: "Quanto tempo demora pra implementar?",
              answer:
                "Sprint de 2-4 semanas pra primeiro fluxo rodando. Depois iteramos com base no uso real. Não é projeto de 6 meses sem entregar nada.",
            },
            {
              question: "Funciona com meu sistema atual?",
              answer:
                "Sim. O sistema é construído pra integrar com seu fluxo, não pra substituir suas ferramentas. Documentos classificados podem entrar direto no seu ERP (Domínio, Onvio, Sage, Alterdata, etc.).",
            },
            {
              question: "E se meu formato de documento for muito específico?",
              answer:
                "Melhor ainda. Sistema sob medida funciona exatamente nesse caso. SaaS genérico falha quando o formato escapa da média. Engenharia custom resolve.",
            },
          ]}
        />
      </LpSectionTracker>

      <LpFinalCta
        lpSlug={LP_SLUG}
        headline="Quanto seu escritório perde com classificação manual?"
      />
    </>
  );
}
