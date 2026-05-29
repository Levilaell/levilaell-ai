/**
 * scripts/test-descoberta.ts
 *
 * Teste de INTEGRAÇÃO end-to-end do loop de descoberta (engine real + IA real),
 * DIRETO na lib — sem HTTP e sem pipeline (não toca Telegram/CRM/CAPI/Supabase).
 *
 * Pra cada caso: simula o lead respondendo turno a turno (respostas canned,
 * branch-aware) até o engine dizer `complete`, e afirma — de forma INDEPENDENTE
 * do engine, recomputando o checklist — que não sobrou item requerido em aberto.
 * Pra um subconjunto, roda a extração (Sonnet) e checa que os campos-chave saíram.
 *
 * O complemento determinístico (cérebro, sem IA) está em test-checklist.ts.
 *
 * Uso: npx tsx scripts/test-descoberta.ts
 * Custo: ~1 Haiku por turno + ~1 Sonnet por extração. Sem ANTHROPIC_API_KEY o
 * engine cai no prompt-piso (o teste ainda valida a convergência determinística).
 */
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
loadEnv({ path: resolve(process.cwd(), ".env.local") });

import { discoveryStep } from "@/lib/descoberta/engine";
import { extractAndRecap, isDescobertaAiConfigured } from "@/lib/descoberta/ai";
import {
  buildActivationCtx,
  attemptsByKey,
  openRequiredItems,
} from "@/lib/descoberta/checklist";
import type { DiscoveryCollectedItem } from "@/types/forms";

const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const gold = (s: string) => `\x1b[33m${s}\x1b[0m`;

const MAX_ROUNDS = 16;

// Respostas-padrão por slot — realistas e substantivas (loop converge limpo).
// Cada caso pode sobrescrever pra exercitar um branch (portal, desktop, "não sei").
const DEFAULT_ANSWER: Record<string, string> = {
  erp: "Domínio",
  erp_conexao: "Domínio Desktop (instalado)",
  api_acesso: "Tem API liberada",
  ambiente: "Servidor/máquina dedicada ligada",
  canais: "Email, WhatsApp",
  portal_entrada: "Onvio Portal",
  arquivos: "Google Drive",
  destino: "Email",
  especifico: "As notas vêm em XML do SEFAZ, algumas em PDF digital",
  variacao: "uns 5 bancos diferentes e 3 tipos de documento",
  certificado: "A1 (arquivo)",
  seguranca: "Não",
  volume_tx: "1.000 a 5.000/mês",
  volume: "100 a 250",
  qualidade: "Tolero alguns % manual",
  processo:
    "o cliente manda no email, alguém baixa, confere e lança no sistema na mão",
  time: "4 a 10",
  tentativas: "SaaS pronto, não rolou",
  gatilho: "crescemos esse ano e o time não dá conta do fechamento",
  criterio: "parar de fazer lançamento na mão e pegar mais cliente",
  prazo: "Pra ontem 🔥",
  decisor: "Sou eu (dono/sócio)",
  cobranca: "Projeto único",
};

type Case = {
  name: string;
  need: string;
  pains?: string[];
  answers?: Record<string, string>;
  extract?: boolean; // roda a extração (Sonnet) neste caso
};

const CASES: Case[] = [
  {
    name: "Triagem + cobrança, portal de entrada",
    need: "Triagem de documentos recebidos (e-mail/WhatsApp), Cobrança de documentos com clientes",
    pains: ["Triagem de documentos", "Cobrança de documentos com clientes"],
    answers: { canais: "Email, Portal do cliente", erp: "Onvio", erp_conexao: "Onvio / Domínio Web" },
    extract: true,
  },
  {
    name: "Conciliação bancária (Domínio desktop)",
    need: "Conciliação bancária dos clientes todo mês",
    answers: { erp: "Domínio", erp_conexao: "Domínio Desktop (instalado)" },
    extract: true,
  },
  {
    name: "Coleta/envio de guias (fiscal, Onvio web)",
    need: "Coleta automática de guias no Domínio e envio pro cliente",
    answers: { erp: "Domínio", erp_conexao: "Onvio / Domínio Web", destino: "Onvio Portal" },
  },
  {
    name: "Lançamento de NF (Onvio web, API/2FA 'não sei')",
    need: "Automatizar o lançamento das notas fiscais no Onvio",
    answers: { erp: "Onvio", erp_conexao: "Onvio / Domínio Web", api_acesso: "Não sei", seguranca: "Não sei" },
    extract: true,
  },
  {
    name: "Composta pesada (triagem + cobrança + conciliação)",
    need: "Triagem de documentos, cobrança de docs e conciliação bancária",
    answers: { canais: "Email, Portal do cliente", erp: "Onvio", erp_conexao: "Onvio / Domínio Web" },
  },
  {
    name: "ERP planilha (sem fork de conexão)",
    need: "Triagem de documentos e lançamento numa planilha",
    answers: { erp: "Planilha / sistema próprio" },
  },
  {
    name: "Relatórios mensais (entrega, sem entrada)",
    need: "Gerar e enviar relatórios mensais pros clientes",
    answers: { destino: "Email", erp: "Domínio", erp_conexao: "Domínio Desktop (instalado)" },
  },
  {
    name: "Onboarding de cliente novo (dor antes sem drills)",
    need: "Onboarding de clientes novos",
    pains: ["Onboarding de clientes novos"],
    answers: { erp: "Domínio", erp_conexao: "Domínio Desktop (instalado)", canais: "Email" },
    extract: true,
  },
];

