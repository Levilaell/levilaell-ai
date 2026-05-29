"use client";

/**
 * Diagnóstico assistido — experiência conversacional (mascarada como
 * "diagnóstico" no UI, porque é o que converte). Por baixo é o motor da
 * descoberta: perguntas SOB MEDIDA + comentários entre elas + extração técnica.
 *
 * Fluxo (loop guiado por checklist no servidor — completude determinística):
 *   intro → dor (chips de área, scriptado) → /step (round 0: ack + 1º lote) →
 *   caminha o lote: chips = ack canned instantâneo, text = ack streamado (/ack) →
 *   no fim do lote, /step de novo (próximo lote OU completo + pauta de
 *   confirmação técnica) → repete até completar → contato → /finish (Sonnet:
 *   extração + recap-diagnóstico + dispara pipeline) → recap.
 *
 * QUAIS perguntas e QUANDO acaba são decididos pelo servidor (checklist
 * determinístico em lib/descoberta/checklist.ts), não pela IA — garante "sem
 * gaps". A IA só frase o lote; se falhar, o /step cai no prompt-piso de cada item.
 *
 * Nunca perde lead: se a rede cair em qualquer /step, vai direto pro contato e
 * captura o que já tem; /ack que falha vira ack curto.
 *
 * Visual: claro, sóbrio, alinhado ao site. Sem orb/“live”/teatro de bot — só
 * uma conversa calma com barra de progresso (a finitude tranquila do form).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { DiagnosisProgress } from "@/components/diagnosis/diagnosis-progress";
import {
  Q0_PLACEHOLDERS,
  cannedAck,
  type DiscoveryQuestion,
} from "@/lib/descoberta/slots";
import { PAIN_AREAS_V2 } from "@/lib/diagnosis-questions";
import type { DiscoveryCollectedItem } from "@/types/forms";
import { track } from "@/lib/tracking";
import { metaPixel } from "@/lib/tracking/meta";
import { googleTracking } from "@/lib/tracking/google";
import { EVENT_VALUE_BRL } from "@/lib/tracking/types";
import {
  captureAttribution,
  readAttribution,
} from "@/lib/tracking/attribution";
import { cn } from "@/lib/utils";

const TYPE_SPEED = 10; // ms/char — typedDuration() E TypedText usam isso (acoplados); não capar só a duração ou as bolhas sobrepõem
const MAX_PAINS = 3;
// Backstop: o servidor converge de forma determinística, mas se algum input
// inesperado não reduzir os itens em aberto, fecha o fluxo em vez de girar.
const MAX_QUESTIONS = 40;

type Phase = "intro" | "planning" | "asking" | "contact" | "finishing" | "done";
type Msg = {
  id: number;
  role: "ai" | "user";
  text: string;
  mode: "typed" | "plain";
};
type Composer =
  | { type: "none" }
  | { type: "need" }
  | { type: "question"; q: DiscoveryQuestion }
  | { type: "contact" };

/** Resposta de um passo do loop (/api/descoberta/step). */
type DiscoveryStepResponse = {
  complete: boolean;
  ack?: string;
  questions: DiscoveryQuestion[];
  pendingConfirmation: { id: string; captures: string }[];
  answered: number;
  total: number;
};

function formatBRPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const typedDuration = (text: string) => text.length * TYPE_SPEED + 250;

