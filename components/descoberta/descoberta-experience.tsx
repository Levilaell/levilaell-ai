"use client";

/**
 * Descoberta — experiência conversacional que substitui a call de descoberta.
 *
 * Fluxo (snappy by design — modelo FORA do loop na maioria dos turnos):
 *   intro → Q0 (necessidade, scriptado) → /plan (1 chamada Haiku: ack +
 *   perguntas sob medida) → caminha as perguntas: chips = ack canned instantâneo;
 *   text = ack streamado (/ack) → contato (nome/whatsapp/email) → /finish
 *   (1 chamada Sonnet: extração + recap + dispara pipeline) → recap final.
 *
 * Nunca perde lead: /plan devolve fallback estático se a IA falhar; se a rede
 * cair no /plan, cai pro FALLBACK_QUESTIONS no client; /ack que falha vira ack
 * curto; o fluxo sempre chega na captura de contato.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { DescobertaOrb } from "@/components/descoberta/descoberta-orb";
import {
  FALLBACK_QUESTIONS,
  Q0_PLACEHOLDERS,
  Q0_PROMPT,
  cannedAck,
  type DiscoveryQuestion,
} from "@/lib/descoberta/slots";
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

const TYPE_SPEED = 14; // ms/char — typedDuration() reflete isso (sem cap) pra sequenciar turnos sem sobrepor

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

const FALLBACK_ACK =
  "Boa. Deixa eu entender melhor teu cenário pra montar algo que faça sentido — é rápido.";

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

  // Inputs
  const [needInput, setNeedInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [multiSel, setMultiSel] = useState<string[]>([]);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

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
  const startedRef = useRef(false);
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

  // ---- placeholder rotativo do Q0 ------------------------------------------
  useEffect(() => {
    if (composer.type !== "need" || needInput) return;
    const id = setInterval(
      () => setPlaceholderIdx((i) => (i + 1) % Q0_PLACEHOLDERS.length),
      2800,
    );
    return () => clearInterval(id);
  }, [composer.type, needInput]);

  // ---- intro (uma vez) ------------------------------------------------------
  useEffect(() => {
    captureAttribution();
    track({ type: "descoberta_opened", data: {} });
    let cancelled = false;
    (async () => {
      await pushAiTyped(
        "Em vez de marcar uma call de descoberta, responde aqui — leva uns 2 minutos.",
      );
      if (cancelled) return;
      await pushAiTyped(
        "Com isso eu já monto o retrato do seu escritório e a gente marca uma call rápida só pra eu te apresentar a proposta. Bora?",
      );
      if (cancelled) return;
      setComposer({ type: "need" });
    })();
    return () => {
      cancelled = true;
    };
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

  // ---- fluxo ----------------------------------------------------------------
  const askQuestion = useCallback(
    async (i: number) => {
      const q = questionsRef.current[i];
      if (!q) return;
      indexRef.current = i;
      setPhase("asking");
      setComposer({ type: "none" });
      setTextInput("");
      setMultiSel([]);
      await pushAiTyped(q.prompt);
      setComposer({ type: "question", q });
    },
    [pushAiTyped],
  );

  const goToContact = useCallback(async () => {
    setPhase("contact");
    setComposer({ type: "none" });
    await pushAiTyped(
      "Boa — já tenho um bom retrato. Me deixa teu contato que eu chamo no WhatsApp pra marcar a call da proposta 👇",
    );
    setProgress((p) => ({ ...p, done: p.total }));
    setComposer({ type: "contact" });
  }, [pushAiTyped]);

  const advance = useCallback(() => {
    const next = indexRef.current + 1;
    setProgress((p) => ({ ...p, done: Math.min(p.done + 1, p.total) }));
    if (next < questionsRef.current.length) {
      void askQuestion(next);
    } else {
      void goToContact();
    }
  }, [askQuestion, goToContact]);

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
      setBusy(false);
      advance();
    },
    [advance, pushAiTyped, pushUser, streamAck],
  );

  const startPlanning = useCallback(
    async (need: string) => {
      needRef.current = need;
      pushUser(need);
      track({ type: "descoberta_started", data: {} });
      metaPixel.initiateCheckout();
      setPhase("planning");
      setComposer({ type: "none" });
      setBusy(true);
      setStatus("montando suas perguntas…");

      let questions: DiscoveryQuestion[] = FALLBACK_QUESTIONS;
      let ack = FALLBACK_ACK;
      try {
        const res = await fetch("/api/descoberta/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ need }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            ack: string;
            questions: DiscoveryQuestion[];
            fallback?: boolean;
          };
          if (Array.isArray(data.questions) && data.questions.length > 0) {
            questions = data.questions;
            ack = data.ack || FALLBACK_ACK;
          }
          track({
            type: "descoberta_plan_ready",
            data: { count: questions.length, fallback: Boolean(data.fallback) },
          });
        }
      } catch {
        // rede caiu — segue com FALLBACK_QUESTIONS
        track({
          type: "descoberta_plan_ready",
          data: { count: questions.length, fallback: true },
        });
      }

      questionsRef.current = questions;
      collectedRef.current = [];
      indexRef.current = 0;
      setProgress({ done: 0, total: questions.length + 1 });
      setStatus(null);
      setBusy(false);
      await pushAiTyped(ack);
      void askQuestion(0);
    },
    [askQuestion, pushAiTyped, pushUser],
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
    setStatus("montando seu resumo…");

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

      void metaPixel.lead({
        event_id: data.event_id,
        value: EVENT_VALUE_BRL.hot_lead,
        email: cEmail,
        phone: cWhatsapp,
        fullName: cName,
        leadQuality: "hot",
      });
      googleTracking.generateHotLead({
        value: EVENT_VALUE_BRL.hot_lead,
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
        "Fechou. Anotei tudo aqui — te chamo no WhatsApp pra marcar a call e já te apresento a proposta.";
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
  function submitNeed() {
    const v = needInput.trim();
    if (v.length < 2 || startedRef.current) return;
    startedRef.current = true;
    setNeedInput("");
    void startPlanning(v);
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

  return (
    <div className="relative mx-auto flex h-[min(82vh,760px)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0f]/80 shadow-[0_0_80px_-20px] shadow-brand/30 backdrop-blur">
      {/* fundo */}
      <div
        className="pointer-events-none absolute inset-0 ll-grid opacity-[0.35]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--brand) 0%, transparent 70%)",
          opacity: 0.18,
        }}
        aria-hidden
      />

      {/* header */}
      <div className="relative z-10 flex items-center gap-3 border-b border-white/10 px-5 py-3.5">
        <DescobertaOrb state={busy ? "thinking" : "idle"} className="size-9" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-100">Descoberta</p>
          <p className="truncate text-xs text-zinc-400">
            {status ?? (busy ? "pensando…" : "online · substitui a call")}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-brand/80">
          <span className="size-1.5 animate-pulse rounded-full bg-brand" /> live
        </div>
      </div>

      {showProgress && (
        <div className="relative z-10 h-0.5 w-full bg-white/5">
          <div
            className="h-full bg-brand transition-all duration-500"
            style={{
              width: `${Math.round((progress.done / progress.total) * 100)}%`,
            }}
          />
        </div>
      )}

      {/* mensagens */}
      <div
        ref={scrollRef}
        className="relative z-10 flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-5"
      >
        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} onReveal={pinBottom} />
        ))}
        {busy && status && (
          <div className="flex justify-center pt-2">
            <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300">
              <Sparkles className="size-3.5 text-brand" /> {status}
            </span>
          </div>
        )}
      </div>

      {/* composer */}
      <div className="relative z-10 border-t border-white/10 bg-black/30 px-4 py-4 sm:px-5">
        {renderComposer()}
      </div>
    </div>
  );

  function renderComposer() {
    if (composer.type === "need") {
      return (
        <div className="space-y-2">
          <textarea
            value={needInput}
            onChange={(e) => setNeedInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submitNeed();
              }
            }}
            rows={2}
            maxLength={1000}
            placeholder={Q0_PLACEHOLDERS[placeholderIdx]}
            className="w-full resize-none rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-brand/60 focus:ring-1 focus:ring-brand/40"
            aria-label={Q0_PROMPT}
            autoFocus
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-zinc-500">{Q0_PROMPT}</span>
            <button
              type="button"
              onClick={submitNeed}
              disabled={needInput.trim().length < 2}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-40"
            >
              Continuar <ArrowUp className="size-4" />
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
              className="w-full resize-none rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-brand/60 focus:ring-1 focus:ring-brand/40"
              autoFocus
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => submitText(q)}
                disabled={textInput.trim().length < 2}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-40"
              >
                Enviar <ArrowUp className="size-4" />
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
                    onClick={() =>
                      setMultiSel((s) =>
                        on ? s.filter((x) => x !== c) : [...s, c],
                      )
                    }
                    className={cn(
                      "rounded-full border px-3.5 py-2 text-sm transition",
                      on
                        ? "border-brand bg-brand/20 text-white"
                        : "border-white/15 bg-white/5 text-zinc-200 hover:border-brand/50",
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
                Continuar <ArrowUp className="size-4" />
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
              className="rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-sm text-zinc-200 transition hover:border-brand hover:bg-brand/15 hover:text-white"
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
              className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-brand/60"
            />
            <input
              value={cWhatsapp}
              onChange={(e) => setCWhatsapp(formatBRPhone(e.target.value))}
              placeholder="(17) 99999-9999"
              inputMode="tel"
              autoComplete="tel-national"
              className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-brand/60"
            />
            <input
              value={cEmail}
              onChange={(e) => setCEmail(e.target.value)}
              placeholder="voce@escritorio.com.br"
              type="email"
              autoComplete="email"
              className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-brand/60"
            />
          </div>
          {contactErr && <p className="text-xs text-red-400">{contactErr}</p>}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-zinc-500">
              Só uso pra marcar a call da proposta. Sem spam.
            </span>
            <button
              type="button"
              onClick={() => void submitContact()}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Enviando…
                </>
              ) : (
                <>
                  Quero a proposta <ArrowUp className="size-4" />
                </>
              )}
            </button>
          </div>
        </div>
      );
    }

    if (phase === "done") {
      return (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
          <p className="text-sm text-emerald-100">
            Recebi tudo. Te chamo no WhatsApp pra marcar a call da proposta.
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
        <div className="max-w-[85%] rounded-2xl rounded-br-md border border-brand/30 bg-brand/15 px-4 py-2.5 text-sm text-white">
          {msg.text}
        </div>
      </div>
    );
  }
  return (
    <div className="ll-fade-up flex items-start gap-2.5">
      <div
        className="mt-0.5 size-6 shrink-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, #fff, var(--brand) 60%, transparent)",
          boxShadow:
            "0 0 10px 1px color-mix(in oklab, var(--brand) 60%, transparent)",
        }}
        aria-hidden
      />
      <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm leading-relaxed text-zinc-100">
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
          className="size-1.5 rounded-full bg-zinc-400"
          style={{ animation: `ll-dot 1.2s ease-in-out ${i * 0.15}s infinite` }}
        />
      ))}
    </span>
  );
}
