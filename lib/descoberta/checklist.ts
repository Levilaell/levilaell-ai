// =============================================================================
// Descoberta — checklist de completude (o cérebro do "sem gaps")
// =============================================================================
// O motor de descoberta deixou de ser um plano fixo one-shot e virou um LOOP que
// preenche este checklist até não sobrar item REQUERIDO em aberto.
//
// Princípios (o que torna "sem gaps" confiável, não uma aposta na IA):
//   1. Terminação DETERMINÍSTICA — quem decide que acabou é o código (não a IA
//      dizendo "completo"). A IA só frase a pergunta, reconcilia resposta solta
//      e julga vagueza.
//   2. Ativação condicional por REGRA — "citou portal → pergunte qual portal",
//      "ERP web → pergunte se a API está liberada", "dor fiscal → certificado".
//      São regras de código (`activate`), não memória da IA.
//   3. Piso determinístico — todo item requerido tem um `defaultPrompt`; se a IA
//      falhar em frasear, o motor ainda pergunta. A IA enriquece, não habilita.
//
// Este arquivo é PURO (sem import de server) — é testável isolado e roda igual
// no client e no server. Fonte de verdade do QUE precisa ser sabido pra cravar
// viabilidade técnica + montar proposta sem call de descoberta.
// =============================================================================
import {
  DISCOVERY_SLOTS,
  type DiscoveryQuestion,
  type QuestionKind,
} from "@/lib/descoberta/slots";

// -----------------------------------------------------------------------------
// Tipos
// -----------------------------------------------------------------------------
export type ItemStatus =
  | "open" // requerido e ainda sem resposta substantiva
  | "answered" // respondido (chip ou texto que a IA julgou suficiente)
  | "na_by_rule" // não se aplica a esta dor (regra de ativação = false)
  | "needs_confirmation"; // perguntado, mas o lead não soube → vai pra confirmação técnica

/**
 * Quem consegue responder. `needs_confirmation` marca os forks que o contador
 * frequentemente NÃO sabe de cabeça (API liberada no contrato, A1 vs A3, 2FA):
 * a gente pergunta, mas se vier "não sei" o item cai na pauta de confirmação
 * técnica em vez de bloquear o fluxo.
 */
export type AnswerableBy = "lead" | "needs_confirmation";

/** Contexto pra avaliar as regras de ativação: a dor + o que já foi respondido. */
export type ActivationCtx = {
  needLower: string;
  painsLower: string[];
  /** Respostas agrupadas por key de slot (multi/repetidas viram array). */
  answersByKey: Record<string, string[]>;
};

export type ChecklistItem = {
  /** Id estável do item (≠ slot quando dois itens usam o mesmo tipo de slot). */
  id: string;
  /** Slot de DISCOVERY_SLOTS que define kind/chips/placeholder. */
  slot: string;
  /** Resumo do que o item fecha — vai pro prompt da IA e pra pauta de pendências. */
  captures: string;
  answerable: AnswerableBy;
  /** Pergunta-piso na voz do Levi (usada se a IA não frasear). */
  defaultPrompt: string;
  /** REGRA determinística: este item é requerido nesta descoberta? */
  activate: (ctx: ActivationCtx) => boolean;
};

// -----------------------------------------------------------------------------
// Matchers de domínio (regras de ativação)
// -----------------------------------------------------------------------------
const ALWAYS = (): boolean => true;

