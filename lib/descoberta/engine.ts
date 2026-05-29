// =============================================================================
// Descoberta — engine (orquestra checklist determinístico + fraseado por IA)
// =============================================================================
// Um "step" do loop de descoberta, server-side e SEM estado próprio: recebe a
// dor + tudo que já foi coletado e devolve OU o próximo lote de perguntas OU
// "completo" + a pauta de confirmação técnica. Stateless de propósito — o client
// manda o `collected` inteiro a cada chamada, então recomputar é barato e
// testável isolado.
//
// Garantia de "sem gaps": QUAIS itens perguntar e QUANDO acabou são decididos
// pelo checklist (determinístico). A IA só frase o lote — se ela falhar, o engine
// cai no prompt-piso de cada item. A completude nunca depende da IA.
// =============================================================================
import {
  buildActivationCtx,
  attemptsByKey,
  openRequiredItems,
  pendingConfirmationItems,
  activationProgress,
  questionForItem,
  type CollectedAnswer,
} from "@/lib/descoberta/checklist";
import { stepQuestions, isDescobertaAiConfigured } from "@/lib/descoberta/ai";
import type { DiscoveryQuestion } from "@/lib/descoberta/slots";

/** Quantos itens em aberto buscar por chamada. Menor = reage mais rápido aos
 *  drills condicionais; o lead responde uma por vez de qualquer jeito. */
const BATCH_SIZE = 4;

export type DiscoveryStepInput = {
  need: string;
  pains?: string[];
  collected: CollectedAnswer[];
};

export type PendingItem = { id: string; captures: string };

export type DiscoveryStep = {
  complete: boolean;
  /** Só no começo (collected vazio): reação à necessidade. */
  ack?: string;
  /** Próximo lote a perguntar (vazio quando complete). */
  questions: DiscoveryQuestion[];
  /** Pauta de confirmação técnica — preenchida quando complete. */
  pendingConfirmation: PendingItem[];
  /** Progresso: itens requeridos já respondidos / total ativado (+1 = contato). */
  answered: number;
  total: number;
};

export async function discoveryStep(
  input: DiscoveryStepInput,
  opts: { phrase?: boolean } = {},
): Promise<DiscoveryStep> {
  const ctx = buildActivationCtx(input);
  const attempts = attemptsByKey(input.collected);
  const { answered, total } = activationProgress(ctx);
  const progress = { answered, total: total + 1 }; // +1 = etapa de contato

  const open = openRequiredItems(ctx, { attempts });

  // Acabou: nenhum item requerido em aberto → monta a pauta de pendências.
  if (open.length === 0) {
    const pending = pendingConfirmationItems(ctx, { attempts }).map((i) => ({
      id: i.id,
      captures: i.captures,
    }));
    return {
      complete: true,
      questions: [],
      pendingConfirmation: pending,
      ...progress,
    };
  }

  const batch = open.slice(0, BATCH_SIZE);
  const isStart = input.collected.length === 0;

  // Fraseado por IA (Haiku). Fail-open: cai no prompt-piso de cada item.
  let ack: string | undefined;
  let phrased: Record<string, string> = {};
  if (opts.phrase !== false && isDescobertaAiConfigured()) {
    try {
      const r = await stepQuestions({
        need: input.need,
        collected: input.collected,
        batch: batch.map((item) => {
          const q = questionForItem(item);
          return {
            item_id: item.id,
            captures: item.captures,
            kind: q.kind,
            chips: q.chips,
          };
        }),
      });
      ack = r.ack;
      phrased = r.prompts;
    } catch (err) {
      console.error(
        "[descoberta/engine] fraseado falhou, usando prompt-piso",
        err instanceof Error ? err.message : err,
      );
    }
  }

  const questions = batch.map((item) => questionForItem(item, phrased[item.id]));

  return {
    complete: false,
    ack: isStart ? ack : undefined,
    questions,
    pendingConfirmation: [],
    ...progress,
  };
}
