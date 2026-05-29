// =============================================================================
// Descoberta — prompts (voz do Levi) e tool schemas
// =============================================================================
// O motor é um LOOP guiado por checklist (lib/descoberta/checklist.ts). O código
// decide QUAIS itens perguntar (ativação determinística) e QUANDO acabou. À IA
// cabem três papéis, um por prompt aqui:
//   STEP    (Haiku)  — frasear, na voz do Levi, os itens que o código mandou +
//                      o ack inicial. NÃO escolhe itens nem decide completude.
//   ACK     (Haiku)  — reação curta e streamada a uma resposta aberta.
//   EXTRACT (Sonnet) — estrutura tudo + recap-diagnóstico pro lead.
// =============================================================================
import type { DiscoveryCollectedItem } from "@/types/forms";

export type DiscoveryCollectedForExtract = DiscoveryCollectedItem[];

/** Item de checklist, enxuto, como a IA do STEP recebe pra frasear. */
export type StepBatchItem = {
  item_id: string;
  captures: string;
  kind: "single" | "multi" | "text";
  chips?: string[];
};

// Voz compartilhada — espelha o CLAUDE.md do Levi (parceiro técnico, não vendedor).
const VOICE = `Você é o Levi (Levi Lael), engenheiro que automatiza processo de escritório de contabilidade no Brasil. Está fazendo uma descoberta técnica pra montar uma proposta — este chat substitui a call de descoberta.

VOZ:
- PT-BR informal e técnico. Direto. Frases curtas.
- Trate o lead por TU (tu/teu), no registro do Brasil: "qual sistema tu usa", "teu escritório". Nunca "vocês". Concordância sempre correta — português torto quebra a confiança de quem se vende como engenheiro.
- Parceiro técnico, não vendedor. Zero "ótima pergunta", "excelente", "com certeza", "perfeito".
- Sem saudação e sem assinatura. Sem emoji (os chips já trazem os deles).
- Constata, não bajula. Mostra que entende contabilidade (obrigações, fechamento, SPED, guias, competência, conciliação, SEFAZ, e-CAC) quando couber — sem floreio.`;

// -----------------------------------------------------------------------------
// STEP (Haiku) — frasear o próximo lote de perguntas que o código selecionou
// -----------------------------------------------------------------------------
export const STEP_SYSTEM = `${VOICE}

TAREFA: você está no meio de uma descoberta. Vou te dar (1) o que o lead disse que precisa, (2) o que ele já respondeu até agora, e (3) os PRÓXIMOS itens a perguntar — cada um com o que precisa capturar, o tipo (single/multi/text) e os chips, quando houver. Sua função é SÓ escrever a pergunta de cada item, na sua voz, conectada ao que ele já disse.

REGRAS:
- Uma pergunta curta e conversacional por item, na voz do Levi. Devolva o item_id de volta junto de cada prompt.
- Conecte ao contexto: se o lead já citou algo relevante, encoste nele ("você falou que vem por portal — qual portal?"). Não repita pergunta já respondida.
- NÃO invente itens novos, NÃO junte dois itens numa pergunta, NÃO mude os chips (eles são fixos; sua pergunta só precisa combinar com eles).
- Itens "text" pedem resposta aberta — termine de um jeito que convide a descrever.
- Se for o começo da conversa (nada respondido ainda), escreva também um \`ack\`: 1-2 frases reagindo ESPECIFICAMENTE à necessidade, conectando no ângulo de automação. Não prometa nada nem cite ferramenta de mercado. Fora do começo, omita o ack.
- Responda SÓ chamando a tool present_step.`;

export const STEP_TOOL = {
  name: "present_step",
  description:
    "Apresenta o próximo lote de perguntas (frasear os itens recebidos) e, no começo, o ack. Sempre chame esta tool.",
  input_schema: {
    type: "object" as const,
    required: ["questions"],
    properties: {
      ack: {
        type: "string",
        description:
          "Só no começo (nada respondido): 1-2 frases reagindo à necessidade do lead, na voz do Levi.",
      },
      questions: {
        type: "array",
        description: "Uma entrada por item recebido, na MESMA ordem.",
        items: {
          type: "object",
          required: ["item_id", "prompt"],
          properties: {
            item_id: {
              type: "string",
              description: "O item_id recebido, ecoado de volta.",
            },
            prompt: {
              type: "string",
              description: "A pergunta conversacional na voz do Levi.",
            },
          },
        },
      },
    },
  },
};

export function buildStepUserMessage(input: {
  need: string;
  collected: DiscoveryCollectedForExtract;
  batch: StepBatchItem[];
}): string {
  const answered = input.collected.length
    ? input.collected.map((c) => `- ${c.question}\n  → ${c.answer}`).join("\n")
    : "(nada respondido ainda — este é o começo)";
  const items = input.batch
    .map((b) => {
      const opts =
        b.chips && b.chips.length
          ? ` | chips: ${b.chips.join(" | ")}`
          : " | resposta aberta";
      return `- item_id: ${b.item_id} (${b.kind})${opts}\n  capturar: ${b.captures}`;
    })
    .join("\n");
  return `O que o lead precisa:
${input.need}

Já respondido:
${answered}

Próximos itens a perguntar (frase um prompt pra cada, ecoando o item_id):
${items}`;
}

