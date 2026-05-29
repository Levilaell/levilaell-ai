/**
 * scripts/test-checklist.ts
 *
 * Testa o CÉREBRO determinístico da descoberta (lib/descoberta/checklist.ts) —
 * sem IA, sem HTTP, sem env. Simula o loop de preenchimento com respostas
 * canned e afirma, caso a caso, que:
 *   - o loop SEMPRE termina (sem item requerido em aberto);
 *   - todo item SEMPRE-requerido é coberto;
 *   - os drills condicionais disparam na hora certa (portal citado → qual portal,
 *     ERP nomeado → conexão, ERP web → API/2FA, ERP desktop → ambiente, dor
 *     fiscal → certificado, conciliação/triagem → variação);
 *   - os que não se aplicam NÃO são perguntados;
 *   - "não sei"/branco cai na pauta de confirmação técnica (pending) e mesmo
 *     assim o loop converge (cap de tentativas).
 *
 * Uso: npx tsx scripts/test-checklist.ts   (exit 1 se algum caso falhar)
 */
import {
  buildActivationCtx,
  attemptsByKey,
  openRequiredItems,
  pendingConfirmationItems,
  questionForItem,
  CHECKLIST,
  type CollectedAnswer,
} from "@/lib/descoberta/checklist";

// --- cores -------------------------------------------------------------------
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;

// Itens requeridos em TODA descoberta (independem da dor).
const ALWAYS_ITEMS = [
  "erp",
  "processo",
  "volume_tx",
  "clientes",
  "qualidade",
  "tentativas",
  "time",
  "gatilho",
  "criterio",
  "prazo",
  "decisor",
  "cobranca",
];

const MAX_ROUNDS = 14;

type Case = {
  name: string;
  need: string;
  pains?: string[];
  /** Resposta canned por slot (drives os condicionais). */
  answers?: Record<string, string>;
  /** Slots respondidos em BRANCO (testa cap de tentativas). */
  blankSlots?: string[];
  expectAsked?: string[]; // ids que DEVEM ser perguntados
  expectNotAsked?: string[]; // ids que NÃO podem ser perguntados
  expectPending?: string[]; // ids que devem cair na confirmação técnica
  expectNotPending?: string[];
};

function resolveAnswer(c: Case, slot: string): string {
  if (c.blankSlots?.includes(slot)) return "";
  if (c.answers && slot in c.answers) return c.answers[slot];
  return "respondido (ok)";
}

type SimResult = {
  asked: Set<string>;
  pending: string[];
  rounds: number;
  collected: CollectedAnswer[];
};

function simulate(c: Case): SimResult {
  const collected: CollectedAnswer[] = [];
  const asked = new Set<string>();
  let rounds = 0;

  for (;;) {
    if (rounds++ > MAX_ROUNDS) {
      throw new Error(`não terminou em ${MAX_ROUNDS} rounds`);
    }
    const ctx = buildActivationCtx({ need: c.need, pains: c.pains, collected });
    const attempts = attemptsByKey(collected);
    const open = openRequiredItems(ctx, { attempts });
    if (open.length === 0) break;
    for (const item of open) {
      asked.add(item.id);
      collected.push({
        key: item.slot,
        question: questionForItem(item).prompt,
        answer: resolveAnswer(c, item.slot),
      });
    }
  }

  const ctx = buildActivationCtx({ need: c.need, pains: c.pains, collected });
  const pending = pendingConfirmationItems(ctx, {
    attempts: attemptsByKey(collected),
  }).map((i) => i.id);
  return { asked, pending, rounds, collected };
}

