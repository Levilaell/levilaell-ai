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
  message: z.string().min(10, "Mensagem muito curta.").max(2000),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const diagnosisLeadSchema = z.object({
  name: z.string().min(2, "Nome muito curto.").max(80),
  email: z.email("E-mail inválido."),
  whatsapp: z.string().max(40).optional().or(z.literal("")),
  company: z.string().max(120).optional().or(z.literal("")),
  consent: consentRequired,
});
export type DiagnosisLeadInput = z.infer<typeof diagnosisLeadSchema>;

export const diagnosisAnswersSchema = z.object({
  q1_company_type: z.string().min(1),
  q2_industry: z.string().min(1),
  q2_industry_other: z.string().max(120).optional(),
  q3_pain_areas: z.array(z.string()).min(1, "Escolha ao menos 1.").max(3, "Máximo 3."),
  q4_tech_maturity: z.string().min(1),
  q5_hours_weekly: z.string().min(1),
  q6_automation_history: z.string().min(1),
  q7_main_goal: z.string().min(1),
});
export type DiagnosisAnswersInput = z.infer<typeof diagnosisAnswersSchema>;

export const diagnosisSubmissionSchema = diagnosisAnswersSchema.extend({
  name: z.string().min(2).max(80),
  email: z.email(),
  whatsapp: z.string().max(40).optional().or(z.literal("")),
  company: z.string().max(120).optional().or(z.literal("")),
  consent: consentRequired,
});
export type DiagnosisSubmissionInput = z.infer<typeof diagnosisSubmissionSchema>;
