import { z } from "zod";

const consentRequired = z
  .boolean()
  .refine((v) => v === true, { message: "É necessário aceitar os termos." });

export const newsletterSchema = z.object({
  name: z.string().min(2, "Nome muito curto.").max(80),
  email: z.email("E-mail inválido."),
  consent: consentRequired,
});
export type NewsletterInput = z.infer<typeof newsletterSchema>;

export const contactSchema = z.object({
  name: z.string().min(2, "Nome muito curto.").max(80),
  email: z.email("E-mail inválido."),
  company: z.string().max(120).optional().or(z.literal("")),
  subject: z.enum(["partnership", "question", "press", "other"]),
  service_interest: z.string().max(40).optional().or(z.literal("")),
  message: z.string().min(10, "Mensagem muito curta.").max(2000),
});
export type ContactInput = z.infer<typeof contactSchema>;

// ---------------------------------------------------------------------------
// Diagnóstico V2 contábil (>=2026-05-18)
// 7 perguntas: carteira, ERP, perfil de cliente, dores, horas, histórico,
// urgência. Lead capture mínimo (name + email + consent).
// ---------------------------------------------------------------------------
export const diagnosisAnswersSchema = z.object({
  q1_size: z.enum([
    "ate_30",
    "30_a_100",
    "100_a_250",
    "250_a_500",
    "500_mais",
  ]),
  q2_erp: z.enum([
    "dominio",
    "onvio",
    "alterdata",
    "sage",
    "contmatic",
    "mastermaq",
    "outro_planilha",
  ]),
  q3_client_profile: z.enum([
    "mei",
    "simples",
    "presumido",
    "real",
    "misto",
  ]),
  q4_pain_areas: z
    .array(
      z.enum([
        "triagem",
        "cobranca",
        "nf",
        "lancamentos",
        "conciliacao",
        "atendimento",
        "relatorios",
        "onboarding",
      ]),
    )
    .min(1, "Escolha ao menos 1.")
    .max(3, "Máximo 3."),
  q5_hours_weekly: z.enum([
    "menos_10",
    "10_a_25",
    "25_a_50",
    "50_a_100",
    "mais_100",
  ]),
  q6_automation_history: z.enum([
    "nunca",
    "saas_falhou",
    "freelancer_fragil",
    "automacoes_pontuais",
    "outro_quer_conversar",
  ]),
  q7_timeline: z.enum([
    "para_ontem",
    "proximo_mes",
    "tres_meses",
    "sem_urgencia",
  ]),
});
export type DiagnosisAnswersInput = z.infer<typeof diagnosisAnswersSchema>;

// Aceita formatos comuns brasileiros: "(17) 99999-9999", "17999999999", "+5517999999999".
// Validamos só a contagem de dígitos pra não brigar com máscara/colagem do usuário.
const brWhatsapp = z
  .string()
  .max(40, "Telefone muito longo.")
  .refine((v) => {
    const digits = v.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 13;
  }, "WhatsApp inválido. Use DDD + número.");

// Atribuição: todos opcionais — fluxo continua funcionando se localStorage
// estiver bloqueado ou se o lead chegou organicamente. Strings cortadas em
// 255 pra evitar payloads abusivos (UTMs reais são curtos).
const attributionField = z
  .union([z.string().max(255), z.null()])
  .optional()
  .transform((v) => (v ? v : null));

// ---------------------------------------------------------------------------
// Scheduling request (form que substituiu o link direto pro Cal.com)
// ---------------------------------------------------------------------------
// 5 campos: nome, whatsapp, email, site (opcional), urgência.
// Submit dispara notificação Telegram pro Levi + comercial; eles chamam no
// WhatsApp pra combinar. site_url ajuda a rodar preview ANTES da call.
export const schedulingUrgencyEnum = z.enum([
  "this_week",
  "next_month",
  "researching",
]);
export type SchedulingUrgency = z.infer<typeof schedulingUrgencyEnum>;

export const SCHEDULING_URGENCY_LABEL: Record<SchedulingUrgency, string> = {
  this_week: "Essa semana",
  next_month: "Próximo mês",
  researching: "Só pesquisando",
};

const optionalUrl = z
  .string()
  .max(200, "URL muito longa.")
  .optional()
  .or(z.literal(""));

export const schedulingRequestSchema = z.object({
  name: z.string().min(2, "Nome muito curto.").max(80),
  email: z.email("E-mail inválido."),
  whatsapp: brWhatsapp,
  site_url: optionalUrl,
  urgency: schedulingUrgencyEnum,
  source: z.string().max(40).optional().or(z.literal("")),
  diagnosis_id: z.string().uuid().optional().or(z.literal("")),
  utm_source: attributionField,
  utm_medium: attributionField,
  utm_campaign: attributionField,
  utm_content: attributionField,
  utm_term: attributionField,
  landing_page: attributionField,
  referrer: attributionField,
});
export type SchedulingRequestInput = z.infer<typeof schedulingRequestSchema>;

export const diagnosisLeadSchema = z.object({
  name: z.string().min(2, "Nome muito curto.").max(80),
  email: z.email("E-mail inválido."),
  whatsapp: brWhatsapp,
  company: z.string().max(120).optional().or(z.literal("")),
  consent: consentRequired,
});
export type DiagnosisLeadInput = z.infer<typeof diagnosisLeadSchema>;

export const diagnosisSubmissionSchema = diagnosisAnswersSchema.extend({
  name: z.string().min(2).max(80),
  email: z.email(),
  whatsapp: brWhatsapp,
  company: z.string().max(120).optional().or(z.literal("")),
  utm_source: attributionField,
  utm_medium: attributionField,
  utm_campaign: attributionField,
  utm_content: attributionField,
  utm_term: attributionField,
  landing_page: attributionField,
  referrer: attributionField,
  consent: consentRequired,
});
export type DiagnosisSubmissionInput = z.infer<typeof diagnosisSubmissionSchema>;

// ---------------------------------------------------------------------------
// Schema do output do Claude V2 — usado pra validar a resposta da IA
// Diferenças vs v1:
//   - Sem quick_win / estimativa_roi / ferramentas_sugeridas
//   - + gargalo_principal, plano_30_60_90
//   - abordagem: diy | conversa | proposta_formal
// ---------------------------------------------------------------------------
export const opportunitySchemaV2 = z.object({
  titulo: z.string().min(1),
  descricao: z.string().min(1),
  impacto_estimado: z.string().min(1),
  complexidade: z.enum(["baixa", "media", "alta"]),
  prazo_implementacao: z.string().min(1),
});

export const diagnosisAnalysisSchema = z.object({
  diagnostico_resumido: z.string().min(1),
  gargalo_principal: z.object({
    area: z.string().min(1),
    descricao: z.string().min(1),
    impacto_estimado: z.string().min(1),
  }),
  tres_oportunidades: z
    .array(opportunitySchemaV2)
    .length(3, "Exatamente 3 oportunidades."),
  plano_30_60_90: z.object({
    "30_dias": z.string().min(1),
    "60_dias": z.string().min(1),
    "90_dias": z.string().min(1),
  }),
  alerta_estrategico: z.string().min(1),
  proximo_passo_recomendado: z.object({
    abordagem: z.enum(["diy", "conversa", "proposta_formal"]),
    justificativa: z.string().min(1),
  }),
});

export type DiagnosisAnalysisOutput = z.infer<typeof diagnosisAnalysisSchema>;
