import type { Metadata } from "next";
import { LpPageTracker } from "@/components/marketing/lp-v2/lp-page-tracker";
import { LpSectionTracker } from "@/components/marketing/lp-v2/lp-section-tracker";
import { LpHero } from "@/components/marketing/lp-v2/lp-hero";
import { LpImpactCalculator } from "@/components/marketing/lp-v2/lp-impact-calculator";
import { LpHowItWorks } from "@/components/marketing/lp-v2/lp-how-it-works";
import { LpAuthorBio } from "@/components/marketing/lp-v2/lp-author-bio";
import { LpFaq } from "@/components/marketing/lp-v2/lp-faq";
import { LpDualCta } from "@/components/marketing/lp-v2/lp-dual-cta";

const LP_SLUG = "cobranca-automatica";

export const metadata: Metadata = {
  title: "Automação de cobrança de documentos para escritórios contábeis",
  description:
    "Pare de repetir a mesma mensagem 30 vezes por dia. Workflow de cobrança automatizado para escritórios contábeis.",
  robots: {
    index: false,
    follow: false,
    noimageindex: true,
    nocache: true,
  },
};

const dtrVariants: Record<string, string> = {
  "automatizar cobranca clientes contabilidade":
    "Automatize a cobrança de documentos no seu escritório contábil.",
  "whatsapp automatico contabilidade":
    "WhatsApp automatizado para escritório contábil.",
  "lembrete automatico cliente contabil":
    "Lembrete automático de documentos — sem repetição manual.",
  "automacao atendimento contabilidade":
    "Automação de atendimento para escritório contábil.",
  "automacao contabilidade":
    "Automação de cobrança de documentos para escritório contábil.",
};

export default function Page() {
  return (
    <>
      <LpPageTracker lpSlug={LP_SLUG} />

      <LpHero
        lpSlug={LP_SLUG}
        eyebrow="Para escritórios de contabilidade"
        defaultHeadline="Sua equipe manda 30 vezes a mesma mensagem por dia. Automatize."
        dtrVariants={dtrVariants}
        subHeadline="Automação de cobrança via WhatsApp para escritórios contábeis. Sistema que conhece o histórico de cada cliente, escala lembretes e para automaticamente quando o cliente responde."
      />

      <LpSectionTracker lpSlug={LP_SLUG} sectionName="impact_calculator">
        <LpImpactCalculator
          title="Por que cobrar cliente todo mês dói"
          rows={[
            { label: "Mensagens manuais por dia", value: "30" },
            { label: "Tempo médio por mensagem", value: "4 minutos" },
            { label: "Total diário", value: "2 horas" },
            { label: "Total mensal", value: "44 horas" },
            { label: "Custo médio da hora (cargo de cobrança)", value: "R$ 35" },
          ]}
          total={{
            label: "Custo mensal de comunicação manual",
            value: "R$ 1.540",
          }}
          subtitle="Sem contar mensagem esquecida, follow-up perdido e cliente que reclama."
        />
      </LpSectionTracker>

      <LpSectionTracker lpSlug={LP_SLUG} sectionName="how_it_works">
        <LpHowItWorks
          title="Como funciona"
          steps={[
            {
              number: 1,
              title: "Conectado ao seu controle",
              description:
                "Sistema sabe quais documentos cada cliente já entregou e quais ainda faltam. Não precisa você dizer.",
            },
            {
              number: 2,
              title: "Escolhe o momento certo",
              description:
                "Considera o prazo, o histórico do cliente e o contexto (mês de fechamento, feriado, etc.). Não manda mensagem em horário ruim.",
            },
            {
              number: 3,
              title: "Adapta o tom",
              description:
                "Cliente formal recebe mensagem formal. Cliente próximo recebe mensagem casual. Primeira mensagem é leve. Lembretes escalam se necessário.",
            },
            {
              number: 4,
              title: "Para quando precisa",
              description:
                "Cliente respondeu? Sistema para. Caso crítico? Notifica humano. Sem spam, sem cliente irritado.",
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
              question: "WhatsApp Business API é caro?",
              answer:
                "Custo varia conforme volume (R$ 0,05-0,15 por mensagem em geral). Calculamos no diagnóstico se vale a pena pro seu volume específico. Pra escritórios médios, o ROI é claro.",
            },
            {
              question: "E se o cliente reclamar de mensagem automatizada?",
              answer:
                "Por isso o sistema adapta tom e ritmo. Não é bot que dispara em massa. Na prática, clientes preferem porque é claro, previsível e não atrapalha o trabalho deles.",
            },
            {
              question: "Funciona com WhatsApp comum ou só Business?",
              answer:
                "Precisa do WhatsApp Business API (versão oficial para empresas). Te ajudamos no processo de aprovação, que demora 5-15 dias.",
            },
            {
              question: "Quanto tempo pra implementar?",
              answer:
                "2-3 semanas pra primeiro fluxo. Inclui aprovação do número Business, integração com seu controle interno e configuração dos templates.",
            },
          ]}
        />
      </LpSectionTracker>

      <LpDualCta
        lpSlug={LP_SLUG}
        headline="Sua equipe pode parar de repetir mensagem?"
      />
    </>
  );
}
