export type CompanyType =
  | "freelancer"
  | "small"
  | "growing"
  | "established"
  | "agency"
  | "ecommerce"
  | "infoproducer";

export type Industry =
  | "health"
  | "education"
  | "ecommerce"
  | "b2b_services"
  | "marketing"
  | "tech"
  | "real_estate"
  | "legal_accounting"
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
  | "5_to_15"
  | "15_to_40"
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

export type DiagnosisAnswers = {
  q1_company_type: CompanyType;
  q2_industry: Industry;
  q2_industry_other?: string;
  q3_pain_areas: PainArea[];
  q4_tech_maturity: TechMaturity;
  q5_hours_weekly: HoursWeekly;
  q6_automation_history: AutomationHistory;
  q7_main_goal: MainGoal;
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
};

export type QuickWin = {
  titulo: string;
  passo_a_passo: string[];
};

export type ROIEstimate = {
  horas_recuperaveis_mes: string | number;
  valor_estimado_mensal: string;
  tempo_payback: string;
};

export type NextStepRecommendation = {
  abordagem: "diy" | "consultoria_pontual" | "parceria_continua";
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
  q1_company_type: string;
  q2_industry: string;
  q3_pain_areas: PainArea[];
  q4_tech_maturity: string;
  q5_hours_weekly: string;
  q6_automation_history: string;
  q7_main_goal: string;
  ai_analysis: DiagnosisAnalysis | null;
  status: DiagnosisStatus;
  lead_score: number | null;
};
