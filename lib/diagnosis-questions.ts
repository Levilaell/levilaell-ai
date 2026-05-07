export type Option<T extends string = string> = {
  value: T;
  label: string;
};

export const COMPANY_TYPES = [
  { value: "freelancer", label: "Profissional autônomo / freelancer" },
  { value: "small", label: "Empresa pequena (até 10 pessoas)" },
  { value: "growing", label: "Empresa em crescimento (11-50 pessoas)" },
  { value: "established", label: "Empresa estabelecida (50+ pessoas)" },
  { value: "agency", label: "Agência ou consultoria" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "infoproducer", label: "Infoprodutor / educador" },
] as const satisfies readonly Option[];

export const INDUSTRIES = [
  { value: "health", label: "Saúde / clínicas" },
  { value: "education", label: "Educação / cursos" },
  { value: "ecommerce", label: "E-commerce / varejo online" },
  { value: "b2b_services", label: "Serviços B2B" },
  { value: "marketing", label: "Marketing / publicidade" },
  { value: "tech", label: "Tecnologia / SaaS" },
  { value: "real_estate", label: "Imobiliário" },
  { value: "legal_accounting", label: "Jurídico / contábil" },
  { value: "industry", label: "Indústria / manufatura" },
  { value: "other", label: "Outro" },
] as const satisfies readonly Option[];

export const PAIN_AREAS = [
  { value: "lead_attendance", label: "Atendimento e qualificação de leads" },
  { value: "onboarding", label: "Onboarding de clientes ou funcionários" },
  { value: "reports_dashboards", label: "Geração de relatórios e dashboards" },
  { value: "billing", label: "Cobrança e gestão financeira" },
  { value: "client_communication", label: "Comunicação com clientes (e-mail, WhatsApp)" },
  { value: "internal_approvals", label: "Gestão de tarefas e aprovações internas" },
  { value: "document_analysis", label: "Análise de documentos ou contratos" },
  { value: "system_integration", label: "Integração entre sistemas (planilhas, CRM, etc.)" },
  { value: "marketing_nurturing", label: "Marketing e nutrição de leads" },
  { value: "sales_followup", label: "Vendas e follow-up" },
] as const satisfies readonly Option[];

export const TECH_MATURITY = [
  { value: "manual", label: "Tudo no manual / planilhas (sem ferramentas)" },
  { value: "isolated_tools", label: "Algumas ferramentas isoladas, sem integração" },
  { value: "stack_with_gaps", label: "Stack montado, mas com gaps grandes" },
  { value: "mature", label: "Operação digital madura, buscando otimização" },
] as const satisfies readonly Option[];

export const HOURS_WEEKLY = [
  { value: "less_than_5", label: "Menos de 5h/semana" },
  { value: "5_to_15", label: "5 a 15h/semana" },
  { value: "15_to_40", label: "15 a 40h/semana" },
  { value: "more_than_40", label: "Mais de 40h/semana" },
  { value: "unknown", label: "Não sei estimar" },
] as const satisfies readonly Option[];

export const AUTOMATION_HISTORY = [
  { value: "never", label: "Nunca tentamos" },
  { value: "no_code_failed", label: "Tentamos com no-code (Zapier, Make), mas não escalou" },
  { value: "hire_failed", label: "Contratamos alguém antes, mas não deu certo" },
  { value: "in_progress", label: "Temos automações funcionando, queremos avançar" },
  { value: "self_built", label: "Eu mesmo construí, mas preciso de ajuda" },
] as const satisfies readonly Option[];

export const MAIN_GOALS = [
  { value: "save_team_time", label: "Recuperar tempo da minha equipe" },
  { value: "reduce_costs", label: "Reduzir custos operacionais" },
  { value: "scale_without_hiring", label: "Crescer sem precisar contratar mais" },
  { value: "professionalize", label: "Profissionalizar a operação (sair do amador)" },
  { value: "improve_cx", label: "Melhorar experiência do cliente" },
  { value: "exploring", label: "Estou explorando, ainda não defini" },
] as const satisfies readonly Option[];

export const DIAGNOSIS_QUESTIONS = [
  {
    id: "q1",
    field: "q1_company_type" as const,
    type: "single" as const,
    title: "O que melhor descreve sua empresa hoje?",
    options: COMPANY_TYPES,
  },
  {
    id: "q2",
    field: "q2_industry" as const,
    type: "single_with_other" as const,
    title: "Em que setor sua empresa atua?",
    options: INDUSTRIES,
    otherField: "q2_industry_other" as const,
    otherLabel: "Qual?",
  },
  {
    id: "q3",
    field: "q3_pain_areas" as const,
    type: "multi" as const,
    max: 3,
    title: "Qual dessas situações mais consome tempo da sua equipe hoje?",
    subtitle: "Selecione até 3 opções",
    options: PAIN_AREAS,
  },
  {
    id: "q4",
    field: "q4_tech_maturity" as const,
    type: "single" as const,
    title: "Como sua empresa lida com tecnologia hoje?",
    options: TECH_MATURITY,
  },
  {
    id: "q5",
    field: "q5_hours_weekly" as const,
    type: "single" as const,
    title:
      "Quantas horas por semana sua equipe gasta com tarefas que parecem repetitivas ou automatizáveis?",
    options: HOURS_WEEKLY,
  },
  {
    id: "q6",
    field: "q6_automation_history" as const,
    type: "single" as const,
    title: "Você ou sua empresa já tentou automatizar algo antes?",
    options: AUTOMATION_HISTORY,
  },
  {
    id: "q7",
    field: "q7_main_goal" as const,
    type: "single" as const,
    title: "O que você espera resolver primeiro com automação?",
    options: MAIN_GOALS,
  },
] as const;

export const TOTAL_STEPS = DIAGNOSIS_QUESTIONS.length + 1; // +1 for lead capture
