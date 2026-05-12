"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DiagnosisProgress } from "@/components/diagnosis/diagnosis-progress";
import {
  DIAGNOSIS_QUESTIONS,
  REVENUE_OPTIONS,
  TOTAL_STEPS,
} from "@/lib/diagnosis-questions";
import {
  clearDraft,
  loadDraft,
  saveDraft,
  saveResult,
  type DiagnosisDraft,
  type StoredResult,
} from "@/lib/diagnosis-storage";
import { track } from "@/lib/tracking";
import { metaPixel } from "@/lib/tracking/meta";
import { googleTracking } from "@/lib/tracking/google";
import { EVENT_VALUE_BRL, leadTier } from "@/lib/tracking/types";
import type { DiagnosisSubmission, DiagnosisAnalysis } from "@/types/diagnosis";
import { cn } from "@/lib/utils";

type Answers = Partial<DiagnosisSubmission>;
type SubmitState = "idle" | "submitting" | "error";

export function DiagnosisForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setStep(draft.step);
      setAnswers(draft.answers);
    }
    setHydrated(true);
    track({ type: "diagnosis_started", data: { resumed: Boolean(draft) } });
    metaPixel.initiateCheckout();
    googleTracking.beginDiagnosis();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const draft: DiagnosisDraft = { step, answers };
    saveDraft(draft);
  }, [hydrated, step, answers]);

  // Abandono: dispara beforeunload se ainda não submeteu
  useEffect(() => {
    if (!hydrated) return;
    function handler() {
      if (submitState === "submitting") return;
      if (Object.keys(answers).length === 0) return;
      track({
        type: "diagnosis_abandoned",
        data: { last_step: step },
      });
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hydrated, step, answers, submitState]);

  const isLeadStep = step >= DIAGNOSIS_QUESTIONS.length;
  const currentQuestion = DIAGNOSIS_QUESTIONS[step];

  const canAdvance = useMemo(() => {
    if (isLeadStep) return false;
    if (!currentQuestion) return false;
    const value = answers[currentQuestion.field as keyof Answers];
    if (currentQuestion.type === "multi") {
      return Array.isArray(value) && value.length > 0;
    }
    if (currentQuestion.type === "single_with_other") {
      if (!value) return false;
      if (
        value === "other" &&
        !(answers[currentQuestion.otherField] as string | undefined)?.trim()
      ) {
        return false;
      }
      return true;
    }
    return Boolean(value);
  }, [answers, currentQuestion, isLeadStep]);

  function setAnswer<K extends keyof Answers>(field: K, value: Answers[K]) {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  }

  function handleNext() {
    if (currentQuestion) {
      const value = answers[currentQuestion.field as keyof Answers];
      track({
        type: "diagnosis_question_answered",
        data: {
          question: currentQuestion.id,
          field: currentQuestion.field,
          value: Array.isArray(value) ? value : (value ?? null),
        },
      });
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    setSubmitError(null);
    setSubmitState("submitting");
    try {
      const res = await fetch("/api/diagnosis/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Erro ${res.status}`);
      }
      const data = (await res.json()) as {
        id: string;
        event_id: string;
        analysis: DiagnosisAnalysis;
        createdAt: string;
        name: string;
        timeline?: string;
        lead_score: number;
      };
      const result: StoredResult = {
        id: data.id,
        createdAt: data.createdAt,
        name: data.name,
        analysis: data.analysis,
        timeline: data.timeline,
      };
      saveResult(result);
      clearDraft();
      track({
        type: "diagnosis_completed",
        data: { id: data.id, timeline: data.timeline, lead_score: data.lead_score },
      });

      // Pixel Lead + Google Ads/GA4 conversion. event_id = diagnosis_id casa
      // com o dispatch CAPI server-side pra Meta deduplicar.
      const tier = leadTier(data.lead_score);
      const leadValue =
        tier === "hot" ? EVENT_VALUE_BRL.hot_lead : EVENT_VALUE_BRL.lead;
      await metaPixel.lead({
        event_id: data.event_id,
        value: leadValue,
        email: answers.email,
        phone: answers.whatsapp,
        fullName: answers.name,
        leadQuality: tier,
      });
      if (tier === "hot") {
        googleTracking.generateHotLead({
          value: leadValue,
          email: answers.email,
        });
      } else {
        googleTracking.generateLead({
          value: leadValue,
          email: answers.email,
        });
      }

      router.push(`/diagnosis/result/${data.id}`);
    } catch (err) {
      setSubmitState("error");
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Não consegui enviar agora. Tenta de novo em alguns segundos.",
      );
    }
  }

  return (
    <div className="space-y-8">
      <DiagnosisProgress step={step} total={TOTAL_STEPS} />

      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 min-h-[360px]">
        {!isLeadStep && currentQuestion && (
          <QuestionStep
            key={currentQuestion.id}
            question={currentQuestion}
            answers={answers}
            setAnswer={setAnswer}
          />
        )}
        {isLeadStep && (
          <LeadCaptureStep answers={answers} setAnswer={setAnswer} />
        )}
      </div>

      {submitError && (
        <p className="text-sm text-destructive" role="alert">
          {submitError}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="lg"
          onClick={handleBack}
          disabled={step === 0 || submitState === "submitting"}
          className="rounded-xl"
        >
          <ArrowLeft className="size-4" aria-hidden /> Voltar
        </Button>

        {!isLeadStep ? (
          <Button
            variant="brand"
            size="lg"
            disabled={!canAdvance}
            onClick={handleNext}
            className="rounded-xl"
          >
            Avançar <ArrowRight className="size-4" aria-hidden />
          </Button>
        ) : (
          <Button
            variant="brand"
            size="lg"
            disabled={!isLeadValid(answers) || submitState === "submitting"}
            onClick={handleSubmit}
            className="rounded-xl"
          >
            {submitState === "submitting" ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Gerando análise…
              </>
            ) : (
              <>
                Receber meu diagnóstico <CheckCircle2 className="size-4" aria-hidden />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

function isLeadValid(a: Answers): boolean {
  return Boolean(
    a.name &&
      a.name.trim().length >= 2 &&
      a.email &&
      /.+@.+\..+/.test(a.email) &&
      a.consent,
  );
}

function QuestionStep({
  question,
  answers,
  setAnswer,
}: {
  question: (typeof DIAGNOSIS_QUESTIONS)[number];
  answers: Answers;
  setAnswer: <K extends keyof Answers>(f: K, v: Answers[K]) => void;
}) {
  return (
    <div>
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
        {question.id.toUpperCase()}
      </p>
      <h2 className="heading-3">{question.title}</h2>
      {"subtitle" in question && question.subtitle && (
        <p className="mt-2 text-sm text-muted-foreground">{question.subtitle}</p>
      )}
      <div className="mt-6 space-y-2.5">
        {question.options.map((opt) => {
          const emoji = "emoji" in opt ? (opt as { emoji?: string }).emoji : undefined;

          if (question.type === "multi") {
            const current = (answers[question.field] as string[]) ?? [];
            const checked = current.includes(opt.value);
            const max = question.max;
            const disabled = !checked && current.length >= max;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={checked}
                disabled={disabled}
                onClick={() => {
                  const next = checked
                    ? current.filter((v) => v !== opt.value)
                    : [...current, opt.value];
                  setAnswer(
                    question.field,
                    next as DiagnosisSubmission[typeof question.field],
                  );
                }}
                className={cn(
                  "w-full text-left rounded-xl border px-4 py-3.5 text-sm transition-colors flex items-center justify-between gap-3",
                  checked
                    ? "border-brand bg-brand/10 text-foreground"
                    : "border-border bg-background hover:border-brand/50 hover:bg-muted",
                  disabled && "opacity-40 cursor-not-allowed",
                )}
              >
                <span>{opt.label}</span>
                <span
                  className={cn(
                    "size-4 rounded border flex-shrink-0",
                    checked ? "bg-brand border-brand" : "border-border",
                  )}
                  aria-hidden
                />
              </button>
            );
          }

          const selected = answers[question.field] === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                setAnswer(
                  question.field,
                  opt.value as DiagnosisSubmission[typeof question.field],
                )
              }
              className={cn(
                "w-full text-left rounded-xl border px-4 py-3.5 text-sm transition-colors flex items-center gap-3",
                selected
                  ? "border-brand bg-brand/10 text-foreground"
                  : "border-border bg-background hover:border-brand/50 hover:bg-muted",
              )}
            >
              {emoji && <span className="text-lg" aria-hidden>{emoji}</span>}
              <span>{opt.label}</span>
            </button>
          );
        })}

        {question.type === "single_with_other" &&
          answers[question.field] === "other" && (
            <div className="pt-2">
              <Label
                htmlFor={question.otherField}
                className="text-xs text-muted-foreground"
              >
                {question.otherLabel}
              </Label>
              <Input
                id={question.otherField}
                value={(answers[question.otherField] as string | undefined) ?? ""}
                onChange={(e) => setAnswer(question.otherField, e.target.value)}
                placeholder="Descreva brevemente"
                className="mt-1.5"
              />
            </div>
          )}
      </div>
    </div>
  );
}

function LeadCaptureStep({
  answers,
  setAnswer,
}: {
  answers: Answers;
  setAnswer: <K extends keyof Answers>(f: K, v: Answers[K]) => void;
}) {
  return (
    <div>
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
        Q10 · Último passo
      </p>
      <h2 className="heading-3">Pra onde envio seu relatório?</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Seu diagnóstico chega no e-mail em até 2 minutos.
      </p>

      <div className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">
            Nome <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={answers.name ?? ""}
            onChange={(e) => setAnswer("name", e.target.value)}
            placeholder="Como prefere ser chamado"
            autoComplete="name"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">
            E-mail <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={answers.email ?? ""}
            onChange={(e) => setAnswer("email", e.target.value)}
            placeholder="seu@email.com"
            autoComplete="email"
          />
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-900 p-4 space-y-4">
          <p className="text-sm text-amber-950 dark:text-amber-100">
            💡 <strong>Quer estimativa de ROI mais precisa?</strong> Esses dados ajudam a IA a calcular retorno real (não chute).
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="whatsapp">
              WhatsApp <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="whatsapp"
              value={answers.whatsapp ?? ""}
              onChange={(e) => setAnswer("whatsapp", formatPhone(e.target.value))}
              placeholder="(11) 99999-9999"
              autoComplete="tel"
              inputMode="tel"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="company">
              Site/empresa <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="company"
              value={answers.company ?? ""}
              onChange={(e) => setAnswer("company", e.target.value)}
              placeholder="empresa.com.br"
              autoComplete="organization"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="revenue">
              Faturamento mensal aproximado{" "}
              <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Select
              value={(answers.q10_revenue as string | undefined) ?? ""}
              onValueChange={(v) =>
                setAnswer("q10_revenue", v as DiagnosisSubmission["q10_revenue"])
              }
            >
              <SelectTrigger id="revenue" className="w-full">
                <SelectValue placeholder="Selecione (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {REVENUE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="employees">
              Número de funcionários{" "}
              <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="employees"
              type="number"
              min={0}
              value={
                typeof answers.q10_employees === "number"
                  ? answers.q10_employees
                  : ""
              }
              onChange={(e) => {
                const n = Number(e.target.value);
                setAnswer(
                  "q10_employees",
                  Number.isFinite(n) && n >= 0 ? n : undefined,
                );
              }}
              placeholder="Ex: 12"
              inputMode="numeric"
            />
          </div>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer pt-2">
          <Checkbox
            checked={Boolean(answers.consent)}
            onCheckedChange={(v) => setAnswer("consent", Boolean(v))}
            id="consent"
          />
          <span className="text-sm text-muted-foreground leading-relaxed">
            Concordo em receber meu relatório por e-mail e aceito os{" "}
            <a href="/privacy" className="text-foreground underline underline-offset-2">
              termos de privacidade
            </a>
            .
          </span>
        </label>
      </div>
    </div>
  );
}

function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