export function DescobertaExperience({
  source,
  diagnosisId,
}: {
  source?: string;
  diagnosisId?: string;
}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [composer, setComposer] = useState<Composer>({ type: "none" });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number }>({
    done: 0,
    total: 0,
  });

  // Entrada (dor) — chips de área + texto opcional
  const [painSel, setPainSel] = useState<string[]>([]);
  const [needFreeText, setNeedFreeText] = useState("");
  const [showFreeText, setShowFreeText] = useState(false);

  // Inputs das perguntas
  const [textInput, setTextInput] = useState("");
  const [multiSel, setMultiSel] = useState<string[]>([]);

  // Contato
  const [cName, setCName] = useState("");
  const [cWhatsapp, setCWhatsapp] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [contactErr, setContactErr] = useState<string | null>(null);

  // Refs de controle (evita stale closure nos fluxos async)
  const idRef = useRef(0);
  const questionsRef = useRef<DiscoveryQuestion[]>([]);
  const indexRef = useRef(0);
  const collectedRef = useRef<DiscoveryCollectedItem[]>([]);
  const needRef = useRef("");
  const painsRef = useRef<string[]>([]);
  const startedRef = useRef(false);
  const introStartedRef = useRef(false); // intro roda 1x por instância (anti re-fire)
  const answeringRef = useRef(false); // trava resposta de pergunta contra duplo-tap
  const submitLockRef = useRef(false); // trava submit de contato contra duplo-disparo
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const nextId = () => ++idRef.current;

  const pushUser = useCallback((text: string) => {
    setMessages((m) => [
      ...m,
      { id: nextId(), role: "user", text, mode: "plain" },
    ]);
  }, []);

  const pushAiTyped = useCallback(async (text: string) => {
    setMessages((m) => [
      ...m,
      { id: nextId(), role: "ai", text, mode: "typed" },
    ]);
    await delay(typedDuration(text));
  }, []);

  // Mensagem da IA instantânea (sem typewriter). Usada pro ack do /plan, que já
  // veio depois de ~8s de espera — digitar de novo só adia o payoff.
  const pushAiPlain = useCallback((text: string) => {
    setMessages((m) => [
      ...m,
      { id: nextId(), role: "ai", text, mode: "plain" },
    ]);
  }, []);

  const updateMsg = useCallback((id: number, text: string) => {
    setMessages((m) => m.map((x) => (x.id === id ? { ...x, text } : x)));
  }, []);

  const pinBottom = useCallback((smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  // ---- auto-scroll: mensagem nova (smooth) + cada tick do typewriter (instant)
  useEffect(() => {
    pinBottom(true);
  }, [messages, composer, busy, pinBottom]);

  // ---- intro (uma vez, idempotente) -----------------------------------------
  // Ref-guard: o corpo roda no MÁXIMO 1x por instância. Sem isso, qualquer
  // re-disparo do effect com o state preservado (Fast Refresh em dev quando se
  // edita slots/prompts; StrictMode double-invoke) re-injeta as 2 mensagens de
  // intro e RESETA o composer pra "need" no meio da conversa — era o reset que
  // bugava o form. Em prod o effect roda 1x de qualquer jeito; o guard só blinda
  // dev e mata o double-fire de descoberta_opened/captureAttribution no StrictMode.
  // React 19 no-opa setState pós-unmount, então não precisa de flag de cancel.
  useEffect(() => {
    if (introStartedRef.current) return;
    introStartedRef.current = true;
    captureAttribution();
    track({ type: "descoberta_opened", data: {} });
    void (async () => {
      await pushAiTyped(
        "Vou te fazer umas perguntas rápidas pra mapear onde teu escritório mais perde tempo — leva uns 2 minutos.",
      );
      await pushAiTyped(
        "Começa por aqui: onde tá doendo mais hoje? Marca o que pesa (pode ser mais de um).",
      );
      setComposer({ type: "need" });
    })();
  }, [pushAiTyped]);

  // ---- abandono -------------------------------------------------------------
  useEffect(() => {
    function handler() {
      if (phase === "done") return;
      if (collectedRef.current.length === 0 && !needRef.current) return;
      track({
        type: "descoberta_abandoned",
        data: { phase, answered: collectedRef.current.length },
      });
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);

  // ---- fluxo (loop guiado por checklist no servidor) ------------------------
  const askQuestion = useCallback(
    async (i: number) => {
      const q = questionsRef.current[i];
      if (!q) return;
      indexRef.current = i;
      setPhase("asking");
      setComposer({ type: "none" });
      setStatus(null);
      setTextInput("");
      setMultiSel([]);
      await pushAiTyped(q.prompt);
      answeringRef.current = false; // re-arma a trava quando os botões reaparecem
      setBusy(false);
      setComposer({ type: "question", q });
    },
    [pushAiTyped],
  );

  const goToContact = useCallback(async () => {
    setPhase("contact");
    setComposer({ type: "none" });
    setStatus(null);
    await pushAiTyped(
      "Boa, já tenho um bom retrato do teu cenário. Deixa teu contato que eu finalizo teu diagnóstico e te chamo no WhatsApp com os próximos passos 👇",
    );
    setProgress((p) => ({ ...p, done: p.total }));
    setBusy(false);
    setComposer({ type: "contact" });
  }, [pushAiTyped]);

  // Um passo do loop: manda tudo coletado, recebe o próximo lote ou "completo".
  const fetchStep = useCallback(async (): Promise<DiscoveryStepResponse> => {
    const res = await fetch("/api/descoberta/step", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        need: needRef.current,
        pains: painsRef.current,
        collected: collectedRef.current,
      }),
    });
    if (!res.ok) throw new Error(`step ${res.status}`);
    return (await res.json()) as DiscoveryStepResponse;
  }, []);

  const advance = useCallback(async () => {
    const next = indexRef.current + 1;
    // move a barra por resposta (o /step reconcilia com o valor autoritativo)
    setProgress((p) => ({ ...p, done: Math.min(p.done + 1, p.total) }));
    // ainda há pergunta no lote atual → segue sem ir ao servidor
    if (next < questionsRef.current.length) {
      void askQuestion(next);
      return;
    }
    // backstop: nunca passa de MAX_QUESTIONS — fecha o fluxo em vez de girar
    if (collectedRef.current.length >= MAX_QUESTIONS) {
      void goToContact();
      return;
    }
    // fim do lote → o servidor decide: próximo lote ou concluído (determinístico)
    setComposer({ type: "none" });
    setBusy(true);
    let step: DiscoveryStepResponse;
    try {
      step = await fetchStep();
    } catch {
      void goToContact(); // rede caiu — não perde o lead, captura com o que tem
      return;
    }
    setProgress({ done: step.answered, total: step.total });
    if (step.complete || step.questions.length === 0) {
      void goToContact();
      return;
    }
    questionsRef.current.push(...step.questions);
    void askQuestion(next);
  }, [askQuestion, fetchStep, goToContact]);

  // Ack streamado pra respostas abertas (text). Falha → ack curto.
  const streamAck = useCallback(
    async (q: DiscoveryQuestion, answer: string) => {
      const id = nextId();
      setMessages((m) => [...m, { id, role: "ai", text: "", mode: "plain" }]);
      try {
        const res = await fetch("/api/descoberta/ack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            need: needRef.current,
            question: q.prompt,
            answer,
          }),
        });
        if (res.ok && res.body) {
          const reader = res.body.getReader();
          const dec = new TextDecoder();
          let acc = "";
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            acc += dec.decode(value, { stream: true });
            updateMsg(id, acc);
          }
          if (!acc.trim()) updateMsg(id, "Entendi.");
        } else {
          updateMsg(id, "Entendi.");
        }
      } catch {
        updateMsg(id, "Entendi.");
      }
    },
    [updateMsg],
  );

  const submitAnswer = useCallback(
    async (q: DiscoveryQuestion, answerText: string, ackValue: string) => {
      if (answeringRef.current) return; // duplo-tap: ignora o 2º disparo
      answeringRef.current = true;
      pushUser(answerText);
      collectedRef.current.push({
        key: q.key,
        question: q.prompt,
        answer: answerText,
      });
      track({
        type: "descoberta_question_answered",
        data: { key: q.key, index: indexRef.current },
      });
      setComposer({ type: "none" });
      setBusy(true);
      if (q.kind === "text") {
        await streamAck(q, answerText);
      } else {
        await pushAiTyped(cannedAck(q.key, ackValue));
      }
      // busy segue até a próxima pergunta aparecer (askQuestion) ou o contato
      void advance();
    },
    [advance, pushAiTyped, pushUser, streamAck],
  );

  const startDiscovery = useCallback(
    async (need: string, pains: string[]) => {
      needRef.current = need;
      painsRef.current = pains;
      collectedRef.current = [];
      indexRef.current = 0;
      pushUser(need);
      track({ type: "descoberta_started", data: {} });
      metaPixel.initiateCheckout();
      googleTracking.beginDiagnosis();
      setPhase("planning");
      setComposer({ type: "none" });
      setBusy(true);
      setStatus("lendo teu caso e montando as perguntas certas…");

      let step: DiscoveryStepResponse;
      try {
        step = await fetchStep();
      } catch {
        // rede caiu logo de cara — não perde o lead: vai direto pro contato.
        setStatus(null);
        void goToContact();
        return;
      }

      track({
        type: "descoberta_plan_ready",
        data: { count: step.questions.length, fallback: !step.ack },
      });
      questionsRef.current = step.questions;
      indexRef.current = 0;
      setProgress({ done: step.answered, total: step.total });
      setStatus(null);
      if (step.ack) pushAiPlain(step.ack); // instantâneo — o lead já esperou
      if (step.complete || step.questions.length === 0) {
        void goToContact();
      } else {
        void askQuestion(0);
      }
    },
    [askQuestion, fetchStep, goToContact, pushAiPlain, pushUser],
  );

  const submitContact = useCallback(async () => {
    const wppDigits = cWhatsapp.replace(/\D/g, "").length;
    if (cName.trim().length < 2) return setContactErr("Coloca teu nome.");
    if (!/.+@.+\..+/.test(cEmail)) return setContactErr("E-mail inválido.");
    if (wppDigits < 10 || wppDigits > 13)
      return setContactErr("WhatsApp inválido — DDD + número.");
    setContactErr(null);
    if (submitLockRef.current) return; // já está enviando — ignora duplo-clique
    submitLockRef.current = true;
    pushUser(`${cName} · ${cWhatsapp} · ${cEmail}`);
    setComposer({ type: "none" });
    setPhase("finishing");
    setBusy(true);
    setStatus("montando teu diagnóstico…");

    try {
      const attr = readAttribution();
      const res = await fetch("/api/descoberta/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          need: needRef.current,
          collected: collectedRef.current,
          name: cName,
          email: cEmail,
          whatsapp: cWhatsapp,
          source: source ?? "descoberta",
          diagnosis_id: diagnosisId ?? "",
          utm_source: attr?.utm_source ?? null,
          utm_medium: attr?.utm_medium ?? null,
          utm_campaign: attr?.utm_campaign ?? null,
          utm_content: attr?.utm_content ?? null,
          utm_term: attr?.utm_term ?? null,
          landing_page: attr?.landing_page ?? null,
          referrer: attr?.referrer ?? null,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body?.error ?? `Erro ${res.status}`);
      }
      const data = (await res.json()) as {
        event_id: string;
        recap: string | null;
      };

      // Diagnóstico grátis dispara Lead PADRÃO (warm, R$100), não hot — quem
      // completa um diagnóstico grátis ≠ quem pede contato. Hot (R$500) fica
      // reservado pro form de agendamento. event_id preservado pra dedup Pixel↔CAPI.
      void metaPixel.lead({
        event_id: data.event_id,
        value: EVENT_VALUE_BRL.lead,
        email: cEmail,
        phone: cWhatsapp,
        fullName: cName,
        leadQuality: "warm",
      });
      googleTracking.generateLead({
        value: EVENT_VALUE_BRL.lead,
        email: cEmail,
      });
      track({
        type: "descoberta_completed",
        data: { answered: collectedRef.current.length },
      });

      setStatus(null);
      setBusy(false);
      setPhase("done");
      const recapText =
        data.recap ??
        "Pronto — teu diagnóstico tá montado. Te chamo no WhatsApp com os próximos passos.";
      await pushAiTyped(recapText);
    } catch (err) {
      setBusy(false);
      setStatus(null);
      submitLockRef.current = false; // libera pra retry
      setContactErr(
        err instanceof Error
          ? `${err.message} — tenta de novo.`
          : "Não consegui enviar agora. Tenta de novo.",
      );
      setPhase("contact");
      setComposer({ type: "contact" });
    }
  }, [cEmail, cName, cWhatsapp, diagnosisId, pushAiTyped, pushUser, source]);

  // ---- handlers de UI -------------------------------------------------------
  function togglePain(label: string) {
    setPainSel((s) =>
      s.includes(label)
        ? s.filter((x) => x !== label)
        : s.length >= MAX_PAINS
          ? s
          : [...s, label],
    );
  }

  function submitNeed() {
    if (startedRef.current) return;
    const parts = [painSel.join(", "), needFreeText.trim()].filter(Boolean);
    const need = parts.join(" — ");
    if (need.length < 2) return;
    startedRef.current = true;
    void startDiscovery(need, painSel);
  }

  function onChipSingle(q: DiscoveryQuestion, value: string) {
    void submitAnswer(q, value, value);
  }

  function onMultiConfirm(q: DiscoveryQuestion) {
    if (multiSel.length === 0) return;
    void submitAnswer(q, multiSel.join(", "), multiSel[0] ?? "");
  }

  function submitText(q: DiscoveryQuestion) {
    const v = textInput.trim();
    if (v.length < 2) return;
    void submitAnswer(q, v, v);
  }

  const showProgress = progress.total > 0 && phase !== "done";
  const needReady = painSel.length > 0 || needFreeText.trim().length >= 2;

  return (
    <div className="space-y-6">
      {showProgress && (
        <DiagnosisProgress step={progress.done} total={progress.total} />
      )}

      <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
        {/* transcript */}
        <div
          ref={scrollRef}
          className="h-[min(58vh,520px)] space-y-4 overflow-y-auto p-5 sm:p-6"
        >
          {messages.map((m) => (
            <MessageBubble key={m.id} msg={m} onReveal={pinBottom} />
          ))}
          {busy && status && (
            <div className="flex items-center gap-2 pl-7 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin text-brand" aria-hidden />
              {status}
            </div>
          )}
        </div>

        {/* composer */}
        <div className="border-t border-border bg-muted/30 p-4 sm:p-5">
          {renderComposer()}
        </div>
      </div>
    </div>
  );

  function renderComposer() {
    if (composer.type === "need") {
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {PAIN_AREAS_V2.map((opt) => {
              const on = painSel.includes(opt.label);
              const disabled = !on && painSel.length >= MAX_PAINS;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={on}
                  disabled={disabled}
                  onClick={() => togglePain(opt.label)}
                  className={cn(
                    "rounded-full border px-3.5 py-2 text-sm transition-colors",
                    on
                      ? "border-brand bg-brand/10 text-foreground"
                      : "border-border bg-background text-foreground/90 hover:border-brand/50 hover:bg-muted",
                    disabled && "opacity-40 cursor-not-allowed",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {showFreeText ? (
            <textarea
              value={needFreeText}
              onChange={(e) => setNeedFreeText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitNeed();
                }
              }}
              rows={2}
              maxLength={1000}
              placeholder={Q0_PLACEHOLDERS[0]}
              className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-brand/60 focus:ring-1 focus:ring-brand/30"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowFreeText(true)}
              className="text-xs text-muted-foreground underline underline-offset-2 transition hover:text-foreground"
            >
              Prefiro descrever com minhas palavras
            </button>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={submitNeed}
              disabled={!needReady}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-40"
            >
              Continuar <ArrowRight className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      );
    }

    if (composer.type === "question") {
      const q = composer.q;
      if (q.kind === "text") {
        return (
          <div className="space-y-2">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitText(q);
                }
              }}
              rows={2}
              maxLength={2000}
              placeholder={q.placeholder ?? "Pode escrever do seu jeito…"}
              className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-brand/60 focus:ring-1 focus:ring-brand/30"
              autoFocus
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => submitText(q)}
                disabled={textInput.trim().length < 2}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-40"
              >
                Enviar <ArrowRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        );
      }

      const chips = q.chips ?? [];
      if (q.kind === "multi") {
        return (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => {
                const on = multiSel.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setMultiSel((s) =>
                        on ? s.filter((x) => x !== c) : [...s, c],
                      )
                    }
                    className={cn(
                      "rounded-full border px-3.5 py-2 text-sm transition-colors",
                      on
                        ? "border-brand bg-brand/10 text-foreground"
                        : "border-border bg-background text-foreground/90 hover:border-brand/50 hover:bg-muted",
                    )}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onMultiConfirm(q)}
                disabled={multiSel.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-40"
              >
                Continuar <ArrowRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        );
      }

      // single
      return (
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChipSingle(q, c)}
              className="rounded-full border border-border bg-background px-3.5 py-2 text-sm text-foreground/90 transition-colors hover:border-brand hover:bg-brand/10 hover:text-foreground"
            >
              {c}
            </button>
          ))}
        </div>
      );
    }

    if (composer.type === "contact") {
      return (
        <div className="space-y-2.5">
          <div className="grid gap-2.5 sm:grid-cols-3">
            <input
              value={cName}
              onChange={(e) => setCName(e.target.value)}
              placeholder="Seu nome"
              autoComplete="name"
              className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-brand/60 focus:ring-1 focus:ring-brand/30"
            />
            <input
              value={cWhatsapp}
              onChange={(e) => setCWhatsapp(formatBRPhone(e.target.value))}
              placeholder="(17) 99999-9999"
              inputMode="tel"
              autoComplete="tel-national"
              className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-brand/60 focus:ring-1 focus:ring-brand/30"
            />
            <input
              value={cEmail}
              onChange={(e) => setCEmail(e.target.value)}
              placeholder="voce@escritorio.com.br"
              type="email"
              autoComplete="email"
              className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-brand/60 focus:ring-1 focus:ring-brand/30"
            />
          </div>
          {contactErr && <p className="text-xs text-destructive">{contactErr}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              Só uso pra te enviar o diagnóstico e falar dos próximos passos. Sem spam.
            </span>
            <button
              type="button"
              onClick={() => void submitContact()}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden /> Enviando…
                </>
              ) : (
                <>
                  Receber meu diagnóstico <CheckCircle2 className="size-4" aria-hidden />
                </>
              )}
            </button>
          </div>
        </div>
      );
    }

    if (phase === "done") {
      return (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-500" aria-hidden />
          <p className="text-sm text-foreground">
            Recebi tudo. Te chamo no WhatsApp com os próximos passos do teu diagnóstico.
          </p>
        </div>
      );
    }

    // composer "none" — espaço reservado pra não pular layout
    return <div className="h-10" aria-hidden />;
  }
}

