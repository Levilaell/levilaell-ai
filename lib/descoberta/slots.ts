// =============================================================================
// Descoberta — vocabulário de slots (info que a proposta precisa)
// =============================================================================
// O form de descoberta substitui a call de descoberta. A IA (Haiku) monta um
// conjunto de perguntas SOB MEDIDA pra dor que o lead descreve, escolhendo
// keys desse vocabulário. O cliente caminha esse plano de forma instantânea
// (chips com ack canned) e só pede ack streamado da IA nas perguntas "text".
//
// Este arquivo é PURO (sem import de server). É a fonte de verdade
// compartilhada entre: prompt da IA, UI do cliente, fallback estático e
// extração final. Mantém os `key` estáveis — a extração mapeia answers→proposta
// por esses keys.
// =============================================================================

export type QuestionKind = "single" | "multi" | "text";

/**
 * Uma pergunta da descoberta. A IA gera `prompt` (frase conversacional) e
 * escolhe `key` do vocabulário + `kind`/`chips`/`placeholder`. O fallback
 * estático usa os mesmos campos.
 */
export type DiscoveryQuestion = {
  /** Slot do vocabulário (ou "custom" quando a IA cria algo fora da lista). */
  key: string;
  /** Texto conversacional da pergunta, na voz do Levi. */
  prompt: string;
  kind: QuestionKind;
  /** Opções pra single/multi. */
  chips?: string[];
  /** Placeholder pra text. */
  placeholder?: string;
};

/** Um turno do transcript (display + extração). */
export type DiscoveryTurn = {
  role: "ai" | "user";
  text: string;
  /** Em turnos "user", o key da pergunta respondida (pra extração). */
  key?: string;
};

// -----------------------------------------------------------------------------
// Vocabulário — descrito pra IA saber QUANDO usar cada slot e o que ele captura.
// -----------------------------------------------------------------------------
export type SlotSpec = {
  key: string;
  /** O que esse slot captura — vai pro prompt da IA. */
  captures: string;
  kind: QuestionKind;
  chips?: string[];
  placeholder?: string;
};