// -----------------------------------------------------------------------------
// Casos — os 7 do diagnóstico empírico + edge cases pedidos.
// -----------------------------------------------------------------------------
const CASES: Case[] = [
  {
    name: "Triagem + cobrança, canal inclui PORTAL (o gap do print)",
    need: "Triagem de documentos recebidos (e-mail/WhatsApp), Cobrança de documentos com clientes",
    pains: ["Triagem de documentos", "Cobrança de documentos com clientes"],
    answers: {
      canais: "Email, Portal do cliente",
      erp: "Onvio",
      erp_conexao: "Onvio / Domínio Web",
    },
    expectAsked: ["canais", "portal_entrada", "arquivos", "formato", "erp", "erp_conexao", "variacao"],
    expectNotAsked: ["ambiente", "destino"],
  },
  {
    name: "Triagem + cobrança, SEM portal",
    need: "Triagem de documentos por email e whatsapp, cobrança do que falta",
    answers: { canais: "Email, WhatsApp", erp: "Domínio", erp_conexao: "Domínio Desktop (instalado)" },
    expectAsked: ["canais", "arquivos", "erp_conexao", "ambiente"],
    expectNotAsked: ["portal_entrada", "api_acesso", "destino"],
  },
  {
    name: "Lançamento de NF, ERP Onvio WEB (API + 2FA disparam)",
    need: "Triagem de NF pra lançamento e cobrança de documentos",
    answers: { erp: "Onvio", erp_conexao: "Onvio / Domínio Web", canais: "Email" },
    expectAsked: ["erp", "erp_conexao", "api_acesso", "seguranca", "formato"],
    expectNotAsked: ["ambiente", "portal_entrada"],
  },
  {
    name: "Lançamento de NF, ERP Domínio DESKTOP (ambiente dispara, API não)",
    need: "Triagem e lançamento de NF no Domínio, cobrança de documentos",
    answers: { erp: "Domínio", erp_conexao: "Domínio Desktop (instalado)", canais: "Email" },
    expectAsked: ["erp_conexao", "ambiente", "formato"],
    expectNotAsked: ["api_acesso", "portal_entrada"],
  },
  {
    name: "ERP é PLANILHA (não dispara conexão/ambiente/api)",
    need: "Triagem de documentos e lançamento numa planilha própria",
    answers: { erp: "Planilha / sistema próprio", canais: "Email" },
    expectAsked: ["erp", "canais", "formato"],
    expectNotAsked: ["erp_conexao", "api_acesso", "ambiente"],
  },
  {
    name: "Conciliação bancária (variação + 2FA; certificado NÃO)",
    need: "Conciliação bancária dos clientes todo mês",
    answers: { erp: "Domínio", erp_conexao: "Domínio Desktop (instalado)" },
    expectAsked: ["formato", "variacao", "seguranca", "ambiente"],
    expectNotAsked: ["certificado", "portal_entrada"],
  },
  {
    name: "Coleta/envio de GUIAS (fiscal: certificado + destino + 2FA)",
    need: "Coleta automática de guias no domínio e envio pro cliente",
    answers: { erp: "Domínio", erp_conexao: "Onvio / Domínio Web", destino: "Onvio Portal" },
    expectAsked: ["certificado", "destino", "seguranca", "formato", "api_acesso"],
    expectNotAsked: ["portal_entrada"],
  },
  {
    name: "Entrega de relatórios (destino sim; entrada não)",
    need: "Gerar e enviar relatórios mensais pros clientes",
    answers: { destino: "Email" },
    expectAsked: ["destino"],
    expectNotAsked: ["canais", "arquivos", "portal_entrada", "formato", "variacao"],
  },
  {
    name: "api_acesso = 'não sei' → vira pendência de confirmação técnica",
    need: "Lançamento de NF no Onvio",
    answers: { erp: "Onvio", erp_conexao: "Onvio / Domínio Web", api_acesso: "Não sei" },
    expectAsked: ["api_acesso"],
    expectPending: ["api_acesso"],
  },
  {
    name: "seguranca = 'não sei' → pendência; loop converge mesmo assim",
    need: "Conciliação bancária e coleta de guias",
    answers: { erp: "Onvio", erp_conexao: "Onvio / Domínio Web", seguranca: "Não sei" },
    expectAsked: ["seguranca"],
    expectPending: ["seguranca"],
  },
  {
    name: "Composta pesada (triagem + cobrança + conciliação) — sem teto, converge",
    need: "Triagem de documentos, cobrança de docs e conciliação bancária",
    answers: { canais: "Email, Portal do cliente", erp: "Onvio", erp_conexao: "Onvio / Domínio Web" },
    expectAsked: ["canais", "portal_entrada", "formato", "variacao", "erp_conexao", "api_acesso", "seguranca", "arquivos"],
  },
  {
    name: "EDGE: processo em BRANCO repetido → cap de tentativas, vira pendência, converge",
    need: "Triagem de documentos",
    answers: { canais: "Email", erp: "Domínio", erp_conexao: "Domínio Desktop (instalado)" },
    blankSlots: ["processo"],
    expectAsked: ["processo"],
    expectPending: ["processo"],
  },
  {
    name: "EDGE: dor vaga sem fork classificável (só sempre-requeridos + processo)",
    need: "Reduzir o tempo do fechamento mensal",
    answers: { erp: "Domínio", erp_conexao: "Onvio / Domínio Web" },
    expectNotAsked: ["canais", "arquivos", "portal_entrada", "destino", "formato", "variacao", "certificado"],
  },
  {
    name: "EDGE: ERP web mas dor não-fiscal → 2FA dispara, certificado não",
    need: "Triagem de documentos que chegam por email",
    answers: { erp: "Onvio", erp_conexao: "Onvio / Domínio Web", canais: "Email" },
    expectAsked: ["seguranca", "api_acesso"],
    expectNotAsked: ["certificado"],
  },
  {
    name: "Atendimento ao cliente (dúvidas) — drills além dos sempre-requeridos",
    need: "Atendimento (dúvidas dos clientes)",
    pains: ["Atendimento (dúvidas dos clientes)"],
    answers: { canais: "WhatsApp", erp: "Domínio", erp_conexao: "Onvio / Domínio Web" },
    expectAsked: ["canais", "formato", "erp_conexao", "api_acesso"],
    expectNotAsked: ["certificado", "destino", "variacao"],
  },
  {
    name: "Onboarding de cliente novo — coleta + cadastro + certificado (procuração/e-CAC)",
    need: "Onboarding de clientes novos",
    pains: ["Onboarding de clientes novos"],
    answers: { canais: "Email", erp: "Domínio", erp_conexao: "Domínio Desktop (instalado)" },
    expectAsked: ["canais", "arquivos", "formato", "certificado", "ambiente"],
    expectNotAsked: ["destino", "variacao"],
  },
  {
    name: "EDGE: entrada E entrega juntas (canais + destino ambos)",
    need: "Triagem de documentos na entrada e envio de guias pro cliente",
    answers: { canais: "Email, WhatsApp", erp: "Domínio", erp_conexao: "Domínio Desktop (instalado)", destino: "Email" },
    expectAsked: ["canais", "arquivos", "destino", "certificado", "ambiente"],
  },
  {
    name: "Lançamentos fiscais e contábeis (fork + certificado)",
    need: "Lançamentos fiscais e contábeis",
    pains: ["Lançamentos fiscais e contábeis"],
    answers: { erp: "Domínio", erp_conexao: "Domínio Desktop (instalado)" },
    expectAsked: ["formato", "certificado", "erp_conexao", "ambiente"],
    expectNotAsked: ["destino", "portal_entrada"],
  },
  {
    name: "NF sozinha (label real 'notas fiscais') — fork + certificado pelo plural",
    need: "Processamento/digitação de notas fiscais",
    pains: ["Processamento/digitação de notas fiscais"],
    answers: { erp: "Domínio", erp_conexao: "Domínio Desktop (instalado)" },
    expectAsked: ["formato", "certificado", "canais", "ambiente"],
    expectNotAsked: ["destino", "variacao"],
  },
  {
    name: "Combo NF + conciliação (dois forks técnicos, ERP web)",
    need: "Processamento/digitação de notas fiscais, Conciliação bancária",
    pains: ["Processamento/digitação de notas fiscais", "Conciliação bancária"],
    answers: { erp: "Onvio", erp_conexao: "Onvio / Domínio Web" },
    expectAsked: ["formato", "variacao", "seguranca", "api_acesso", "certificado"],
    expectNotAsked: ["destino", "ambiente"],
  },
];