const RE = {
  // dor de ENTRADA de documento (triagem, cobrança, recebimento, lançamento)
  entrada:
    /triagem|document|recebe|entrada|cobran|\bnotas?\b|\bnf\b|escritura|lançament|lancament/,
  // dor de ENTREGA pro cliente (guias, relatórios, distribuição)
  entrega: /entreg|envi|\bguia|relat[óo]rio|distribu|sa[íi]da/,
  // dor com fork técnico de formato/origem (casa singular/plural: nota(s), fiscal/fiscais)
  fork: /\bnotas?\b|\bnf\b|lançament|lancament|concilia|extrato|triagem|document|fisca(l|is)|\bguia/,
  // operação fiscal (exige certificado digital) — casa "nota(s) fiscal/fiscais", plurais.
  // NÃO inclui \bdas\b: em texto livre lowercased casaria a preposição "das"
  // ("relatório das despesas") e dispararia certificado/2FA em dor não-fiscal.
  // A guia DAS cai em \bguia/imposto/obrigaç na prática.
  fiscal:
    /nfe|nf-?e|notas? fisca(l|is)|\bguia|e-?cac|sefaz|obrigaç|obrigac|imposto|fisca(l|is)|\bsped\b|\bdctf\b/,
  // operação que mexe com banco (conciliação)
  banco: /concilia|extrato|banc[áa]rio|\bbanco/,
  // triagem real — só /triagem/ pra não casar "cobrança de documentos" por "document"
  triagem: /triagem/,
  // atendimento ao cliente (responder dúvidas) e onboarding de cliente novo —
  // dores selecionáveis que também têm fork técnico de viabilidade.
  atendimento: /atendiment|d[úu]vida|suporte|responder.*client/,
  onboarding: /onboarding|clientes? novos?|cadastr|implantaç|implantac/,
  // modalidade do ERP
  desktop: /desktop|instalad/,
  web: /\bweb\b|onvio|nuvem|cloud|online/,
  portal: /portal/,
  // ERP "de verdade" nomeado (≠ planilha/próprio/não sei)
  notRealErp: /planilha|pr[óo]prio|nenhum|n[ãa]o sei|n[ãa]o tem/,
};

function painHits(ctx: ActivationCtx, re: RegExp): boolean {
  return re.test(ctx.needLower) || ctx.painsLower.some((p) => re.test(p));
}
function answerHits(ctx: ActivationCtx, key: string, re: RegExp): boolean {
  return (ctx.answersByKey[key] ?? []).some((a) => re.test(a.toLowerCase()));
}
function isAnswered(ctx: ActivationCtx, key: string): boolean {
  return (ctx.answersByKey[key] ?? []).some((a) => a.trim().length > 0);
}
function erpIsNamed(ctx: ActivationCtx): boolean {
  return (
    isAnswered(ctx, "erp") &&
    !answerHits(ctx, "erp", RE.notRealErp) &&
    !painHits(ctx, RE.notRealErp)
  );
}