export const DISCOVERY_SLOTS: SlotSpec[] = [
  {
    key: "segmento",
    captures:
      "que tipo de escritório/serviço é (contábil geral, fiscal, departamento pessoal, BPO financeiro). Pular se a necessidade já deixa claro.",
    kind: "single",
    chips: [
      "Contábil geral",
      "Fiscal / tributário",
      "Departamento pessoal",
      "BPO financeiro",
      "Outro",
    ],
  },
  {
    key: "erp",
    captures:
      "qual ERP/sistema principal usam (onde lançam e geram obrigações). Crítico pra proposta — integração depende disso.",
    kind: "single",
    chips: [
      "Domínio",
      "Onvio",
      "Alterdata",
      "Sage",
      "Contmatic",
      "MasterMaq",
      "Planilha / sistema próprio",
      "Outro",
    ],
  },
  {
    key: "erp_conexao",
    captures:
      "versão/conexão do ERP quando ele já foi citado (ex.: Domínio Desktop instalado vs Onvio/Domínio Web vs versão antiga). DEFINE viabilidade e custo — RPA local vs API oficial vs scraping. SEMPRE pergunte quando um ERP é citado; não trate 'citou o ERP' como resolvido.",
    kind: "single",
    chips: [
      "Domínio Desktop (instalado)",
      "Onvio / Domínio Web",
      "Versão antiga / não sei",
      "Outro ERP",
    ],
  },
  {
    key: "arquivos",
    captures:
      "onde guardam os arquivos dos clientes hoje (Drive, OneDrive, servidor local, no ERP, WhatsApp/email). Use pra dores de triagem/entrada. Define de onde a automação lê/escreve.",
    kind: "single",
    chips: [
      "Google Drive",
      "OneDrive / SharePoint",
      "Servidor local",
      "No próprio ERP",
      "WhatsApp / email mesmo",
      "Outro",
    ],
  },
  {
    key: "destino",
    captures:
      "quando a dor é ENTREGAR algo pro cliente: por onde/qual sistema ele recebe HOJE, especificamente. CRÍTICO: se já usa portal nativo (Onvio), a entrega às vezes JÁ é automática — descobrir cedo evita propor o que já existe. Não aceite 'portal' genérico: pergunte QUAL.",
    kind: "single",
    chips: [
      "Onvio Portal",
      "Portal próprio do escritório",
      "Email",
      "WhatsApp",
      "Drive / pasta compartilhada",
      "Outro",
    ],
  },
  {
    key: "especifico",
    captures:
      "o detalhe técnico que DECIDE viabilidade/custo pra ESSA dor específica — o equivalente à 'versão do ERP', mas que muda conforme o tipo de automação. Ex.: conciliação → formato do extrato (OFX/CSV/PDF digital/escaneado) define API vs OCR; triagem → quais tipos de documento e o que rotear com cada; lançamento de NF → origem das notas (XML/SEFAZ/email). Use chips quando houver opções claras; senão, text. SEMPRE inclua quando a dor tiver um fork técnico desses.",
    kind: "text",
    placeholder: "Ex: os extratos vêm em PDF escaneado, alguns bancos mandam OFX.",
  },
  {
    key: "canais",
    captures:
      "por quais canais os documentos chegam dos clientes (pode ser mais de um). Define onde entra a triagem.",
    kind: "multi",
    chips: [
      "Email",
      "WhatsApp",
      "Portal do cliente",
      "Cliente traz físico",
      "Direto do banco / órgão",
      "Outro",
    ],
  },
  {
    key: "volume",
    captures:
      "volume real: nº de clientes ATIVOS e, quando fizer sentido, quantos itens/guias/docs por cliente por mês (guias/mês ≠ clientes — 1 cliente pode ter várias). Dimensiona ganho e complexidade. Inclua a pergunta de itens/cliente no prompt quando a dor for de volume repetitivo.",
    kind: "single",
    chips: [
      "Até 30 clientes",
      "30 a 100",
      "100 a 250",
      "250 a 500",
      "Mais de 500",
    ],
  },
  {
    key: "processo",
    captures:
      "como o processo da dor citada funciona HOJE, passo a passo, com as ferramentas e quem faz. Resposta aberta — é a info mais rica pra desenhar a proposta. SEMPRE incluir.",
    kind: "text",
    placeholder:
      "Ex: o cliente manda no WhatsApp, alguém baixa, renomeia e joga numa pasta por competência...",
  },
  {
    key: "time",
    captures:
      "tamanho do time e quem tocaria/operaria a automação. Define handoff e treinamento.",
    kind: "single",
    chips: ["Só eu", "2 a 3 pessoas", "4 a 10", "Mais de 10"],
  },
  {
    key: "criterio",
    captures:
      "opcional, baixa prioridade: o que muda na rotina/semana dele se isso rodar (métrica de sucesso + ângulo de valor pra proposta). Inclua só se sobrar espaço e a dor não tiver deixado o impacto óbvio.",
    kind: "text",
    placeholder:
      "Ex: paro de correr atrás de guia atrasada e consigo pegar mais cliente sem contratar.",
  },
  {
    key: "tentativas",
    captures:
      "se já tentaram automatizar antes e o que aconteceu. Evita repetir erro e calibra expectativa.",
    kind: "single",
    chips: [
      "Nunca tentamos",
      "SaaS pronto, não rolou",
      "Freelancer, ficou frágil",
      "Temos automações pontuais",
      "Quero conversar sobre isso",
    ],
  },
  {
    key: "prazo",
    captures:
      "em que prazo querem algo rodando. SEMPRE incluir — qualifica urgência. Mapeia pra urgência do lead.",
    kind: "single",
    chips: [
      "Pra ontem 🔥",
      "Próximo mês ⚡",
      "Próximos 3 meses 📅",
      "Sem urgência, explorando 🌱",
    ],
  },
];

export type SlotKey = (typeof DISCOVERY_SLOTS)[number]["key"];

export const SLOT_KEYS: readonly string[] = DISCOVERY_SLOTS.map((s) => s.key);

// -----------------------------------------------------------------------------
// Fallback estático — usado quando a IA do /plan falha. Mantém o lead no fluxo.
// Sequência enxuta que serve pra qualquer dor contábil.
// -----------------------------------------------------------------------------
function slotChips(key: string): string[] {
  return [...(DISCOVERY_SLOTS.find((s) => s.key === key)?.chips ?? [])];
}

export const FALLBACK_QUESTIONS: DiscoveryQuestion[] = [
  {
    key: "erp_conexao",
    prompt: "Qual sistema/ERP vocês usam de base — e qual versão (instalado no PC, web/nuvem)?",
    kind: "single",
    chips: slotChips("erp_conexao"),
  },
  {
    key: "destino",
    prompt: "Hoje, por onde isso chega/sai pro cliente? Qual sistema especificamente?",
    kind: "single",
    chips: slotChips("destino"),
  },
  {
    key: "volume",
    prompt: "Pra eu dimensionar — quantos clientes ativos? (e, se souber, quantos por cliente/mês)",
    kind: "single",
    chips: slotChips("volume"),
  },
  {
    key: "processo",
    prompt: "Me conta como isso funciona hoje no dia a dia — passo a passo, e quem toca nisso.",
    kind: "text",
    placeholder: DISCOVERY_SLOTS.find((s) => s.key === "processo")?.placeholder,
  },
  {
    key: "tentativas",
    prompt: "Já tentaram automatizar isso de alguma forma? O que aconteceu?",
    kind: "single",
    chips: slotChips("tentativas"),
  },
  {
    key: "prazo",
    prompt: "Por último: em que prazo você quer ter isso rodando?",
    kind: "single",
    chips: slotChips("prazo"),
  },
];

