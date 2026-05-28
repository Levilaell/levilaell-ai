// =============================================================================
// Descoberta — driver de IA
// =============================================================================
// 3 chamadas, separadas por papel e latência:
//   planQuestions   — Haiku, tool forçada. Q0 → ack + perguntas sob medida.
//   streamAckDeltas — Haiku, streaming. Reação curta a resposta aberta.
//   extractAndRecap — Sonnet 4.6, tool forçada. Extrai dados + recap pro lead.
//
// Modelo do driver = Haiku (rápido/barato, escolhido pra esse fluxo). Extração
// = Sonnet 4.6 (padrão do repo; 1 chamada não-crítica de latência onde a
// qualidade do PT-BR estruturado importa). O SDK já faz retry de 429/5xx.
// =============================================================================
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import {
  DISCOVERY_SLOTS,
  MAX_PLAN_QUESTIONS,
  type DiscoveryQuestion,
} from "@/lib/descoberta/slots";
import type { DiscoveryCollectedItem } from "@/types/forms";
import {
  PLAN_SYSTEM,
  PLAN_TOOL,
  ACK_SYSTEM,
  buildAckUserMessage,
  EXTRACT_SYSTEM,
  EXTRACT_TOOL,
  buildExtractUserMessage,
} from "@/lib/descoberta/prompts";

export const DESCOBERTA_DRIVER_MODEL = "claude-haiku-4-5";
export const DESCOBERTA_EXTRACT_MODEL = "claude-sonnet-4-6";

export function isDescobertaAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("[descoberta] ANTHROPIC_API_KEY ausente");
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

function firstToolUse<T extends { type: string }>(content: T[]) {
  return content.find(
    (b): b is Extract<T, { type: "tool_use" }> => b.type === "tool_use",
  );
}

// -----------------------------------------------------------------------------
// planQuestions — Q0 → ack + perguntas
// -----------------------------------------------------------------------------
const planQuestionSchema = z.object({
  key: z.string().min(1).max(40),
  prompt: z.string().min(1).max(400),
  kind: z.enum(["single", "multi", "text"]),
  chips: z.array(z.string().max(80)).max(10).optional(),
  placeholder: z.string().max(240).optional(),
});
const planOutputSchema = z.object({
  ack: z.string().min(1).max(600),
  questions: z.array(planQuestionSchema).min(1).max(MAX_PLAN_QUESTIONS),
});

export type DiscoveryPlan = {
  ack: string;
  questions: DiscoveryQuestion[];
};

// Garante que single/multi sempre tem chips (backfill do vocabulário; se não
// achar, vira text). Evita UI quebrada por output torto do modelo.
function normalizeQuestions(
  raw: z.infer<typeof planQuestionSchema>[],
): DiscoveryQuestion[] {
  const out: DiscoveryQuestion[] = [];
  for (const q of raw) {
    const slot = DISCOVERY_SLOTS.find((s) => s.key === q.key);
    let kind: DiscoveryQuestion["kind"] = q.kind;
    let chips: string[] | undefined = q.chips ? [...q.chips] : undefined;

    if (kind === "single" || kind === "multi") {
      if (!chips || chips.length === 0) {
        if (slot?.chips) chips = [...slot.chips];
        else {
          kind = "text";
          chips = undefined;
        }
      }
    }
    if (kind === "text") chips = undefined;

    out.push({
      key: q.key,
      prompt: q.prompt,
      kind,
      chips,
      placeholder:
        kind === "text" ? (q.placeholder ?? slot?.placeholder) : undefined,
    });
  }
  return out;
}

export async function planQuestions(input: {
  need: string;
  name?: string;
}): Promise<DiscoveryPlan> {
  const c = getClient();
  const userMsg = input.name
    ? `Lead: ${input.name}\nO que ele precisa: ${input.need}`
    : `O que o lead precisa: ${input.need}`;

  const res = await c.messages.create({
    model: DESCOBERTA_DRIVER_MODEL,
    max_tokens: 1024,
    system: [
      { type: "text", text: PLAN_SYSTEM, cache_control: { type: "ephemeral" } },
    ],
    tools: [PLAN_TOOL],
    tool_choice: { type: "tool", name: PLAN_TOOL.name },
    messages: [{ role: "user", content: userMsg }],
  });

  const toolUse = firstToolUse(res.content);
  if (!toolUse) throw new Error("[descoberta] plan: sem tool_use");

  const parsed = planOutputSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new Error(`[descoberta] plan: schema inválido — ${parsed.error.message}`);
  }
  return {
    ack: parsed.data.ack,
    questions: normalizeQuestions(parsed.data.questions),
  };
}

// -----------------------------------------------------------------------------
// streamAckDeltas — reação curta a resposta aberta (streaming)
// -----------------------------------------------------------------------------
export async function* streamAckDeltas(input: {
  need: string;
  question: string;
  answer: string;
}): AsyncGenerator<string> {
  const c = getClient();
  const stream = c.messages.stream({
    model: DESCOBERTA_DRIVER_MODEL,
    max_tokens: 220,
    system: [
      { type: "text", text: ACK_SYSTEM, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: buildAckUserMessage(input) }],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}

// -----------------------------------------------------------------------------
// extractAndRecap — fim da descoberta (Sonnet)
// -----------------------------------------------------------------------------
const extractOutputSchema = z.object({
  resumo: z.string(),
  dor_central: z.string(),
  sistemas: z
    .object({
      erp: z.string().optional(),
      erp_conexao: z.string().optional(),
      onde_arquivos: z.string().optional(),
      portal_destino: z.string().optional(),
      canais: z.array(z.string()).optional(),
    })
    .optional(),
  volume: z.string().optional(),
  processo_atual: z.string().optional(),
  time: z.string().optional(),
  tentativas_anteriores: z.string().optional(),
  prazo: z.string().optional(),
  detalhes_tecnicos: z.array(z.string()).optional(),
  escopo_sugerido: z.array(z.string()),
  perguntas_em_aberto: z.array(z.string()).optional(),
  recap: z.string(),
});
export type DescobertaExtract = z.infer<typeof extractOutputSchema>;

export async function extractAndRecap(input: {
  need: string;
  collected: DiscoveryCollectedItem[];
}): Promise<DescobertaExtract> {
  const c = getClient();
  const res = await c.messages.create({
    model: DESCOBERTA_EXTRACT_MODEL,
    max_tokens: 1500,
    system: [
      {
        type: "text",
        text: EXTRACT_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [EXTRACT_TOOL],
    tool_choice: { type: "tool", name: EXTRACT_TOOL.name },
    messages: [
      {
        role: "user",
        content: buildExtractUserMessage({
          need: input.need,
          collected: input.collected,
        }),
      },
    ],
  });

  const toolUse = firstToolUse(res.content);
  if (!toolUse) throw new Error("[descoberta] extract: sem tool_use");

  const parsed = extractOutputSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new Error(
      `[descoberta] extract: schema inválido — ${parsed.error.message}`,
    );
  }
  return parsed.data;
}
