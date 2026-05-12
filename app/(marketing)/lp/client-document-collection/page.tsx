import type { Metadata } from "next";
import { LpPageTracker } from "@/components/marketing/lp/lp-page-tracker";
import { LpSectionTracker } from "@/components/marketing/lp/lp-section-tracker";
import { LpHero } from "@/components/marketing/lp/lp-hero";
import { LpImpactCalculator } from "@/components/marketing/lp/lp-impact-calculator";
import { LpHowItWorks } from "@/components/marketing/lp/lp-how-it-works";
import { LpAuthorBio } from "@/components/marketing/lp/lp-author-bio";
import { LpFaq } from "@/components/marketing/lp/lp-faq";
import { LpFinalCta } from "@/components/marketing/lp/lp-final-cta";

const LP_SLUG = "client-document-collection";

export const metadata: Metadata = {
  title:
    "Automação de cobrança de documentos do cliente — escritório contábil",
  description:
    "Workflow automatizado de cobrança via WhatsApp com IA contextual. Reduza 80% das mensagens manuais. Diagnóstico gratuito.",
};

const dtrVariants: Record<string, string> = {
  "whatsapp automatico contabilidade":
    "WhatsApp automatizado pra escritório contábil.",
  "cobrança automatica clientes":
    "Cobrança automática de documentos sem perder cliente.",
  "automatizar comunicação cliente":
    "Comunicação automatizada com cliente final do escritório.",
  "bot cobrança documentos":
    "Sistema de cobrança de documentos que não é bot genérico.",
  "lembrete automatico cliente":
    "Lembrete automático contextualizado por cliente.",
};

export default function Page() {
  return (
    <>
      <LpPageTracker lpSlug={LP_SLUG} />

      <LpHero
        lpSlug={LP_SLUG}
        eyebrow="Para escritórios de contabilidade"
        defaultHeadline="Sua equipe manda 30 vezes a mesma mensagem por dia. Pode ser um sistema."
        dtrVariants={dtrVariants}
        subHeadline="Workflow automatizado de cobrança via WhatsApp com IA contextual. Não é bot genérico — entende qual cliente precisa de qual documento, quando enviar e com qual tom."
      />

      <LpSectionTracker lpSlug={LP_SLUG} sectionName="impact_calculator">
        <LpImpactCalculator
          title="Faça a conta:"
          rows={[
            { label: "Mensagens manuais por dia", value: "30" },
            { label: "Tempo médio por mensagem", value: "4 minutos" },
            { label: "Total diário", value: "2 horas" },
            { label: "Total mensal por funcionário", value: "40 horas" },
            { label: "Custo médio da hora", value: "R$ 35" },
          ]}
          total={{
            label: "Custo mensal de comunicação manual",
            value: "R$ 1.400",
          }}
          subtitle="Sem contar mensagens esquecidas, follow-up perdido e clientes que reclamam de atraso."
        />
      </LpSectionTracker>

      <LpSectionTracker lpSlug={LP_SLUG} sectionName="how_it_works">
        <LpHowItWorks
          title="Como funciona:"
          steps={[
            {
              number: 1,
              title: "Sistema identifica o que falta",
              description:
                "Conectado ao seu controle interno, sabe quais documentos cada cliente ainda não enviou.",
            },
            {
              number: 2,
              title: "Escolhe o momento certo",
              description:
                "Considera prazo, histórico do cliente e contexto (mês de fechamento, feriado, etc.).",
            },
            {
              number: 3,
              title: "IA adapta o tom",
              description:
                "Cliente formal vs informal. Primeiro lembrete vs urgência. Sistema escala automaticamente.",
            },
            {
              number: 4,
              title: "Para quando precisa",
              description:
                "Cliente respondeu? Sistema para. Caso crítico? Notifica humano. Sem spam.",
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
              question: "WhatsApp Business API é caro?",
              answer:
                "Custo varia conforme volume (R$ 0,05-0,15 por mensagem em geral). Calculamos no diagnóstico se vale a pena pra seu volume específico. Pra escritórios médios, ROI é claro.",
            },
            {
              question: "E se o cliente reclamar de mensagens automáticas?",
              answer:
                "Por isso o sistema é contextual, não bot genérico. Adapta tom, espaça mensagens, para automaticamente quando cliente responde. Diferença sentida — clientes geralmente preferem porque é claro e previsível.",
            },
            {
              question: "Funciona com WhatsApp comum ou só Business?",
              answer:
                "Precisa de WhatsApp Business API (versão oficial para empresas). Te ajudamos no processo de aprovação, que demora 5-15 dias. WhatsApp comum não permite automação confiável.",
            },
            {
              question: "Quanto tempo pra implementar?",
              answer:
                "2-3 semanas pra primeiro fluxo. Inclui aprovação do número Business API, integração com seu sistema interno e configuração dos templates. Depois ajustamos com base no uso real.",
            },
          ]}
        />
      </LpSectionTracker>

      <LpFinalCta
        lpSlug={LP_SLUG}
        headline="Sua equipe pode parar de repetir mensagem?"
      />
    </>
  );
}