// -----------------------------------------------------------------------------
// Runner
// -----------------------------------------------------------------------------
let passed = 0;
let failed = 0;

for (const c of CASES) {
  const fails: string[] = [];
  let res: SimResult | null = null;
  try {
    res = simulate(c);
  } catch (err) {
    fails.push(`loop não convergiu: ${err instanceof Error ? err.message : err}`);
  }

  if (res) {
    for (const id of ALWAYS_ITEMS) {
      if (!res.asked.has(id)) fails.push(`item sempre-requerido NÃO perguntado: ${id}`);
    }
    for (const id of c.expectAsked ?? []) {
      if (!res.asked.has(id)) fails.push(`esperava perguntar '${id}', não perguntou`);
    }
    for (const id of c.expectNotAsked ?? []) {
      if (res.asked.has(id)) fails.push(`NÃO devia perguntar '${id}', perguntou`);
    }
    for (const id of c.expectPending ?? []) {
      if (!res.pending.includes(id)) fails.push(`esperava '${id}' na pendência, não está (pending: ${res.pending.join(",") || "∅"})`);
    }
    for (const id of c.expectNotPending ?? []) {
      if (res.pending.includes(id)) fails.push(`'${id}' não devia estar na pendência`);
    }
  }

  if (fails.length === 0) {
    passed++;
    console.log(`${green("✓")} ${c.name} ${dim(`(${res?.rounds} rounds, ${res?.asked.size} itens, pending: ${res?.pending.length ?? 0})`)}`);
  } else {
    failed++;
    console.log(`${red("✗")} ${c.name}`);
    for (const f of fails) console.log(`    ${red("→")} ${f}`);
  }
}

