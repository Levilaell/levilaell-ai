// =============================================================================
// Diagnóstico contábil — V2 (>=2026-05-18)
// =============================================================================
// O formulário foi de 9 → 7 perguntas com foco em escritório contábil.
// Mantemos os tipos Legacy convivendo porque (a) 4 diagnósticos antigos seguem
// renderizando via fallback, (b) content/examples.ts é hardcoded na forma v1.
// =============================================================================

// ----- v2: respostas do form -------------------------------------------------
export type CarteiraSize =
  | "ate_30"
  | "30_a_100"
  | "100_a_250"
  | "250_a_500"
  | "500_mais";

export type Erp =
  | "dominio"
  | "onvio"
  | "alterdata"
  | "sage"
  | "contmatic"
  | "mastermaq"
  | "outro_planilha";

export type ClientProfile =
  | "mei"
  | "simples"
  | "presumido"
  | "real"
  | "misto";

export type PainAreaV2 =
  | "triagem"
  | "cobranca"
  | "nf"
  | "lancamentos"
  | "conciliacao"
  | "atendimento"
  | "relatorios"
  | "onboarding";

export type HoursWeeklyV2 =
  | "menos_10"
  | "10_a_25"
  | "25_a_50"
  | "50_a_100"
  | "mais_100";

export type AutomationHistoryV2 =
  | "nunca"
  | "saas_falhou"
  | "freelancer_fragil"
  | "automacoes_pontuais"
  | "outro_quer_conversar";

export type TimelineV2 =
  | "para_ontem"
  | "proximo_mes"
  | "tres_meses"
  | "sem_urgencia";

export type DiagnosisAnswers = {
  q1_size: CarteiraSize;
  q2_erp: Erp;
  q3_client_profile: ClientProfile;
  q4_pain_areas: PainAreaV2[];
  q5_hours_weekly: HoursWeeklyV2;
  q6_automation_history: AutomationHistoryV2;
  q7_timeline: TimelineV2;
};

export type DiagnosisLead = {
  name: string;
  email: string;
  whatsapp?: string;
  company?: string;
  consent: boolean;
};

export type DiagnosisSubmission = DiagnosisAnswers & DiagnosisLead;

// ----- v2: ai_analysis -------------------------------------------------------
export type OpportunityV2 = {
  titulo: string;
  descricao: string;
  // Brief usa "media" (sem acento). Legacy hardcoded usa "média" (ver Opportunity).
  complexidade: "baixa" | "media" | "alta";
  prazo_implementacao: string;
  impacto_estimado: string;
};

export type GargaloPrincipal = {
  area: string;
  descricao: string;
  impacto_estimado: string;
};

export type Plano306090 = {
  "30_dias": string;
  "60_dias": string;
  "90_dias": string;
};

export type RecommendedApproachV2 = "diy" | "conversa" | "proposta_formal";

export type NextStepRecommendationV2 = {
  abordagem: RecommendedApproachV2;
  justificativa: string;
};

export type DiagnosisAnalysisV2 = {
  diagnostico_resumido: string;
  gargalo_principal: GargaloPrincipal;
  tres_oportunidades: [OpportunityV2, OpportunityV2, OpportunityV2];
  plano_30_60_90: Plano306090;
  alerta_estrategico: string;
  proximo_passo_recomendado: NextStepRecommendationV2;
};

// =============================================================================
// Legacy — congelado, usado por: 4 diagnósticos v1 no banco e content/examples.ts
// =============================================================================
export type LegacyCompanySize =
  | "solo"
  | "small_2_10"
  | "medium_11_50"
  | "large_51_200"
  | "enterprise_200_plus";

export type LegacyBusinessModel =
  | "b2b_services"
  | "ecommerce"
  | "infoproduct"
  | "saas"
  | "b2c_services"
  | "industry"
  | "other";

export type LegacyPainArea =
  | "lead_attendance"
  | "onboarding"
  | "reports_dashboards"
  | "billing"
  | "client_communication"
  | "internal_approvals"
  | "document_analysis"
  | "system_integration"
  | "marketing_nurturing"
  | "sales_followup";