// -----------------------------------------------------------------------------
// O checklist — ordem aproximada de pergunta (chips antes; processo/abertas no
// meio; dimensionamento e fechamento ao fim). A ativação condicional faz os
// drills reativos (qual portal, conexão, certificado) surgirem na hora certa.
// -----------------------------------------------------------------------------
export const CHECKLIST: ChecklistItem[] = [
  // -- Sistemas & viabilidade técnica -----------------------------------------
  {
    id: "erp",
    slot: "erp",
    captures: "qual ERP/sistema o processo usa hoje",
    answerable: "lead",
    defaultPrompt: "Qual ERP ou sistema vocês usam de base?",
    activate: ALWAYS,
  },
  {
    id: "erp_conexao",
    slot: "erp_conexao",
    captures: "modalidade do ERP — Desktop instalado vs Web/nuvem (RPA vs API)",
    answerable: "lead",
    defaultPrompt:
      "Esse sistema é instalado na máquina (desktop) ou vocês acessam pela web/nuvem?",
    activate: (c) => erpIsNamed(c),
  },
  {
    id: "api_acesso",
    slot: "api_acesso",
    captures: "API liberada no contrato + credencial (decide API vs RPA no web)",
    answerable: "needs_confirmation",
    defaultPrompt:
      "Nesse sistema web, vocês sabem se têm API liberada no contrato/plano (com login de API)?",
    activate: (c) => answerHits(c, "erp_conexao", RE.web),
  },
  {
    id: "ambiente",
    slot: "ambiente",
    captures: "máquina/servidor ligado pra hospedar RPA local (ERP desktop)",
    answerable: "lead",
    defaultPrompt:
      "Pra rodar com o sistema desktop: tem uma máquina ou servidor que fica ligado, ou seria no PC de alguém?",
    activate: (c) => answerHits(c, "erp_conexao", RE.desktop),
  },
  {
    id: "canais",
    slot: "canais",
    captures: "canais de entrada dos documentos/demandas",
    answerable: "lead",
    defaultPrompt: "Por quais canais os documentos ou pedidos chegam dos clientes hoje?",
    activate: (c) =>
      painHits(c, RE.entrada) ||
      painHits(c, RE.atendimento) ||
      painHits(c, RE.onboarding),
  },
  {
    id: "portal_entrada",
    slot: "portal_entrada",
    captures: "QUAL portal de entrada (Onvio nativo / próprio / outro)",
    answerable: "lead",
    defaultPrompt:
      "Esse portal por onde chega documento é qual — Onvio Portal, um portal próprio do escritório, ou outro?",
    activate: (c) => answerHits(c, "canais", RE.portal),
  },
  {
    id: "arquivos",
    slot: "arquivos",
    captures: "onde os arquivos dos clientes vivem hoje",
    answerable: "lead",
    defaultPrompt: "Hoje, onde tu guarda os arquivos dos clientes?",
    activate: (c) => painHits(c, RE.entrada) || painHits(c, RE.onboarding),
  },
  {
    id: "destino",
    slot: "destino",
    captures: "qual sistema específico de entrega pro cliente",
    answerable: "lead",
    defaultPrompt:
      "Por onde isso chega/sai pro cliente hoje? Qual sistema, especificamente?",
    activate: (c) => painHits(c, RE.entrega),
  },
  {
    id: "formato",
    slot: "especifico",
    captures:
      "o detalhe técnico que decide viabilidade pra ESSA dor — formato/origem dos documentos (XML vs PDF, OFX vs escaneado), origem dos dados, ou o que muda de um caso pro outro",
    answerable: "lead",
    defaultPrompt:
      "Qual é o detalhe técnico que mais pesa nessa rotina — o formato dos documentos/dados, de onde eles vêm, ou o que muda de um caso pro outro?",
    activate: (c) =>
      painHits(c, RE.fork) ||
      painHits(c, RE.atendimento) ||
      painHits(c, RE.onboarding),
  },
  {
    id: "variacao",
    slot: "variacao",
    captures: "cardinalidade da variação (quantos bancos/layouts/tipos distintos)",
    answerable: "lead",
    defaultPrompt:
      "Quantas fontes/formatos diferentes entram nisso — quantos bancos, tipos de documento ou layouts distintos?",
    activate: (c) => painHits(c, RE.banco) || painHits(c, RE.triagem),
  },
  {
    id: "certificado",
    slot: "certificado",
    captures: "certificado digital A1 vs A3 (viabilidade da operação fiscal)",
    answerable: "lead",
    defaultPrompt:
      "Pra parte fiscal (incl. procuração/e-CAC no onboarding): o certificado digital é A1 (arquivo) ou A3 (token/cartão)?",
    activate: (c) => painHits(c, RE.fiscal) || painHits(c, RE.onboarding),
  },
  {
    id: "seguranca",
    slot: "seguranca",
    captures: "2FA/MFA/captcha nos sistemas que o robô vai operar",
    answerable: "needs_confirmation",
    defaultPrompt:
      "Os sistemas que a automação vai acessar pedem código no celular (2FA) ou captcha pra entrar?",
    activate: (c) =>
      answerHits(c, "erp_conexao", RE.web) ||
      painHits(c, RE.fiscal) ||
      painHits(c, RE.banco) ||
      answerHits(c, "canais", RE.portal),
  },

  // -- Processo ---------------------------------------------------------------
  {
    id: "processo",
    slot: "processo",
    captures: "como o processo da dor funciona hoje, passo a passo, quem faz",
    answerable: "lead",
    defaultPrompt:
      "Me conta como isso funciona hoje, passo a passo — quem faz cada etapa e onde trava.",
    activate: ALWAYS,
  },

  // -- Dimensionamento --------------------------------------------------------
  {
    id: "volume_tx",
    slot: "volume_tx",
    captures: "volume transacional/mês (notas/guias/docs) — não nº de clientes",
    answerable: "lead",
    defaultPrompt:
      "Qual o volume por mês do que vamos automatizar — quantas notas/guias/documentos?",
    activate: ALWAYS,
  },
  {
    id: "clientes",
    slot: "volume",
    captures: "nº de clientes ativos (contexto de escala)",
    answerable: "lead",
    defaultPrompt: "Quantos clientes ativos vocês têm?",
    activate: ALWAYS,
  },
  {
    id: "qualidade",
    slot: "qualidade",
    captures: "régua de qualidade tolerável (% manual vs 100% automático)",
    answerable: "lead",
    defaultPrompt:
      "Dá pra ter uma parte caindo pra revisão manual, ou precisa ser quase tudo automático?",
    activate: ALWAYS,
  },

  // -- Contexto ---------------------------------------------------------------
  {
    id: "tentativas",
    slot: "tentativas",
    captures: "tentativas anteriores de automatizar e o que aconteceu",
    answerable: "lead",
    defaultPrompt: "Já tentaram automatizar isso antes? Como foi?",
    activate: ALWAYS,
  },
  {
    id: "time",
    slot: "time",
    captures: "tamanho do time e quem operaria a automação",
    answerable: "lead",
    defaultPrompt: "Quantas pessoas tocam esse fluxo hoje?",
    activate: ALWAYS,
  },
  {
    id: "gatilho",
    slot: "gatilho",
    captures: "por que resolver agora (gatilho de urgência real)",
    answerable: "lead",
    defaultPrompt: "Por que resolver isso agora — aconteceu alguma coisa?",
    activate: ALWAYS,
  },
  {
    id: "criterio",
    slot: "criterio",
    captures: "critério de sucesso / ROI (o que muda na rotina se rodar)",
    answerable: "lead",
    defaultPrompt: "O que muda na sua semana se isso rodar sozinho?",
    activate: ALWAYS,
  },
  {
    id: "prazo",
    slot: "prazo",
    captures: "prazo desejado pra ter algo rodando",
    answerable: "lead",
    defaultPrompt: "Em que prazo vocês querem isso rodando?",
    activate: ALWAYS,
  },

  // -- Proposta & fechamento --------------------------------------------------
  {
    id: "decisor",
    slot: "decisor",
    captures: "quem decide/assina o investimento",
    answerable: "lead",
    defaultPrompt: "Quem decide um investimento desse tipo aí — é você ou tem mais alguém?",
    activate: ALWAYS,
  },
  {
    id: "cobranca",
    slot: "cobranca",
    captures: "modelo de cobrança esperado (projeto único vs mensalidade)",
    answerable: "lead",
    defaultPrompt:
      "Você imagina isso como um projeto único ou um serviço com mensalidade?",
    activate: ALWAYS,
  },
];