// -----------------------------------------------------------------------------
// Acks canned — reação instantânea após resposta de chip (sem chamar a IA).
// Voz do Levi: PT-BR informal, curta, sem babação. Específica por valor quando
// dá; genérica por slot como fallback. Cada slot aparece 1x por sessão, então
// uma linha por chave já não soa repetitivo.
// -----------------------------------------------------------------------------
const ACK_BY_VALUE: Record<string, string> = {
  // ERP
  "erp:Domínio": "Domínio, beleza. Sistema robusto — dá pra integrar bem.",
  "erp:Onvio": "Onvio, tranquilo. Já mexi com a estrutura deles.",
  "erp:Alterdata": "Alterdata, certo. Conheço o fluxo.",
  "erp:Planilha / sistema próprio":
    "Planilha/sistema próprio — clássico. Tem muita dor pra tirar daí.",
  // Conexão do ERP — define o caminho técnico (RPA vs API)
  "erp_conexao:Domínio Desktop (instalado)":
    "Desktop instalado, então é robô local, não API. Muda o caminho — anotado.",
  "erp_conexao:Onvio / Domínio Web":
    "Onvio/Web — boa, dá pra ir de API oficial. Bem mais limpo e estável.",
  "erp_conexao:Versão antiga / não sei":
    "Sem problema — eu confirmo a versão na hora de desenhar.",
  // Destino — se for Onvio nativo, a oferta pode mudar
  "destino:Onvio Portal":
    "Onvio Portal — importante: às vezes ele já distribui guia sozinho. Vou checar se vale automatizar ou usar o que já tem.",
  "destino:Portal próprio do escritório":
    "Portal próprio, então integro direto nele. Anotado.",
  // Arquivos
  "arquivos:WhatsApp / email mesmo":
    "No WhatsApp/email mesmo, né. É exatamente onde documento some.",
  "arquivos:Servidor local": "Servidor local, entendi — dá pra trabalhar com isso.",
  "arquivos:Google Drive": "Drive, boa — facilita a parte de automação de arquivo.",
  // Volume
  "volume:Mais de 500": "Mais de 500 — aí o ganho de tirar trabalho manual é pesado.",
  "volume:Até 30 clientes": "Carteira enxuta, certo. Dá pra começar focado.",
  // Tentativas
  "tentativas:SaaS pronto, não rolou":
    "SaaS pronto que não escalou é o padrão. O problema raramente é a ferramenta.",
  "tentativas:Nunca tentamos": "Nunca tentaram — melhor, sem vício de processo quebrado.",
  // Prazo
  "prazo:Pra ontem 🔥": "Pra ontem, entendi. Urgência muda a ordem das coisas.",
  "prazo:Sem urgência, explorando 🌱":
    "Sem urgência, tranquilo — dá pra desenhar com calma.",
};

const ACK_BY_SLOT: Record<string, string> = {
  segmento: "Saquei o perfil.",
  erp: "Anotado.",
  erp_conexao: "Anotado — isso define o caminho técnico.",
  especifico: "Boa — esse detalhe muda o caminho técnico. Anotado.",
  arquivos: "Beleza, já sei de onde a coisa sai.",
  destino: "Certo, sei onde a entrega cai.",
  canais: "Certo, é por aí que entra documento.",
  volume: "Boa, isso me dá a escala.",
  time: "Entendi o time.",
  criterio: "Boa — isso ajuda a vender o valor certo.",
  tentativas: "Valeu por contar — isso ajuda a calibrar.",
  prazo: "Fechou.",
};

/**
 * Ack instantâneo pra resposta de chip. Não chama IA — é a reação imediata
 * que mantém a sensação de conversa sem custo de latência.
 */
export function cannedAck(key: string, value: string): string {
  return ACK_BY_VALUE[`${key}:${value}`] ?? ACK_BY_SLOT[key] ?? "Anotado.";
}

// -----------------------------------------------------------------------------
// Mapeamento prazo (chip) → urgência do scheduling_requests.
// -----------------------------------------------------------------------------
export function prazoToUrgency(
  answer: string | undefined,
): "this_week" | "next_month" | "researching" {
  if (!answer) return "next_month";
  if (answer.includes("ontem")) return "this_week";
  if (answer.includes("Sem urgência") || answer.includes("explorando"))
    return "researching";
  if (answer.includes("3 meses")) return "researching";
  return "next_month";
}

// Placeholders do Q0 — exemplos que ditam o tom (dores reais, específicas).
export const Q0_PLACEHOLDERS: string[] = [
  "Coleta automática de guias no Domínio e envio pro cliente",
  "Triagem de documentos que chegam por email/WhatsApp",
  "Cobrança automática de documento que falta no fechamento",
  "Geração e envio dos relatórios mensais",
];

export const Q0_PROMPT = "O que você precisa automatizar no seu escritório?";

// Limite de perguntas que a IA pode planejar (UX + custo). 7 dá espaço pros
// drills técnicos decisivos (versão do ERP, qual portal) sem virar formulário.
export const MAX_PLAN_QUESTIONS = 7;
export const MIN_PLAN_QUESTIONS = 3;
