import type { DiagnosisAnswers } from "@/types/diagnosis";

/**
 * Score V2 contábil (0-100). Mesmas faixas: hot >=80, alto 60-79, morno 40-59,
 * frio <40. Pondera carteira, ERP, perfil de cliente, dores, horas, histórico
 * e urgência.
 */
export function calculateLeadScore(answers: DiagnosisAnswers): number {
  let score = 0;

  // Q1 — Carteira (max 15) — escritórios maiores convertem melhor
  const carteira: Record<string, number> = {
    ate_30: 4,
    "30_a_100": 8,
    "100_a_250": 12,
    "250_a_500": 14,
    "500_mais": 15,
  };
  score += carteira[answers.q1_size] ?? 0;

  // Q2 — ERP (max 15) — ERPs sérios indicam operação consolidada
  const erp: Record<string, number> = {
    dominio: 15,
    onvio: 15,
    alterdata: 12,
    sage: 12,
    contmatic: 10,
    mastermaq: 8,
    outro_planilha: 5,
  };
  score += erp[answers.q2_erp] ?? 0;

  // Q3 — Perfil de cliente (max 15) — Real/Presumido têm mais complexidade
  const perfil: Record<string, number> = {
    real: 15,
    presumido: 13,
    misto: 11,
    simples: 8,
    mei: 4,
  };
  score += perfil[answers.q3_client_profile] ?? 0;

  // Q4 — Dores (max 20) — multi-select; mais dores = mais oportunidade
  const numDores = answers.q4_pain_areas?.length ?? 0;
  if (numDores >= 3) score += 20;
  else if (numDores === 2) score += 15;
  else if (numDores === 1) score += 10;

  // Q5 — Horas semanais (max 15) — proxy de dor real
  const horas: Record<string, number> = {
    mais_100: 15,
    "50_a_100": 13,
    "25_a_50": 10,
    "10_a_25": 6,
    menos_10: 3,
  };
  score += horas[answers.q5_hours_weekly] ?? 0;

  // Q6 — Histórico de automação (max 10) — "tentou e falhou" é melhor sinal
  // que "nunca tentou" (intenção declarada)
  const historico: Record<string, number> = {
    saas_falhou: 10,
    automacoes_pontuais: 8,
    freelancer_fragil: 7,
    outro_quer_conversar: 6,
    nunca: 4,
  };
  score += historico[answers.q6_automation_history] ?? 0;

  // Q7 — Urgência (max 10)
  const urgencia: Record<string, number> = {
    para_ontem: 10,
    proximo_mes: 8,
    tres_meses: 5,
    sem_urgencia: 2,
  };
  score += urgencia[answers.q7_timeline] ?? 0;

  return Math.min(100, Math.max(0, score));
}

export function leadScoreCategory(
  score: number,
): "hot" | "high" | "warm" | "cold" {
  if (score >= 80) return "hot";
  if (score >= 60) return "high";
  if (score >= 40) return "warm";
  return "cold";
}
