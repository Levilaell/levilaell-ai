// =============================================================================
// Diagnóstico V2 contábil — 7 perguntas (>=2026-05-18)
// =============================================================================
// O array DIAGNOSIS_QUESTIONS dirige a UI, a validação Zod e o prompt da IA.
// Mantemos opções "as const satisfies" pra garantir type-safety nos value's.
// =============================================================================
export type Option<T extends string = string> = {
  value: T;
  label: string;
  emoji?: string;
};

export const CARTEIRA_SIZES = [
  { value: "ate_30", label: "Até 30 clientes" },
  { value: "30_a_100", label: "30 a 100 clientes" },
  { value: "100_a_250", label: "100 a 250 clientes" },
  { value: "250_a_500", label: "250 a 500 clientes" },
  { value: "500_mais", label: "Mais de 500 clientes" },
] as const satisfies readonly Option[];

export const ERPS = [
  { value: "dominio", label: "Domínio" },
  { value: "onvio", label: "Onvio (Thomson Reuters)" },
  { value: "alterdata", label: "Alterdata" },
  { value: "sage", label: "Sage" },
  { value: "contmatic", label: "Contmatic" },
  { value: "mastermaq", label: "MasterMaq" },
  { value: "outro_planilha", label: "Outro / Planilha / Sistema próprio" },
] as const satisfies readonly Option[];

export const CLIENT_PROFILES = [
  { value: "mei", label: "MEI" },
  { value: "simples", label: "Simples Nacional" },
  { value: "presumido", label: "Lucro Presumido" },
  { value: "real", label: "Lucro Real" },
  { value: "misto", label: "Misto / Não tem um predominante" },
] as const satisfies readonly Option[];

export const PAIN_AREAS_V2 = [
  { value: "triagem", label: "Triagem de documentos recebidos (e-mail/WhatsApp)" },
  { value: "cobranca", label: "Cobrança de documentos com clientes" },
  { value: "nf", label: "Processamento/digitação de notas fiscais" },
  { value: "lancamentos", label: "Lançamentos fiscais e contábeis" },
  { value: "conciliacao", label: "Conciliação bancária" },
  { value: "atendimento", label: "Atendimento (dúvidas dos clientes)" },
  { value: "relatorios", label: "Geração e envio de relatórios mensais" },
  { value: "onboarding", label: "Onboarding de clientes novos" },
] as const satisfies readonly Option[];

export const HOURS_WEEKLY_V2 = [
  { value: "menos_10", label: "Menos de 10 horas" },
  { value: "10_a_25", label: "10 a 25 horas" },
  { value: "25_a_50", label: "25 a 50 horas" },
  { value: "50_a_100", label: "50 a 100 horas" },
  { value: "mais_100", label: "Mais de 100 horas" },
] as const satisfies readonly Option[];

export const AUTOMATION_HISTORY_V2 = [
  { value: "nunca", label: "Nunca tentamos" },
  { value: "saas_falhou", label: "Tentamos com SaaS pronto, não funcionou" },
  { value: "freelancer_fragil", label: "Contratamos freelancer, ficou frágil" },
  { value: "automacoes_pontuais", label: "Temos automações pontuais (RPA, planilhas)" },
  { value: "outro_quer_conversar", label: "Outro / Quero conversar sobre isso" },
] as const satisfies readonly Option[];

export const TIMELINES_V2 = [
  { value: "para_ontem", label: "Pra ontem (urgência alta)", emoji: "🔥" },
  { value: "proximo_mes", label: "Próximo mês", emoji: "⚡" },
  { value: "tres_meses", label: "Próximos 3 meses", emoji: "📅" },
  { value: "sem_urgencia", label: "Sem urgência, explorando", emoji: "🌱" },
] as const satisfies readonly Option[];

// =============================================================================
// Questões na ordem em que aparecem no form
// =============================================================================
export const DIAGNOSIS_QUESTIONS = [
  {
    id: "q1",
    field: "q1_size" as const,
    type: "single" as const,
    title: "Quantos clientes ativos seu escritório atende hoje?",
    subtitle: "Considere apenas clientes com fatura recorrente.",
    options: CARTEIRA_SIZES,
  },
  {
    id: "q2",
    field: "q2_erp" as const,
    type: "single" as const,
    title: "Qual sistema/ERP principal vocês usam?",
    subtitle: "Sistema onde a equipe faz lançamentos e gera obrigações.",
    options: ERPS,
  },
  {
    id: "q3",
    field: "q3_client_profile" as const,
    type: "single" as const,
    title: "Qual o perfil de cliente predominante na carteira?",
    subtitle: "O regime tributário que aparece mais nos clientes ativos.",
    options: CLIENT_PROFILES,
  },
  {
    id: "q4",
    field: "q4_pain_areas" as const,
    type: "multi" as const,
    max: 3,
    title: "Onde a equipe perde mais tempo hoje?",
    subtitle: "Selecione até 3 áreas.",
    options: PAIN_AREAS_V2,
  },
  {
    id: "q5",
    field: "q5_hours_weekly" as const,
    type: "single" as const,
    title: "Quantas horas/semana a equipe gasta nessas tarefas manuais?",
    subtitle: "Some o tempo da equipe inteira, não só de uma pessoa.",
    options: HOURS_WEEKLY_V2,
  },
  {
    id: "q6",
    field: "q6_automation_history" as const,
    type: "single" as const,
    title: "Vocês já tentaram automatizar antes?",
    subtitle: "Independente de ter dado certo ou não.",
    options: AUTOMATION_HISTORY_V2,
  },
  {
    id: "q7",
    field: "q7_timeline" as const,
    type: "single_with_emoji" as const,
    title: "Em que prazo vocês precisam ter algo rodando?",
    subtitle: "Importante pra entender urgência real.",
    options: TIMELINES_V2,
  },
] as const;

export const TOTAL_STEPS = DIAGNOSIS_QUESTIONS.length + 1; // +1 lead capture
