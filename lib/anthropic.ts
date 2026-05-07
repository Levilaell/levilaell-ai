import Anthropic from "@anthropic-ai/sdk";
import type { DiagnosisAnalysis, DiagnosisAnswers } from "@/types/diagnosis";
import { buildDiagnosisPrompt, describeAnswers } from "@/lib/diagnosis-prompt";
import {
  diagnosisAnalysisSchema,
  type DiagnosisAnalysisOutput,
} from "@/types/forms";

export const ANTHROPIC_MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 3_000;
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 1_000;

export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

// JSON schema for the tool — força structured output via Anthropic tool use.
const ANALYSIS_TOOL = {
  name: "save_diagnosis_analysis",
  description:
    "Persiste a análise estruturada do diagnóstico de operação. Sempre chame essa tool com a análise completa.",
  input_schema: {
    type: "object" as const,
    required: [
      "diagnostico_resumido",
      "tres_oportunidades",
      "quick_win",
      "estimativa_roi",
      "proximo_passo_recomendado",
      "alerta_estrategico",
    ],
    properties: {
      diagnostico_resumido: {
        type: "string",
        description: "1-2 frases capturando a situação atual com empatia e precisão.",
      },
      tres_oportunidades: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: {
          type: "object",
          required: [
            "titulo",
            "descricao",
            "impacto_estimado",
            "complexidade",
            "ferramentas_sugeridas",
            "prazo_implementacao",
          ],
          properties: {
            titulo: { type: "string" },
            descricao: { type: "string" },
            impacto_estimado: { type: "string" },
            complexidade: { type: "string", enum: ["baixa", "média", "alta"] },
            ferramentas_sugeridas: {
              type: "array",
              items: { type: "string" },
              minItems: 1,
              maxItems: 8,
            },
            prazo_implementacao: { type: "string" },
          },
        },
      },
      quick_win: {
        type: "object",
        required: ["titulo", "passo_a_passo", "ferramentas_necessarias"],
        properties: {
          titulo: { type: "string" },
          passo_a_passo: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
            maxItems: 8,
          },
          ferramentas_necessarias: {
            type: "array",
            items: { type: "string" },
            maxItems: 8,
          },
        },
      },
      estimativa_roi: {
        type: "object",
        required: [
          "horas_recuperaveis_mes",
          "valor_estimado_mensal",
          "tempo_payback",
          "disclaimer",
          "metodologia",
        ],
        properties: {
          horas_recuperaveis_mes: {
            description: "Número OU range em string (ex: 40 ou '30-50').",
          },
          valor_estimado_mensal: {
            type: "string",
            description: "Range em string (ex: 'R$ 2.000 a R$ 8.000/mês').",
          },
          tempo_payback: { type: "string" },
          disclaimer: {
            type: ["string", "null"],
            description:
              "Texto explicando precisão da estimativa, ou null se calculado com dados reais.",
          },
          metodologia: { type: "string" },
        },
      },
      proximo_passo_recomendado: {
        type: "object",
        required: ["abordagem", "justificativa"],
        properties: {
          abordagem: {
            type: "string",
            enum: [
              "diy",
              "consultoria_pontual",
              "parceria_continua",
              "ainda_nao_e_hora",
            ],
          },
          justificativa: { type: "string" },
        },
      },
      alerta_estrategico: { type: "string" },
    },
  },
};

export async function generateDiagnosisAnalysis(
  answers: DiagnosisAnswers,
): Promise<DiagnosisAnalysis> {
  if (!isAnthropicConfigured()) {
    return generateMockAnalysis(answers);
  }

  const c = getClient();
  if (!c) return generateMockAnalysis(answers);

  const prompt = buildDiagnosisPrompt(answers);
  const startedAt = Date.now();

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await c.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: MAX_TOKENS,
        tools: [ANALYSIS_TOOL],
        tool_choice: { type: "tool", name: ANALYSIS_TOOL.name },
        messages: [{ role: "user", content: prompt }],
      });

      const toolUse = response.content.find(
        (block): block is Extract<typeof block, { type: "tool_use" }> =>
          block.type === "tool_use",
      );
      if (!toolUse) {
        throw new Error("Anthropic não retornou tool_use.");
      }

      const parsed = diagnosisAnalysisSchema.safeParse(toolUse.input);
      if (!parsed.success) {
        throw new Error(
          `Schema inválido na resposta: ${parsed.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; ")}`,
        );
      }

      console.info(
        `[anthropic] ok · model=${response.model} · in=${response.usage.input_tokens} out=${response.usage.output_tokens} · ${Date.now() - startedAt}ms`,
      );

      return toAnalysis(parsed.data);
    } catch (err) {
      lastError = err;
      const e = err as { status?: number };
      const isRetryable =
        !e.status || e.status === 429 || e.status === 500 || e.status === 502 || e.status === 503;
      if (attempt < MAX_ATTEMPTS && isRetryable) {
        const backoff = BASE_BACKOFF_MS * 2 ** (attempt - 1);
        console.warn(
          `[anthropic] tentativa ${attempt}/${MAX_ATTEMPTS} falhou, reagendando em ${backoff}ms`,
          err instanceof Error ? err.message : err,
        );
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      break;
    }
  }

  console.error("[anthropic] todas as tentativas falharam", lastError);
  throw new AnthropicError(
    "Não consegui gerar a análise agora. Tente novamente em alguns segundos.",
    lastError,
  );
}

