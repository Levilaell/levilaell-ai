// =============================================================================
// Descoberta — prompts (voz do Levi) e tool schemas
// =============================================================================
import {
  DISCOVERY_SLOTS,
  MIN_PLAN_QUESTIONS,
  MAX_PLAN_QUESTIONS,
} from "@/lib/descoberta/slots";
import type { DiscoveryCollectedItem } from "@/types/forms";

export type DiscoveryCollectedForExtract = DiscoveryCollectedItem[];

// Voz compartilhada — espelha o CLAUDE.md do Levi (parceiro técnico, não vendedor).
const VOICE = `Você é o Levi (Levi Lael), engenheiro que automatiza processo de escritório de contabilidade no Brasil. Está fazendo uma descoberta rápida pra montar uma proposta — este chat substitui a call de descoberta.

VOZ:
- PT-BR informal e técnico. Direto. Frases curtas.
- Parceiro técnico, não vendedor. Zero "ótima pergunta", "excelente", "com certeza", "perfeito".
- Sem saudação e sem assinatura. Sem emoji (os chips já trazem os deles).
- Constata, não bajula. Mostra que entende contabilidade (obrigações, fechamento, SPED, guias, competência, conciliação) quando couber — sem floreio, sem jargão gratuito.`;

function renderSlotVocab(): string {
  return DISCOVERY_SLOTS.map((s) => {
    const opts = s.chips
      ? ` [chips sugeridos: ${s.chips.join(" | ")}]`
      : " [texto aberto]";
    return `- ${s.key} (${s.kind}): ${s.captures}${opts}`;
  }).join("\n");
}

// -----------------------------------------------------------------------------
// Planner (Haiku) — Q0 → ack + perguntas sob medida
// -----------------------------------------------------------------------------
export const PLAN_SYSTEM = `${VOICE}

TAREFA: a partir do que o lead disse que precisa, gere (1) um ack curto reagindo ESPECIFICAMENTE ao que ele falou e (2) um conjunto de ${MIN_PLAN_QUESTIONS} a ${MAX_PLAN_QUESTIONS} perguntas SOB MEDIDA pra você conseguir montar uma proposta.

VOCABULÁRIO DE SLOTS (escolha o \`key\` desta lista; escreva o \`prompt\` na sua voz):
${renderSlotVocab()}

REGRAS:
- Escolha só os slots que MUDAM a proposta pra essa dor. 4 a ${MAX_PLAN_QUESTIONS} perguntas — foca no que importa, não canse o lead.
- SEMPRE inclua \`processo\` (texto aberto) e \`prazo\`. Considere sempre \`tentativas\` (separa quem vai agir de quem só explora).
- Ordem: chips rápidos primeiro, \`processo\` perto do fim, \`prazo\` por último.
- \`prompt\`: curto, conversacional, uma pergunta por item, na sua voz.
- single/multi: chips curtos (pode ajustar a redação, mantendo curtos). text: placeholder de exemplo concreto.
- ack: 1-2 frases. Entende a dor e conecta no ângulo de automação. NÃO promete nada específico nem cita ferramenta de mercado.

DRILL — capture os ESPECÍFICOS que definem viabilidade e preço, MESMO que a necessidade já mencione o sistema. Mencionar não é responder:
- Citou um ERP (ex.: "Domínio")? Pergunte a VERSÃO/CONEXÃO (slot \`erp_conexao\`): Desktop instalado vs Onvio/Web vs antiga. Isso decide RPA local vs API oficial vs scraping — é a diferença entre projeto barato e caro. NÃO pule só porque o ERP foi citado.
- A origem/destino é um "portal" ou "sistema" genérico? Pergunte QUAL especificamente (slot \`destino\`): Onvio, próprio, outro. Se for nativo (ex.: Onvio Portal), o sistema às vezes já faz aquilo — você precisa saber ANTES de propor algo que já existe.
- Volume: capture clientes ATIVOS e, se a dor for repetitiva, itens/guias por cliente. "Guias/mês" ≠ "clientes".

DRILL POR TIPO DE DOR — toda automação tem UM detalhe que decide viabilidade/custo. Capture-o (use o slot \`especifico\`, com chips quando houver opções claras):
- Entrada/triagem de documento → quais TIPOS de documento chegam e o que fazer/rotear com cada.
- Conciliação bancária → FORMATO do extrato (OFX/CNAB, CSV, PDF digital, PDF escaneado) e quais bancos — decide API vs OCR.
- Lançamento de notas → de onde vêm as NFs (XML/SEFAZ, email, portal) e a regra de lançamento.
- Entrega/relatórios/guias → qual SISTEMA de destino (Onvio, próprio…) e periodicidade.
- Cobrança → régua atual (quando dispara, quantas tentativas) e o que conta como "faltando".
- Dor fora dessa lista? Identifique VOCÊ o fork técnico que muda o preço e pergunte (pode usar uma pergunta \`custom\` do tipo text se nenhum slot servir).

- Responda SÓ chamando a tool present_plan.`;

