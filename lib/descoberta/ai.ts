// =============================================================================
// Descoberta — driver de IA
// =============================================================================
// 3 chamadas, por papel (a completude NÃO depende de IA — é determinística no
// checklist; aqui a IA só frase/reage/extrai):
//   stepQuestions   — Haiku, tool forçada. Frasea o lote de itens que o engine
//                     mandou + o ack inicial.
//   streamAckDeltas — Haiku, streaming. Reação curta a resposta aberta.
//   extractAndRecap — Sonnet 4.6, tool forçada. Estrai dados + recap pro lead.
//
// O SDK já faz retry de 429/5xx. Erros sobem pro chamador (engine/route), que
// tem fallback determinístico (perguntas-piso do checklist).
// =============================================================================
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { DiscoveryCollectedItem } from "@/types/forms";
import {
  STEP_SYSTEM,
  STEP_TOOL,
  buildStepUserMessage,
  type StepBatchItem,
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
// stepQuestions — frasea o lote de itens (o engine decide QUAIS itens)
// -----------------------------------------------------------------------------
const stepOutputSchema = z.object({
  ack: z.string().max(600).optional(),
  questions: z
    .array(
      z.object({
        item_id: z.string().min(1).max(40),
        prompt: z.string().min(1).max(400),
      }),
    )
    .max(20),
});

export type StepResult = {
  ack?: string;
  /** item_id → prompt frasado pela IA. */
  prompts: Record<string, string>;
};

export async function stepQuestions(input: {
  need: string;
  collected: DiscoveryCollectedItem[];
  batch: StepBatchItem[];
}): Promise<StepResult> {
  const c = getClient();
  const res = await c.messages.create({
    model: DESCOBERTA_DRIVER_MODEL,
    max_tokens: 1024,
    system: [
      { type: "text", text: STEP_SYSTEM, cache_control: { type: "ephemeral" } },
    ],
    tools: [STEP_TOOL],
    tool_choice: { type: "tool", name: STEP_TOOL.name },
    messages: [{ role: "user", content: buildStepUserMessage(input) }],
  });

  const toolUse = firstToolUse(res.content);
  if (!toolUse) throw new Error("[descoberta] step: sem tool_use");

  const parsed = stepOutputSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new Error(`[descoberta] step: schema inválido — ${parsed.error.message}`);
  }
  const prompts: Record<string, string> = {};
  for (const q of parsed.data.questions) prompts[q.item_id] = q.prompt;
  return { ack: parsed.data.ack, prompts };
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
      api_acesso: z.string().optional(),
      onde_arquivos: z.string().optional(),
      portal_entrada: z.string().optional(),
      portal_destino: z.string().optional(),
      canais: z.array(z.string()).optional(),
      certificado: z.string().optional(),
      seguranca: z.string().optional(),
      ambiente_execucao: z.string().optional(),
    })
    .optional(),
  volume_clientes: z.string().optional(),
  volume_transacional: z.string().optional(),
  variacao: z.string().optional(),
  qualidade: z.string().optional(),
  processo_atual: z.string().optional(),
  time: z.string().optional(),
  tentativas_anteriores: z.string().optional(),
  gatilho: z.string().optional(),
  prazo: z.string().optional(),
  decisor: z.string().optional(),
  modelo_cobranca: z.string().optional(),
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
    max_tokens: 1800,
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
