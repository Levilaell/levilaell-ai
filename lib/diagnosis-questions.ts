export type Option<T extends string = string> = {
  value: T;
  label: string;
  emoji?: string;
};

export const COMPANY_SIZES = [
  { value: "solo", label: "Eu sozinho (autônomo / freelancer)", emoji: "🧍" },
  { value: "small_2_10", label: "2 a 10 pessoas", emoji: "👥" },
  { value: "medium_11_50", label: "11 a 50 pessoas", emoji: "🏢" },
  { value: "large_51_200", label: "51 a 200 pessoas", emoji: "🏬" },
  { value: "enterprise_200_plus", label: "Mais de 200 pessoas", emoji: "🏭" },
] as const satisfies readonly Option[];

export const BUSINESS_MODELS = [
  { value: "b2b_services", label: "Serviços B2B (agência, consultoria, software house)" },
  { value: "ecommerce", label: "E-commerce / varejo online" },
  { value: "infoproduct", label: "Infoproduto / educação online" },
  { value: "saas", label: "SaaS / produto de tecnologia" },
  { value: "b2c_services", label: "Serviços B2C (clínica, salão, escola, academia, etc.)" },
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
  { value: "5_to_10", label: "5 a 10h/semana" },
  { value: "10_to_20", label: "10 a 20h/semana" },
  { value: "20_to_40", label: "20 a 40h/semana" },
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

export const TIMELINES = [
  { value: "this_week", label: "Esta semana ou nas próximas 2 semanas (urgente)", emoji: "🔥" },
  { value: "next_month", label: "No próximo mês", emoji: "⚡" },
  { value: "3_to_6_months", label: "Nos próximos 3 a 6 meses", emoji: "📅" },
  { value: "no_urgency", label: "Sem urgência — estou explorando", emoji: "🌱" },
] as const satisfies readonly Option[];

export const BUDGETS = [
  { value: "under_1k", label: "Até R$ 1.000/mês — quero soluções DIY ou de baixo custo" },
  { value: "1k_to_5k", label: "R$ 1.000 a R$ 5.000/mês — projetos pontuais" },
  { value: "5k_to_15k", label: "R$ 5.000 a R$ 15.000/mês — operação automatizada" },
  { value: "over_15k", label: "Mais de R$ 15.000/mês — transformação completa" },
  { value: "case_by_case", label: "Prefiro avaliar caso a caso" },
] as const satisfies readonly Option[];

export const REVENUE_OPTIONS = [
  { value: "under_50k", label: "Até R$ 50k/mês" },
  { value: "50k_to_200k", label: "R$ 50k a R$ 200k/mês" },
  { value: "200k_to_500k", label: "R$ 200k a R$ 500k/mês" },
  { value: "500k_to_1m", label: "R$ 500k a R$ 1M/mês" },
  { value: "over_1m", label: "Mais de R$ 1M/mês" },
  { value: "no_disclose", label: "Prefiro não dizer" },
] as const satisfies readonly Option[];

export const DIAGNOSIS_QUESTIONS = [
  {
    id: "q1",
    field: "q1_size" as const,
    type: "single_with_emoji" as const,
    title: "Qual o tamanho da sua operação hoje?",
    options: COMPANY_SIZES,
  },
  {
    id: "q2",
    field: "q2_business_model" as const,
    type: "single_with_other" as const,
    title: "Qual modelo de negócio melhor descreve sua empresa?",
    options: BUSINESS_MODELS,
    otherField: "q2_business_model_other" as const,
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
      "Quantas horas por semana sua equipe gasta com tarefas repetitivas ou automatizáveis?",
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
  {
    id: "q8",
    field: "q8_timeline" as const,
    type: "single_with_emoji" as const,
    title: "Quando você gostaria de ver os primeiros resultados?",
    options: TIMELINES,
  },
  {
    id: "q9",
    field: "q9_budget" as const,
    type: "single" as const,
    title:
      "Qual investimento você considera razoável para resolver essa dor?",
    subtitle:
      "Sem compromisso — essa info ajuda a IA a sugerir o caminho certo (DIY, projeto pontual ou parceria contínua).",
    options: BUDGETS,
  },
] as const;

export const TOTAL_STEPS = DIAGNOSIS_QUESTIONS.length + 1; // +1 for lead capture