// -----------------------------------------------------------------------------
// Invariantes do PISO (fail-open) — quando a IA não frasa, o motor tem que cair
// num prompt-piso não-vazio. É o que sustenta "sem gaps" mesmo com a IA fora.
// -----------------------------------------------------------------------------
{
  const fails: string[] = [];
  for (const item of CHECKLIST) {
    if (!item.defaultPrompt || item.defaultPrompt.trim().length === 0) {
      fails.push(`${item.id}: sem defaultPrompt`);
    }
    // piso (IA não fraseou): usa o defaultPrompt, nunca vazio
    if (questionForItem(item).prompt.trim().length === 0) {
      fails.push(`${item.id}: questionForItem piso vazio`);
    }
    // IA devolveu vazio/whitespace → cai no piso
    if (questionForItem(item, "   ").prompt !== item.defaultPrompt) {
      fails.push(`${item.id}: frase em branco não caiu no piso`);
    }
    // IA fraseou de verdade → usa a frase
    if (questionForItem(item, "Pergunta fraseada X").prompt !== "Pergunta fraseada X") {
      fails.push(`${item.id}: frase válida ignorada`);
    }
  }
  if (fails.length === 0) {
    passed++;
    console.log(`${green("✓")} Invariantes do piso (fail-open) ${dim(`(${CHECKLIST.length} itens cobertos)`)}`);
  } else {
    failed++;
    console.log(`${red("✗")} Invariantes do piso (fail-open)`);
    for (const f of fails) console.log(`    ${red("→")} ${f}`);
  }
}

console.log("");
console.log(bold(`${passed}/${passed + failed} checks passaram`) + (failed ? red(` · ${failed} falharam`) : green(" · tudo verde")));
if (failed > 0) process.exitCode = 1;
