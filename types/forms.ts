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

export const diagnosisLeadSchema = z.object({
  name: z.string().min(2, "Nome muito curto.").max(80),
  email: z.email("E-mail inválido."),
  whatsapp: z.string().max(40).optional().or(z.literal("")),
  company: z.string().max(120).optional().or(z.literal("")),
  q10_revenue: z.string().max(40).optional().or(z.literal("")),
  q10_employees: z
    .number()
    .int()
    .min(0)
    .max(1_000_000)
    .optional()
    .or(z.literal("").transform(() => undefined))
    .or(z.nan().transform(() => undefined)),
  consent: consentRequired,
});
export type DiagnosisLeadInput = z.infer<typeof diagnosisLeadSchema>;

export const diagnosisAnswersSchema = z.object({
  q1_size: z.string().min(1),
  q2_business_model: z.string().min(1),
  q2_business_model_other: z.string().max(120).optional(),
  q3_pain_areas: z
    .array(z.string())
    .min(1, "Escolha ao menos 1.")
    .max(3, "Máximo 3."),
  q4_tech_maturity: z.string().min(1),
  q5_hours_weekly: z.string().min(1),
  q6_automation_history: z.string().min(1),
  q7_main_goal: z.string().min(1),
  q8_timeline: z.string().min(1),
  q9_budget: z.string().min(1),
});
export type DiagnosisAnswersInput = z.infer<typeof diagnosisAnswersSchema>;

// Atribuição: todos opcionais — fluxo continua funcionando se localStorage
// estiver bloqueado ou se o lead chegou organicamente. Strings cortadas em
// 255 pra evitar payloads abusivos (UTMs reais são curtos).
const attributionField = z
  .union([z.string().max(255), z.null()])
  .optional()
  .transform((v) => (v ? v : null));

export const diagnosisSubmissionSchema = diagnosisAnswersSchema.extend({
  name: z.string().min(2).max(80),
  email: z.email(),
  whatsapp: z.string().max(40).optional().or(z.literal("")),
  company: z.string().max(120).optional().or(z.literal("")),
  q10_revenue: z.string().max(40).optional().or(z.literal("")),
  q10_employees: z
    .union([z.number().int().min(0).max(1_000_000), z.literal("")])
    .optional(),
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
// Schema do output do Claude — usado pra validar a resposta da IA
// ---------------------------------------------------------------------------
export const opportunitySchema = z.object({
  titulo: z.string().min(1),
  descricao: z.string().min(1),
  impacto_estimado: z.string().min(1),
  complexidade: z.enum(["baixa", "média", "alta"]),
  ferramentas_sugeridas: z.array(z.string()).min(1).max(8),
  prazo_implementacao: z.string().min(1),
});

export const diagnosisAnalysisSchema = z.object({
  diagnostico_resumido: z.string().min(1),
  tres_oportunidades: z
    .array(opportunitySchema)
    .length(3, "Exatamente 3 oportunidades."),
  quick_win: z.object({
    titulo: z.string().min(1),
    passo_a_passo: z.array(z.string()).min(3).max(8),
    ferramentas_necessarias: z.array(z.string()).max(8),
  }),
  estimativa_roi: z.object({
    horas_recuperaveis_mes: z.union([z.number(), z.string()]),
    valor_estimado_mensal: z.string().min(1),
    tempo_payback: z.string().min(1),
    disclaimer: z.string().nullable(),
    metodologia: z.string().min(1),
  }),
  proximo_passo_recomendado: z.object({
    abordagem: z.enum([
      "diy",
      "consultoria_pontual",
      "parceria_continua",
      "ainda_nao_e_hora",
    ]),
    justificativa: z.string().min(1),
  }),
  alerta_estrategico: z.string().min(1),
});

export type DiagnosisAnalysisOutput = z.infer<typeof diagnosisAnalysisSchema>;
