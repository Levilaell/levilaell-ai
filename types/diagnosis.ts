export type CompanySize =
  | "solo"
  | "small_2_10"
  | "medium_11_50"
  | "large_51_200"
  | "enterprise_200_plus";

export type BusinessModel =
  | "b2b_services"
  | "ecommerce"
  | "infoproduct"
  | "saas"
  | "b2c_services"
  | "industry"
  | "other";

export type PainArea =
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

export type TechMaturity =
  | "manual"
  | "isolated_tools"
  | "stack_with_gaps"
  | "mature";

export type HoursWeekly =
  | "less_than_5"
  | "5_to_10"
  | "10_to_20"
  | "20_to_40"
  | "more_than_40"
  | "unknown";

export type AutomationHistory =
  | "never"
  | "no_code_failed"
  | "hire_failed"
  | "in_progress"
  | "self_built";

export type MainGoal =
  | "save_team_time"
  | "reduce_costs"
  | "scale_without_hiring"
  | "professionalize"
  | "improve_cx"
  | "exploring";

export type Timeline =
  | "this_week"
  | "next_month"
  | "3_to_6_months"
  | "no_urgency";

export type Budget =
  | "under_1k"
  | "1k_to_5k"
  | "5k_to_15k"
  | "over_15k"
  | "case_by_case";

export type Revenue =
  | "under_50k"
  | "50k_to_200k"
  | "200k_to_500k"
  | "500k_to_1m"
  | "over_1m"
  | "no_disclose";

export type DiagnosisAnswers = {
  q1_size: CompanySize;
  q2_business_model: BusinessModel;
  q2_business_model_other?: string;
  q3_pain_areas: PainArea[];
  q4_tech_maturity: TechMaturity;
  q5_hours_weekly: HoursWeekly;
  q6_automation_history: AutomationHistory;
  q7_main_goal: MainGoal;
  q8_timeline: Timeline;
  q9_budget: Budget;
  q10_revenue?: Revenue;
  q10_employees?: number;
};

export type DiagnosisLead = {
  name: string;
  email: string;
  whatsapp?: string;
  company?: string;
  consent: boolean;
};

export type DiagnosisSubmission = DiagnosisAnswers & DiagnosisLead;

export type Opportunity = {
  titulo: string;
  descricao: string;
  impacto_estimado: string;
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

export type RecommendedApproach =
  | "diy"
  | "consultoria_pontual"
  | "parceria_continua"
  | "ainda_nao_e_hora";

export type NextStepRecommendation = {
  abordagem: RecommendedApproach;
  justificativa: string;
};

export type DiagnosisAnalysis = {
  diagnostico_resumido: string;
  tres_oportunidades: [Opportunity, Opportunity, Opportunity];
  quick_win: QuickWin;
  estimativa_roi: ROIEstimate;
  proximo_passo_recomendado: NextStepRecommendation;
  alerta_estrategico: string;
};

export type DiagnosisStatus = "processing" | "completed" | "failed";

export type DiagnosisRecord = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  whatsapp: string | null;
  company: string | null;
  q1_size: string;
  q2_business_model: string;
  q2_business_model_other: string | null;
  q3_pain_areas: PainArea[];
  q4_tech_maturity: string;
  q5_hours_weekly: string;
  q6_automation_history: string;
  q7_main_goal: string;
  q8_timeline: string;
  q9_budget: string;
  q10_revenue: string | null;
  q10_employees: number | null;
  ai_analysis: DiagnosisAnalysis | null;
  status: DiagnosisStatus;
  error_message: string | null;
  lead_score: number | null;
};