// -----------------------------------------------------------------------------
// Sanidade — todo item aponta pra um slot real (pega typo no build/teste, não em
// produção silenciosamente).
// -----------------------------------------------------------------------------
const SLOT_BY_KEY = new Map(DISCOVERY_SLOTS.map((s) => [s.key, s]));
for (const item of CHECKLIST) {
  if (!SLOT_BY_KEY.has(item.slot)) {
    throw new Error(
      `[checklist] item '${item.id}' aponta pro slot inexistente '${item.slot}'`,
    );
  }
}

// -----------------------------------------------------------------------------
// API do checklist
// -----------------------------------------------------------------------------
export type CollectedAnswer = { key: string; question: string; answer: string };

export function buildActivationCtx(input: {
  need: string;
  pains?: string[];
  collected: CollectedAnswer[];
}): ActivationCtx {
  const answersByKey: Record<string, string[]> = {};
  for (const c of input.collected) {
    (answersByKey[c.key] ??= []).push(c.answer);
  }
  return {
    needLower: input.need.toLowerCase(),
    painsLower: (input.pains ?? []).map((p) => p.toLowerCase()),
    answersByKey,
  };
}

/** Quantas vezes um slot já foi PERGUNTADO (conta tentativas pra cap de clarifier). */
export function attemptsByKey(collected: CollectedAnswer[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of collected) out[c.key] = (out[c.key] ?? 0) + 1;
  return out;
}

