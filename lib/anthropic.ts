import Anthropic from "@anthropic-ai/sdk";
import type { DiagnosisAnalysis, DiagnosisAnswers } from "@/types/diagnosis";
import { buildDiagnosisPrompt, describeAnswers } from "@/lib/diagnosis-prompt";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 2_500;

export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function generateDiagnosisAnalysis(
  answers: DiagnosisAnswers,
): Promise<DiagnosisAnalysis> {
  if (!isAnthropicConfigured()) {
    return generateMockAnalysis(answers);
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const prompt = buildDiagnosisPrompt(answers);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Resposta vazia da Anthropic.");
  }

  const json = extractJson(textBlock.text);
  return json as DiagnosisAnalysis;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed);
  }
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("JSON não encontrado na resposta.");
  return JSON.parse(match[0]);
}

export function generateMockAnalysis(answers: DiagnosisAnswers): DiagnosisAnalysis {
  const d = describeAnswers(answers);
  const isHealth = answers.q2_industry === "health";
  const isEcommerce = answers.q2_industry === "ecommerce";

  const sectorTouch = isHealth
    ? "fluxo de pacientes"
    : isEcommerce
      ? "jornada de compra"
      : "operação interna";

  return {
    diagnostico_resumido: `Sua operação no setor de ${d.industry.toLowerCase()} apresenta gargalos típicos de quem cresceu sem profissionalizar processos: ${d.pains.toLowerCase()}. O objetivo de "${d.goal.toLowerCase()}" é compatível com automação de impacto rápido.`,
    tres_oportunidades: [
      {
        titulo: "Centralizar atendimento e qualificação de leads",
        descricao: `Construir um agente de IA que recebe leads no WhatsApp/site, qualifica com perguntas estratégicas e roteia para atendimento humano só quando necessário. Específico para o ${sectorTouch}.`,
        impacto_estimado: "até 12h/semana recuperadas",
        complexidade: "média",
        ferramentas_sugeridas: ["n8n", "Claude", "WhatsApp Business API"],
      },
      {
        titulo: "Automatizar relatórios operacionais",
        descricao:
          "Substituir planilhas manuais por dashboards que se atualizam sozinhos a partir das fontes existentes. Reduz tempo gasto em compilação e elimina erros humanos.",
        impacto_estimado: "8h/semana de coordenadores",
        complexidade: "baixa",
        ferramentas_sugeridas: ["Metabase", "n8n", "Supabase"],
      },
      {
        titulo: "Integrar sistemas críticos",
        descricao:
          "Conectar CRM, ferramentas financeiras e canais de comunicação para que dados fluam sem cópia manual entre planilhas. Base para qualquer próxima automação.",
        impacto_estimado: "redução de 60% em retrabalho",
        complexidade: "média",
        ferramentas_sugeridas: ["n8n", "Make", "APIs nativas"],
      },
    ],
    quick_win: {
      titulo: "Fluxo de boas-vindas automatizado para novos contatos (1 semana)",
      passo_a_passo: [
        "Mapear o canal onde mais entram leads (Instagram, site, WhatsApp).",
        "Criar uma sequência de 3 mensagens automatizadas com perguntas-chave.",
        "Conectar respostas a uma planilha estruturada.",
        "Definir critério simples de qualificação (ex: orçamento + prazo).",
        "Rotear leads quentes direto para você.",
      ],
    },
    estimativa_roi: {
      horas_recuperaveis_mes: 60,
      valor_estimado_mensal: "R$ 4.500 a R$ 9.000",
      tempo_payback: "2 a 4 meses",
    },
    proximo_passo_recomendado: {
      abordagem: "consultoria_pontual",
      justificativa:
        "Você tem clareza do problema mas falta capacidade técnica para construir. Uma consultoria pontual de 4-6 semanas resolve o gargalo principal e te deixa autônomo para iterar.",
    },
    alerta_estrategico:
      "Cuidado para não automatizar processo quebrado. Antes de qualquer ferramenta, vale 1 semana mapeando o fluxo atual em uma folha de papel — automatizar caos só acelera o caos.",
  };
}