// =============================================================================
function MessageBubble({
  msg,
  onReveal,
}: {
  msg: Msg;
  onReveal?: () => void;
}) {
  if (msg.role === "user") {
    return (
      <div className="ll-fade-up flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md border border-brand/30 bg-brand/10 px-4 py-2.5 text-sm text-foreground">
          {msg.text}
        </div>
      </div>
    );
  }
  return (
    <div className="ll-fade-up flex items-start gap-2.5">
      <span
        className="mt-2 size-2 shrink-0 rounded-full bg-brand"
        aria-hidden
      />
      <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-border bg-background px-4 py-2.5 text-sm leading-relaxed text-foreground/90">
        {msg.mode === "typed" ? (
          <TypedText text={msg.text} onTick={onReveal} />
        ) : msg.text ? (
          msg.text
        ) : (
          <TypingDots />
        )}
      </div>
    </div>
  );
}

function TypedText({ text, onTick }: { text: string; onTick?: () => void }) {
  // n parte de 0 (estado inicial) e só avança no callback do interval — sem
  // setState síncrono no corpo do effect. Cada mensagem tem id único, então
  // o componente remonta por mensagem (não precisa resetar n na troca de text).
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setN(i);
      onTick?.(); // mantém o scroll colado no fim enquanto revela
      if (i >= text.length) clearInterval(id);
    }, TYPE_SPEED);
    return () => clearInterval(id);
  }, [text, onTick]);
  const done = n >= text.length;
  return (
    <span className={done ? undefined : "ll-caret"}>{text.slice(0, n)}</span>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-muted-foreground/50"
          style={{ animation: `ll-dot 1.2s ease-in-out ${i * 0.15}s infinite` }}
        />
      ))}
    </span>
  );
}