/**
 * Itens REQUERIDOS, ainda EM ABERTO. Um item está aberto quando: ativado pela
 * regra, sem resposta substantiva no slot, não marcado como satisfeito pela IA,
 * e ainda dentro do cap de tentativas. Esta é a fonte determinística da
 * terminação: loop acaba quando esta lista esvazia.
 */
export function openRequiredItems(
  ctx: ActivationCtx,
  opts: {
    satisfiedIds?: Set<string>;
    attempts?: Record<string, number>;
    maxAttempts?: number;
  } = {},
): ChecklistItem[] {
  const { satisfiedIds, attempts, maxAttempts = 2 } = opts;
  return CHECKLIST.filter((item) => {
    if (!item.activate(ctx)) return false;
    if (satisfiedIds?.has(item.id)) return false;
    if (isAnswered(ctx, item.slot)) return false;
    if (attempts && (attempts[item.slot] ?? 0) >= maxAttempts) return false;
    return true;
  });
}

/**
 * Itens ativados que ficaram SEM resposta substantiva mesmo após o loop —
 * a pauta de confirmação técnica (os `needs_confirmation` que o lead não soube,
 * + qualquer item que estourou o cap de tentativas).
 */
export function pendingConfirmationItems(
  ctx: ActivationCtx,
  opts: { attempts?: Record<string, number> } = {},
): ChecklistItem[] {
  const { attempts } = opts;
  const vague = /n[ãa]o sei|nao sei|n[ãa]o tenho certeza|talvez|acho que/;
  return CHECKLIST.filter((item) => {
    if (!item.activate(ctx)) return false;
    const answers = ctx.answersByKey[item.slot] ?? [];
    const hasSubstantive = answers.some(
      (a) => a.trim().length > 0 && !vague.test(a.toLowerCase()),
    );
    if (hasSubstantive) return false;
    // sem resposta boa: é pendência se já foi perguntado (cap) ou é fork que o
    // lead tipicamente não sabe
    const asked = (attempts?.[item.slot] ?? 0) > 0;
    return asked || item.answerable === "needs_confirmation";
  });
}

/** Progresso pra barra: itens ATIVADOS (requeridos nesta dor) e quantos já respondidos. */
export function activationProgress(ctx: ActivationCtx): {
  answered: number;
  total: number;
} {
  const active = CHECKLIST.filter((i) => i.activate(ctx));
  const answered = active.filter((i) => isAnswered(ctx, i.slot)).length;
  return { answered, total: active.length };
}

/** Constrói a DiscoveryQuestion de um item (prompt da IA ou o piso defaultPrompt). */
export function questionForItem(
  item: ChecklistItem,
  prompt?: string,
): DiscoveryQuestion {
  const slot = SLOT_BY_KEY.get(item.slot);
  const kind: QuestionKind = slot?.kind ?? "text";
  return {
    key: item.slot,
    prompt: (prompt && prompt.trim()) || item.defaultPrompt,
    kind,
    chips: slot?.chips ? [...slot.chips] : undefined,
    placeholder: kind === "text" ? slot?.placeholder : undefined,
  };
}

export const ITEM_BY_ID = new Map(CHECKLIST.map((i) => [i.id, i]));