function answerFor(c: Case, slot: string): string {
  return c.answers?.[slot] ?? DEFAULT_ANSWER[slot] ?? "sim, pode ser";
}

type LoopResult = {
  collected: DiscoveryCollectedItem[];
  rounds: number;
  pending: string[];
  ackSeen: boolean;
};

async function runLoop(c: Case): Promise<LoopResult> {
  const collected: DiscoveryCollectedItem[] = [];
  let rounds = 0;
  let pending: string[] = [];
  let ackSeen = false;

  for (;;) {
    if (rounds++ > MAX_ROUNDS) throw new Error(`não convergiu em ${MAX_ROUNDS} rounds`);
    const step = await discoveryStep({ need: c.need, pains: c.pains, collected });
    if (step.ack) ackSeen = true;
    if (step.complete) {
      pending = step.pendingConfirmation.map((p) => p.id);
      break;
    }
    if (step.questions.length === 0) throw new Error("step não-completo sem perguntas");
    for (const q of step.questions) {
      collected.push({ key: q.key, question: q.prompt, answer: answerFor(c, q.key) });
    }
  }
  return { collected, rounds, pending, ackSeen };
}

async function main() {
  console.log(
    bold("Teste e2e do loop de descoberta") +
      dim(` · IA ${isDescobertaAiConfigured() ? "ON (fraseado real)" : "OFF (prompt-piso)"}`),
  );
  console.log("");

  let passed = 0;
  let failed = 0;

  for (const c of CASES) {
    const fails: string[] = [];
    let res: LoopResult | null = null;
    try {
      res = await runLoop(c);
    } catch (err) {
      fails.push(`loop: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (res) {
      // CHECK INDEPENDENTE: recomputa o checklist e exige zero item requerido aberto.
      const ctx = buildActivationCtx({ need: c.need, pains: c.pains, collected: res.collected });
      const stillOpen = openRequiredItems(ctx, { attempts: attemptsByKey(res.collected) });
      if (stillOpen.length > 0) {
        fails.push(`sobraram itens requeridos em aberto: ${stillOpen.map((i) => i.id).join(", ")}`);
      }
      if (!res.ackSeen && isDescobertaAiConfigured()) {
        fails.push("ack inicial não veio (round 0)");
      }
    }

    if (fails.length === 0) {
      passed++;
      console.log(
        `${green("✓")} ${c.name} ${dim(`(${res?.rounds} rounds, ${res?.collected.length} respostas, pending: ${res?.pending.join(",") || "∅"})`)}`,
      );
    } else {
      failed++;
      console.log(`${red("✗")} ${c.name}`);
      for (const f of fails) console.log(`    ${red("→")} ${f}`);
    }

    // Extração (Sonnet) em casos marcados — sanidade dos campos-chave.
    if (res && c.extract && isDescobertaAiConfigured()) {
      try {
        const ex = await extractAndRecap({ need: c.need, collected: res.collected });
        const recapOk = ex.recap.trim().length > 20;
        const scopeOk = Array.isArray(ex.escopo_sugerido) && ex.escopo_sugerido.length >= 1;
        const banned = /\b(proposta|orçamento|orcamento|call|reunião|reuniao)\b/i.test(ex.recap);
        const bad = !recapOk || !scopeOk || banned;
        if (bad) {
          failed++;
          passed--;
        }
        console.log(
          `    ${gold("extract")} recap:${recapOk ? "ok" : red("vazio")} escopo:${scopeOk ? ex.escopo_sugerido.length : red("0")} erp:${ex.sistemas?.erp ?? "-"} conexao:${ex.sistemas?.erp_conexao ?? "-"}` +
            (banned ? red(" [recap usou palavra proibida]") : ""),
        );
        console.log(dim(`      recap: ${ex.recap.slice(0, 160)}…`));
      } catch (err) {
        console.log(`    ${red("→")} extração lançou: ${err instanceof Error ? err.message : err}`);
        failed++;
        passed--;
      }
    }
  }

  console.log("");
  console.log(
    bold(`${passed}/${CASES.length} casos passaram`) +
      (failed ? red(` · ${failed} falha(s)`) : green(" · tudo verde")),
  );
  if (failed > 0) process.exitCode = 1;
}

void main();
