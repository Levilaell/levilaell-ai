import Anthropic from "@anthropic-ai/sdk";
import type {
  DiagnosisAnalysis,
  DiagnosisAnalysisV2,
  DiagnosisAnswers,
} from "@/types/diagnosis";
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

// JSON schema V2 — força structured output. Estrutura nova:
// gargalo_principal + tres_oportunidades + plano_30_60_90 + alerta + abordagem.
const ANALYSIS_TOOL = {
  name: "save_diagnosis_analysis",
  description:
    "Persiste a análise estruturada do diagnóstico contábil. Sempre chame essa tool com a análise completa.",
  input_schema: {
    type: "object" as const,
    required: [
      "diagnostico_resumido",
      "gargalo_principal",
      "tres_oportunidades",
      "plano_30_60_90",
      "alerta_estrategico",
      "proximo_passo_recomendado",
    ],
    properties: {
      diagnostico_resumido: {
        type: "string",
        description:
          "2-3 frases sobre o estágio do escritório no eixo de maturidade operacional. Constatar, não elogiar.",
      },
      gargalo_principal: {
        type: "object",
        required: ["area", "descricao", "impacto_estimado"],
        properties: {
          area: { type: "string" },
          descricao: { type: "string" },
          impacto_estimado: {
            type: "string",
            description:
              "Horas/mês perdidas em faixa conservadora (ex: '40-60 h/mês'). NÃO usar R$.",
          },
        },
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
            "complexidade",
            "prazo_implementacao",
            "impacto_estimado",
          ],
          properties: {
            titulo: { type: "string" },
            descricao: { type: "string" },
            complexidade: {
              type: "string",
              enum: ["baixa", "media", "alta"],
            },
            prazo_implementacao: { type: "string" },
            impacto_estimado: {
              type: "string",
              description: "Qualitativo. SEM R$ específico.",
            },
          },
        },
      },
      plano_30_60_90: {
        type: "object",
        required: ["30_dias", "60_dias", "90_dias"],
        properties: {
          "30_dias": { type: "string" },
          "60_dias": { type: "string" },
          "90_dias": { type: "string" },
        },
      },
      alerta_estrategico: { type: "string" },
      proximo_passo_recomendado: {
        type: "object",
        required: ["abordagem", "justificativa"],
        properties: {
          abordagem: {
            type: "string",
            enum: ["diy", "conversa", "proposta_formal"],
          },
          justificativa: { type: "string" },
        },
      },
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

function toAnalysis(parsed: DiagnosisAnalysisOutput): DiagnosisAnalysisV2 {
  return {
    ...parsed,
    tres_oportunidades: parsed.tres_oportunidades as DiagnosisAnalysisV2["tres_oportunidades"],
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
// Mock fallback — usado quando ANTHROPIC_API_KEY ausente (dev/staging sem key).
// Deve refletir a estrutura V2 contábil. NÃO menciona ferramentas específicas
// (n8n, Make, Zapier) — o prompt real bane essas marcas e o mock deve seguir.
// ---------------------------------------------------------------------------
export function generateMockAnalysis(
  answers: DiagnosisAnswers,
): DiagnosisAnalysisV2 {
  const d = describeAnswers(answers);
  const carteiraGrande =
    answers.q1_size === "250_a_500" || answers.q1_size === "500_mais";
  const erpRobusto = ["dominio", "onvio", "alterdata", "sage"].includes(
    answers.q2_erp,
  );
  const horasAltas =
    answers.q5_hours_weekly === "50_a_100" ||
    answers.q5_hours_weekly === "mais_100";
  const urgenciaAlta = answers.q7_timeline === "para_ontem";
  const semHistorico = answers.q6_automation_history === "nunca";
  const saasFalhou = answers.q6_automation_history === "saas_falhou";

  const abordagem: "diy" | "conversa" | "proposta_formal" =
    carteiraGrande && erpRobusto && horasAltas && urgenciaAlta
      ? "proposta_formal"
      : (answers.q1_size === "ate_30" ||
            answers.q1_size === "30_a_100") &&
          semHistorico &&
          (answers.q7_timeline === "sem_urgencia" ||
            answers.q7_timeline === "tres_meses")
        ? "diy"
        : "conversa";

  const primeiraDor = answers.q4_pain_areas[0] ?? "triagem";
  const areaMap: Record<string, string> = {
    triagem: "Triagem documental",
    cobranca: "Cobrança de documentos",
    nf: "Processamento de NF",
    lancamentos: "Lançamentos fiscais",
    conciliacao: "Conciliação bancária",
    atendimento: "Atendimento a clientes",
    relatorios: "Relatórios mensais",
    onboarding: "Onboarding de clientes",
  };
  const areaGargalo = areaMap[primeiraDor] ?? "Operação interna";

  return {
    diagnostico_resumido: `Escritório com carteira de ${d.carteira.toLowerCase()} rodando em ${d.erp}, perfil predominante ${d.perfilCliente.toLowerCase()}. ${horasAltas ? "Volume de horas em tarefas manuais indica que a operação cresceu na frente da estrutura." : "Operação ainda comporta o volume atual, mas sem folga pra absorver novos clientes sem dor."}`,
    gargalo_principal: {
      area: areaGargalo,
      descricao: `Concentração de tempo em ${areaGargalo.toLowerCase()} sugere que a equipe vira repositório manual de informação que ERP e obrigações depois precisam consumir. Quando o fechamento aperta, esse retrabalho cobra juros em forma de horas extras ou erro em SPED/DCTF.`,
      impacto_estimado: horasAltas
        ? "60-100 h/mês concentradas em poucas pessoas"
        : "20-40 h/mês diluídas no time",
    },
    tres_oportunidades: [
      {
        titulo: `Estruturar o fluxo de ${areaGargalo.toLowerCase()}`,
        descricao: `Mapear ponto a ponto o caminho atual de entrada → conferência → lançamento. Padronizar templates de pedido ao cliente, prazos e responsáveis. Antes de automatizar, deixar o processo previsível — automação sobre processo quebrado só acelera o caos.`,
        complexidade: "baixa",
        prazo_implementacao: urgenciaAlta ? "1-2 semanas" : "2-3 semanas",
        impacto_estimado: "Previsibilidade no fechamento e redução de retrabalho",
      },
      {
        titulo: "Triagem assistida por IA na entrada de documentos",
        descricao: `Configurar uma camada de classificação automática que lê documentos recebidos (e-mail, WhatsApp), identifica tipo (NF entrada, NF saída, extrato, boleto, contrato) e roteia pra fila correta do ERP. Equipe vira revisora, não digitadora.`,
        complexidade: "media",
        prazo_implementacao: "3-6 semanas",
        impacto_estimado: "Alívio significativo em horas de digitação manual",
      },
      {
        titulo: "Relatórios mensais auto-gerados",
        descricao: `Substituir a montagem manual de relatórios por geração automática a partir dos dados do ERP, com envio agendado pra cada cliente. Padrão único, mas com bloco editável por cliente. Libera horas dos responsáveis técnicos pra atendimento consultivo.`,
        complexidade: "media",
        prazo_implementacao: "4-6 semanas",
        impacto_estimado: "Tempo de fechamento reduzido em dias úteis",
      },
    ],
    plano_30_60_90: {
      "30_dias":
        "Mapear o fluxo atual da dor principal em uma folha de papel. Padronizar templates de cobrança de documentos e prazos de envio acordados por escrito.",
      "60_dias":
        "Implementar a camada de triagem com IA pros tipos de documento mais comuns. Medir tempo de digitação por NF antes/depois.",
      "90_dias":
        "Automatizar relatórios mensais e migrar o time pra postura consultiva — usar a folga pra subir ticket médio nos clientes existentes.",
    },
    alerta_estrategico: saasFalhou
      ? "O histórico mostra que vocês já tentaram SaaS pronto e não escalou. O risco invisível agora é repetir o padrão com outro SaaS — produto bom no demo, frágil em produção contábil. O que falta normalmente não é mais ferramenta: é desenho de processo antes da implementação, e propriedade técnica de quem opera. Antes de comprar de novo, vale mapear exatamente por que o último tentativa quebrou."
      : "A armadilha clássica em escritório contábil é tratar automação como projeto único — 'vou parar pra implementar e depois volto'. Operação contábil é cíclica (fechamento mensal, obrigações anuais), e qualquer mudança grande precisa caber dentro do ciclo. Recomendamos automatizar em ondas curtas que não atrapalhem o fechamento atual.",
    proximo_passo_recomendado: {
      abordagem,
      justificativa:
        abordagem === "diy"
          ? "Carteira ainda pequena e sem histórico de tentativa de automação significam que o ROI de contratar agora é baixo. Vale primeiro padronizar processos com a equipe atual; quando a dor passar de 25 h/sem ou a carteira passar de 100, conversamos."
          : abordagem === "proposta_formal"
            ? "Carteira robusta, ERP consolidado e horas altas justificam um projeto formal com escopo, prazos e métricas. Recomendamos um diagnóstico aprofundado de 1-2 semanas antes do desenho final, pra garantir que o que vamos automatizar realmente reduz o gargalo certo."
            : "O perfil indica espaço pra ganho real, mas o caminho exato depende de detalhes que não cabem no formulário. Uma conversa de 30-40 min mapeia o caminho mais curto e descarta o que não vai render no curto prazo.",
    },
  };
}