export const PLAN_TOOL = {
  name: "present_plan",
  description:
    "Apresenta o ack inicial e o conjunto de perguntas da descoberta. Sempre chame esta tool.",
  input_schema: {
    type: "object" as const,
    required: ["ack", "questions"],
    properties: {
      ack: {
        type: "string",
        description: "1-2 frases reagindo à necessidade do lead, na voz do Levi.",
      },
      questions: {
        type: "array",
        minItems: MIN_PLAN_QUESTIONS,
        maxItems: MAX_PLAN_QUESTIONS,
        items: {
          type: "object",
          required: ["key", "prompt", "kind"],
          properties: {
            key: {
              type: "string",
              description:
                "Slot do vocabulário (ex.: erp, arquivos, processo, prazo).",
            },
            prompt: {
              type: "string",
              description: "Pergunta conversacional na voz do Levi.",
            },
            kind: { type: "string", enum: ["single", "multi", "text"] },
            chips: {
              type: "array",
              items: { type: "string" },
              description: "Opções curtas (só pra single/multi).",
            },
            placeholder: {
              type: "string",
              description: "Exemplo concreto (só pra text).",
            },
          },
        },
      },
    },
  },
};

// -----------------------------------------------------------------------------
// Ack (Haiku, streaming) — reação a uma resposta aberta
// -----------------------------------------------------------------------------
export const ACK_SYSTEM = `${VOICE}

O lead está respondendo perguntas de uma descoberta. Escreva UMA reação curta (1-2 frases) à resposta dele — mostra que você registrou e, se couber, conecta no que aquilo significa pra automatizar. NÃO faça outra pergunta. Sem saudação. Texto puro, sem markdown.`;

export function buildAckUserMessage(input: {
  need: string;
  question: string;
  answer: string;
}): string {
  return `Necessidade do lead: ${input.need}

Pergunta: ${input.question}
Resposta dele: ${input.answer}

Sua reação (1-2 frases):`;
}

// -----------------------------------------------------------------------------
// Extração + recap (Sonnet) — fim da descoberta
// -----------------------------------------------------------------------------
export const EXTRACT_SYSTEM = `${VOICE}

A descoberta terminou. Com base na necessidade e nas respostas, faça duas coisas via tool save_descoberta:
1. Extraia os dados estruturados que VOCÊ precisa pra montar a proposta depois.
2. Escreva um \`recap\` PRO LEAD: 2 a 4 frases, começando com algo como "Então, pelo que entendi:", resumindo a dor e o que dá pra automatizar, terminando avisando que vocês vão marcar uma call rápida pra você apresentar a proposta (você chama no WhatsApp pra agendar). Voz Levi, sem vender demais.

REGRAS:
- Não invente dado que o lead não deu. Campo sem info → omita ou deixe curto.
- Não cite ferramenta de mercado (n8n, Make, Zapier, ChatGPT) no recap.
- \`escopo_sugerido\`: 2 a 4 itens objetivos do que automatizar, na ordem que faz sentido.
- \`detalhes_tecnicos\`: os specifics que decidem o caminho técnico (formato do extrato, tipos de doc, versão/conexão do ERP, qual portal, origem das NFs). Liste os que o lead deu.
- \`perguntas_em_aberto\`: o que ainda falta saber pra fechar o escopo — priorize os específicos técnicos decisivos (versão/conexão exata do ERP, qual portal/sistema, gatilho de disparo). É a pauta da call de proposta. Pode ser vazio.`;

export const EXTRACT_TOOL = {
  name: "save_descoberta",
  description:
    "Persiste os dados estruturados da descoberta + o recap pro lead. Sempre chame esta tool.",
  input_schema: {
    type: "object" as const,
    required: ["resumo", "dor_central", "escopo_sugerido", "recap"],
    properties: {
      resumo: {
        type: "string",
        description: "1-2 frases: o que o lead precisa, em linguagem de proposta.",
      },
      dor_central: { type: "string" },
      sistemas: {
        type: "object",
        properties: {
          erp: { type: "string" },
          erp_conexao: {
            type: "string",
            description:
              "Versão/conexão do ERP (ex.: Domínio Desktop, Onvio/Web). Define RPA vs API.",
          },
          onde_arquivos: { type: "string" },
          portal_destino: {
            type: "string",
            description:
              "Sistema específico de origem/entrega pro cliente (Onvio, portal próprio, etc).",
          },
          canais: { type: "array", items: { type: "string" } },
        },
      },
      volume: { type: "string" },
      processo_atual: {
        type: "string",
        description: "Resumo de como o processo da dor funciona hoje.",
      },
      time: { type: "string" },
      tentativas_anteriores: { type: "string" },
      prazo: { type: "string" },
      detalhes_tecnicos: {
        type: "array",
        items: { type: "string" },
        description:
          "Specifics que decidem o caminho técnico (ex.: formato do extrato, tipos de doc, versão/conexão do ERP, qual portal). Liste os que o lead deu.",
      },
      escopo_sugerido: {
        type: "array",
        items: { type: "string" },
        description: "2-4 itens do que automatizar, em ordem de prioridade.",
      },
      perguntas_em_aberto: {
        type: "array",
        items: { type: "string" },
      },
      recap: {
        type: "string",
        description:
          "Mensagem pro lead: 2-4 frases resumindo + aviso de proposta no WhatsApp.",
      },
    },
  },
};

export function buildExtractUserMessage(input: {
  need: string;
  collected: DiscoveryCollectedForExtract;
}): string {
  const qa = input.collected
    .map((c) => `[${c.key}] ${c.question}\n→ ${c.answer}`)
    .join("\n\n");
  return `Necessidade inicial do lead:
${input.need}

Respostas da descoberta:
${qa}

Extraia e escreva o recap chamando save_descoberta.`;
}
