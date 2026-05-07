import type { DiagnosisAnswers } from "@/types/diagnosis";

/**
 * Score de 0–100 calculado a partir das respostas pra priorizar leads.
 * Heurística simples: pondera urgência, budget, volume de horas, maturidade.
 */
export function calculateLeadScore(answers: DiagnosisAnswers): number {
  let score = 0;

  // Urgência
  switch (answers.q8_timeline) {
    case "this_week":
      score += 30;
      break;
    case "next_month":
      score += 20;
      break;
    case "3_to_6_months":
      score += 10;
      break;
    case "no_urgency":
      score += 0;
      break;
  }

  // Budget
  switch (answers.q9_budget) {
    case "over_15k":
      score += 30;
      break;
    case "5k_to_15k":
      score += 25;
      break;
    case "1k_to_5k":
      score += 15;
      break;
    case "case_by_case":
      score += 12;
      break;
    case "under_1k":
      score += 2;
      break;
  }

  // Volume de horas (mais horas = mais dor = lead melhor)
  switch (answers.q5_hours_weekly) {
    case "more_than_40":
      score += 20;
      break;
    case "20_to_40":
      score += 15;
      break;
    case "10_to_20":
      score += 10;
      break;
    case "5_to_10":
      score += 5;
      break;
    case "less_than_5":
      score += 0;
      break;
    case "unknown":
      score += 3;
      break;
  }

  // Maturidade (prefere stack-with-gaps ou mature — mais fáceis de servir)
  switch (answers.q4_tech_maturity) {
    case "stack_with_gaps":
      score += 12;
      break;
    case "mature":
      score += 10;
      break;
    case "isolated_tools":
      score += 7;
      break;
    case "manual":
      score += 3;
      break;
  }

  // Tamanho — favorece SMB (sweet spot do Levi)
  switch (answers.q1_size) {
    case "small_2_10":
      score += 8;
      break;
    case "medium_11_50":
      score += 8;
      break;
    case "large_51_200":
      score += 5;
      break;
    case "solo":
      score += 4;
      break;
    case "enterprise_200_plus":
      score += 2;
      break;
  }

  return Math.min(100, score);
}