export type LegacyTechMaturity =
  | "manual"
  | "isolated_tools"
  | "stack_with_gaps"
  | "mature";

export type LegacyHoursWeekly =
  | "less_than_5"
  | "5_to_10"
  | "10_to_20"
  | "20_to_40"
  | "more_than_40"
  | "unknown";

export type LegacyAutomationHistory =
  | "never"
  | "no_code_failed"
  | "hire_failed"
  | "in_progress"
  | "self_built";

export type LegacyMainGoal =
  | "save_team_time"
  | "reduce_costs"
  | "scale_without_hiring"
  | "professionalize"
  | "improve_cx"
  | "exploring";

export type LegacyTimeline =
  | "this_week"
  | "next_month"
  | "3_to_6_months"
  | "no_urgency";

export type LegacyBudget =
  | "under_1k"
  | "1k_to_5k"
  | "5k_to_15k"
  | "over_15k"
  | "case_by_case";

export type LegacyRevenue =
  | "under_50k"
  | "50k_to_200k"
  | "200k_to_500k"
  | "500k_to_1m"
  | "over_1m"
  | "no_disclose";

export type Opportunity = {
  titulo: string;
  descricao: string;
  impacto_estimado: string;
  // Legacy aceita acento; V2 não. Examples.ts é a fonte hardcoded com "média".
  complexidade: "baixa" | "média" | "alta";
  ferramentas_sugeridas: string[];
  prazo_implementacao: string;
};

export type QuickWin = {
  titulo: string;
  passo_a_passo: string[];
  ferramentas_necessarias: string[];
};

export type ROIEstimate = {
  horas_recuperaveis_mes: string | number;
  valor_estimado_mensal: string;
  tempo_payback: string;
  disclaimer: string | null;
  metodologia: string;
};

export type LegacyRecommendedApproach =
  | "diy"
  | "consultoria_pontual"
  | "parceria_continua"
  | "ainda_nao_e_hora";

export type NextStepRecommendation = {
  abordagem: LegacyRecommendedApproach;
  justificativa: string;
};

export type DiagnosisAnalysisLegacy = {
  diagnostico_resumido: string;
  tres_oportunidades: [Opportunity, Opportunity, Opportunity];
  quick_win: QuickWin;
  estimativa_roi: ROIEstimate;
  proximo_passo_recomendado: NextStepRecommendation;
  alerta_estrategico: string;
};

// =============================================================================
// Union + type guards
// =============================================================================
export type DiagnosisAnalysis = DiagnosisAnalysisV2 | DiagnosisAnalysisLegacy;

export function isLegacyAnalysis(
  a: DiagnosisAnalysis,
): a is DiagnosisAnalysisLegacy {
  return "quick_win" in a && "estimativa_roi" in a;
}

export function isV2Analysis(
  a: DiagnosisAnalysis,
): a is DiagnosisAnalysisV2 {
  return "gargalo_principal" in a && "plano_30_60_90" in a;
}

// =============================================================================
// DB row
// =============================================================================
export type DiagnosisStatus = "processing" | "completed" | "failed";

export type DiagnosisRecord = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  whatsapp: string | null;
  company: string | null;

  // v1 (todos legacy nullable após 0007)
  q1_size: string;
  q2_business_model: string | null;
  q2_business_model_other: string | null;
  q3_pain_areas: string[];
  q4_tech_maturity: string | null;
  q5_hours_weekly: string;
  q6_automation_history: string;
  q7_main_goal: string | null;
  q8_timeline: string;
  q9_budget: string | null;
  q10_revenue: string | null;
  q10_employees: number | null;

  // v2 (após 0007)
  q2_erp: string | null;
  q3_client_profile: string | null;

  ai_analysis: DiagnosisAnalysis | null;
  status: DiagnosisStatus;
  error_message: string | null;
  lead_score: number | null;
};
