/**
 * Cost guardrail — bloqueia gerações quando o orçamento de IA é excedido.
 *
 * Roda ANTES de claimForGeneration: se a estimativa + custo acumulado passa
 * do limite, retorna 402 sem mexer no status do item (continua 'queued').
 *
 * Hard limit: bloqueia. Soft warning (80%) é exibido na UI mas não bloqueia.
 */
import {
  getCostMonth,
  getCostToday,
  getDailyLimitBRL,
  getMonthlyLimitBRL,
} from "@/lib/admin-stats";
import type { Channel } from "@/types/admin";

// Estimativa pré-call por canal. Worst case + buffer pra não estourar:
//  - X: ~R$ 0,06 medido (3 posts) → 0,10 com folga.
//  - blog: ~R$ 0,50 medido (2k palavras) → 0,80 worst case.
//  - newsletter: ainda não construído, estima 0,20.
export const ESTIMATED_COST_BY_CHANNEL: Record<Channel, number> = {
  x: 0.1,
  blog: 0.8,
  newsletter: 0.2,
};

export class CostLimitExceededError extends Error {
  scope: "daily" | "monthly";
  used: number;
  limit: number;
  estimate: number;
  constructor(opts: {
    scope: "daily" | "monthly";
    used: number;
    limit: number;
    estimate: number;
    message: string;
  }) {
    super(opts.message);
    this.name = "CostLimitExceededError";
    this.scope = opts.scope;
    this.used = opts.used;
    this.limit = opts.limit;
    this.estimate = opts.estimate;
  }
}

const fmt = (n: number) => n.toFixed(2).replace(".", ",");

export async function checkCostLimit(channel: Channel): Promise<void> {
  const estimate = ESTIMATED_COST_BY_CHANNEL[channel];
  const dailyLimit = getDailyLimitBRL();
  const monthlyLimit = getMonthlyLimitBRL();

  const [dailyUsed, monthlyUsed] = await Promise.all([
    getCostToday(),
    getCostMonth(),
  ]);

  if (dailyLimit > 0 && dailyUsed + estimate > dailyLimit) {
    throw new CostLimitExceededError({
      scope: "daily",
      used: dailyUsed,
      limit: dailyLimit,
      estimate,
      message: `Limite diário de IA seria ultrapassado (R$ ${fmt(dailyUsed)} usado + R$ ${fmt(
        estimate,
      )} estimado vs R$ ${fmt(dailyLimit)}). Tenta amanhã ou aumenta ADMIN_DAILY_COST_LIMIT_BRL.`,
    });
  }

  if (monthlyLimit > 0 && monthlyUsed + estimate > monthlyLimit) {
    throw new CostLimitExceededError({
      scope: "monthly",
      used: monthlyUsed,
      limit: monthlyLimit,
      estimate,
      message: `Limite mensal de IA seria ultrapassado (R$ ${fmt(monthlyUsed)} usado + R$ ${fmt(
        estimate,
      )} estimado vs R$ ${fmt(monthlyLimit)}). Aumenta ADMIN_MONTHLY_COST_LIMIT_BRL ou espera virar o mês.`,
    });
  }
}

// Severidade pro UI: verde < 60%, amarelo 60-80%, laranja 80-100%, vermelho 100%.
export type CostSeverity = "ok" | "warn" | "near" | "over";

export function severity(used: number, limit: number): CostSeverity {
  if (limit <= 0) return "ok";
  const ratio = used / limit;
  if (ratio >= 1) return "over";
  if (ratio >= 0.8) return "near";
  if (ratio >= 0.6) return "warn";
  return "ok";
}
