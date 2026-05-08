import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_MODEL } from "@/lib/anthropic";

export { ANTHROPIC_MODEL };

export function isAnthropicReady(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
export function getAdminClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

// ---------------------------------------------------------------------------
// Cost — Sonnet 4.6 em BRL.
// Anthropic vende em USD ($3/M input, $15/M output). Brief usa câmbio
// conservador: R$ 0,018/1K input + R$ 0,090/1K output (~6 BRL/USD).
// Se um dia mudarem, override via env.
// ---------------------------------------------------------------------------
const DEFAULT_INPUT_BRL_PER_1K = 0.018;
const DEFAULT_OUTPUT_BRL_PER_1K = 0.09;

function num(envName: string, fallback: number): number {
  const raw = process.env[envName];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export type Usage = {
  input_tokens: number;
  output_tokens: number;
};

export type CostBreakdown = {
  totalTokens: number;
  costBRL: number;
};

export function estimateCostBRL(usage: Usage): CostBreakdown {
  const inputRate = num("ANTHROPIC_INPUT_BRL_PER_1K", DEFAULT_INPUT_BRL_PER_1K);
  const outputRate = num(
    "ANTHROPIC_OUTPUT_BRL_PER_1K",
    DEFAULT_OUTPUT_BRL_PER_1K,
  );
  const cost =
    (usage.input_tokens / 1000) * inputRate +
    (usage.output_tokens / 1000) * outputRate;
  return {
    totalTokens: usage.input_tokens + usage.output_tokens,
    costBRL: Math.round(cost * 10000) / 10000, // 4 decimals
  };
}

// ---------------------------------------------------------------------------
// Erro tipado pra orquestrador
// ---------------------------------------------------------------------------
export class GenerationError extends Error {
  cause: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "GenerationError";
    this.cause = cause;
  }
}