function toAnalysis(parsed: DiagnosisAnalysisOutput): DiagnosisAnalysis {
  // Zod permite array de qualquer tamanho; cast para a tupla esperada.
  return {
    ...parsed,
    tres_oportunidades: parsed.tres_oportunidades as DiagnosisAnalysis["tres_oportunidades"],
  };
}

export class AnthropicError extends Error {
  cause: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "AnthropicError";
    this.cause = cause;
  }
}

// ---------------------------------------------------------------------------
// Mock fallback — usado quando ANTHROPIC_API_KEY não está setado.
// Continua sector-aware pra manter o desenvolvimento local sem custo de IA.
// ---------------------------------------------------------------------------
export function generateMockAnalysis(answers: DiagnosisAnswers): DiagnosisAnalysis {
  const d = describeAnswers(answers);
  const isB2B = answers.q2_business_model === "b2b_services";
  const isEcom = answers.q2_business_model === "ecommerce";
  const sectorTouch = isB2B
    ? "operação de serviço B2B"
    : isEcom
      ? "jornada de compra"
      : "operação interna";

  const isUrgent = answers.q8_timeline === "this_week";
  const isLowBudget = answers.q9_budget === "under_1k";
  const noUrgency = answers.q8_timeline === "no_urgency";

  const abordagem = isLowBudget
    ? "diy"
    : answers.q9_budget === "over_15k"
      ? "parceria_continua"
      : "consultoria_pontual";

  return {
    diagnostico_resumido: `Operação no segmento de ${d.businessModel.toLowerCase()} (porte: ${d.size.toLowerCase()}) com gargalo principal em ${d.painAreas.toLowerCase()}. Objetivo declarado de "${d.mainGoal.toLowerCase()}" ${noUrgency ? "sugere caminho exploratório" : "é compatível com automação focada"}.`,
    tres_oportunidades: [
      {
        titulo: "Centralizar atendimento e qualificação",
        descricao: `Construir um agente de IA que recebe leads e qualifica antes do humano entrar — específico pro ${sectorTouch}.`,
        impacto_estimado: "até 12h/semana recuperadas",
        complexidade: "média",
        ferramentas_sugeridas: ["n8n", "Claude", "WhatsApp Business API"],
        prazo_implementacao: isUrgent ? "1-2 semanas" : "3-4 semanas",
      },
      {
        titulo: "Automatizar relatórios operacionais",
        descricao:
          "Substituir planilhas manuais por dashboards que se atualizam sozinhos a partir das fontes existentes.",
        impacto_estimado: "8h/semana de coordenadores",
        complexidade: "baixa",
        ferramentas_sugeridas: ["Metabase", "n8n", "Supabase"],
        prazo_implementacao: "1-2 semanas",
      },
      {
        titulo: "Integrar sistemas críticos",
        descricao:
          "Conectar CRM, financeiro e canais de comunicação pra que dados fluam sem cópia manual.",
        impacto_estimado: "redução de 60% em retrabalho",
        complexidade: "média",
        ferramentas_sugeridas: ["n8n", "Make", "APIs nativas"],
        prazo_implementacao: "3-6 semanas",
      },
    ],
    quick_win: {
      titulo: "Fluxo de boas-vindas automatizado (1 semana)",
      passo_a_passo: [
        "Mapear o canal onde mais entram leads.",
        "Criar uma sequência de 3 mensagens automatizadas com perguntas-chave.",
        "Conectar respostas a uma planilha estruturada.",
        "Definir critério simples de qualificação (orçamento + prazo).",
        "Rotear leads quentes direto pra você.",
      ],
      ferramentas_necessarias: ["WhatsApp Business", "Google Sheets", "Tally"],
    },
    estimativa_roi: {
      horas_recuperaveis_mes: "30-60",
      valor_estimado_mensal: "R$ 3.000 a R$ 9.000/mês",
      tempo_payback: "2 a 4 meses",
      disclaimer:
        "Estimativa preliminar baseada em médias do setor. Para cálculo preciso, podemos refinar na call gratuita.",
      metodologia:
        "Range estimado a partir de modelos típicos do segmento. Sem dados quantitativos do lead, intervalo mantido amplo de propósito.",
    },
    proximo_passo_recomendado: {
      abordagem,
      justificativa:
        abordagem === "diy"
          ? "Investimento informado e maturidade técnica indicam caminho autônomo: foque em ferramentas no-code com baixo custo recorrente antes de contratar."
          : abordagem === "parceria_continua"
            ? "Investimento e volume justificam parceria contínua: o ganho composto de iterações semanais supera projetos pontuais."
            : "Você tem clareza do problema e investimento alinhado. Uma consultoria pontual de 4-6 semanas resolve o gargalo principal sem comprometer a operação atual.",
    },
    alerta_estrategico:
      "Cuidado para não automatizar processo quebrado. Antes de qualquer ferramenta, vale 1 semana mapeando o fluxo atual em uma folha de papel — automatizar caos só acelera o caos.",
  };
}