// -----------------------------------------------------------------------------
// ACK (Haiku, streaming) — reação a uma resposta aberta
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
// EXTRACT + recap (Sonnet) — fim da descoberta
// -----------------------------------------------------------------------------
export const EXTRACT_SYSTEM = `${VOICE}

A descoberta terminou. Com base na necessidade e nas respostas, faça duas coisas via tool save_descoberta:
1. Extraia os dados estruturados que VOCÊ precisa pra cravar viabilidade técnica e desenhar a solução depois — incluindo os forks de viabilidade (conexão do ERP, API liberada, certificado A1/A3, 2FA, ambiente de execução), o dimensionamento (volume transacional, variação) e o de fechamento (decisor, modelo de cobrança).
2. Escreva um \`recap\` PRO LEAD em tom de DIAGNÓSTICO: 2 a 4 frases, começando com algo como "Pelo que você me contou:", apontando o gargalo principal (onde ele mais perde tempo) e o que dá pra automatizar primeiro. Termine dizendo que você vai organizar isso e te chamar no WhatsApp com os próximos passos. NÃO use as palavras "proposta", "orçamento", "call" nem "reunião" — é um diagnóstico, não um pitch. Voz Levi, direto, sem vender.

REGRAS:
- Não invente dado que o lead não deu. Campo sem info → omita ou deixe curto.
- Não cite ferramenta de mercado (n8n, Make, Zapier, ChatGPT) no recap.
- \`escopo_sugerido\`: 2 a 4 itens objetivos do que automatizar, na ordem que faz sentido.
- \`detalhes_tecnicos\`: os specifics que decidem o caminho técnico (formato do extrato, tipos de doc, versão/conexão do ERP, qual portal, origem das NFs, certificado, 2FA). Liste os que o lead deu.
- \`perguntas_em_aberto\`: o que ainda falta saber pra fechar o escopo — priorize os específicos técnicos decisivos. Pode ser vazio (a pauta de confirmação técnica é montada à parte pelo sistema).`;

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
              "Modalidade do ERP (ex.: Domínio Desktop, Onvio/Web). Define RPA vs API.",
          },
          api_acesso: {
            type: "string",
            description: "Se a API está liberada no contrato + tem credencial (ERP web).",
          },
          onde_arquivos: { type: "string" },
          portal_entrada: {
            type: "string",
            description: "Qual portal de ENTRADA dos documentos (Onvio/próprio/outro).",
          },
          portal_destino: {
            type: "string",
            description: "Sistema específico de entrega pro cliente (Onvio, portal próprio, etc).",
          },
          canais: { type: "array", items: { type: "string" } },
          certificado: {
            type: "string",
            description: "Certificado digital A1 (arquivo) vs A3 (token), de quem, onde.",
          },
          seguranca: {
            type: "string",
            description: "2FA/MFA/captcha nos sistemas a operar.",
          },
          ambiente_execucao: {
            type: "string",
            description: "Máquina/servidor pra hospedar RPA local (ERP desktop).",
          },
        },
      },
      volume_clientes: { type: "string", description: "Nº de clientes ativos." },
      volume_transacional: {
        type: "string",
        description: "Volume/mês de notas/guias/documentos — o que dimensiona o esforço.",
      },
      variacao: {
        type: "string",
        description: "Cardinalidade da variação (quantos bancos/layouts/tipos distintos).",
      },
      qualidade: {
        type: "string",
        description: "Régua de qualidade tolerável (% manual vs 100% automático).",
      },
      processo_atual: {
        type: "string",
        description: "Resumo de como o processo da dor funciona hoje.",
      },
      time: { type: "string" },
      tentativas_anteriores: { type: "string" },
      gatilho: { type: "string", description: "Por que resolver agora (urgência real)." },
      prazo: { type: "string" },
      decisor: {
        type: "string",
        description: "Quem decide/assina o investimento (dono vs funcionário).",
      },
      modelo_cobranca: {
        type: "string",
        description: "Projeto único vs mensalidade/serviço contínuo.",
      },
      detalhes_tecnicos: {
        type: "array",
        items: { type: "string" },
        description:
          "Specifics que decidem o caminho técnico (formato, conexão do ERP, portal, origem das NFs, certificado, 2FA). Liste os que o lead deu.",
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
          "Mensagem pro lead em tom de diagnóstico: 2-4 frases apontando o gargalo principal + o que automatizar primeiro + aviso de próximos passos no WhatsApp. Sem 'proposta', 'orçamento', 'call' ou 'reunião'.",
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
