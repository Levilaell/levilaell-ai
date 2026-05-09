"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Mail,
  MessageCircle,
  UserCheck,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/admin-format";
import type { LeadSummary } from "@/lib/admin-stats";
import type { DiagnosisAnalysis } from "@/types/diagnosis";

type Sequence = {
  email_number: number;
  scheduled_at: string;
  sent_at: string | null;
  status: "scheduled" | "sent" | "failed" | "cancelled";
  error_message: string | null;
};

type FullDiagnosis = {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  company: string | null;
  q1_size: string;
  q2_business_model: string;
  q3_pain_areas: string[];
  q4_tech_maturity: string;
  q5_hours_weekly: string;
  q6_automation_history: string;
  q7_main_goal: string;
  q8_timeline: string;
  q9_budget: string;
  q10_revenue: string | null;
  q10_employees: number | null;
  ai_analysis: DiagnosisAnalysis | null;
  lead_score: number | null;
  contacted_at: string | null;
  qualified_at: string | null;
  lead_notes: string | null;
};

type Detail = {
  diagnosis: FullDiagnosis;
  email_sequences: Sequence[];
};

type Props = {
  lead: LeadSummary | null;
  onClose: () => void;
  onUpdated: (id: string, patch: Partial<LeadSummary>) => void;
};

export function LeadDetailModal({ lead, onClose, onUpdated }: Props) {
  return (
    <Dialog open={Boolean(lead)} onOpenChange={(o) => !o && onClose()}>
      <DialogPopup size="full">
        {lead && (
          <Body
            key={lead.id}
            lead={lead}
            onUpdated={onUpdated}
            onClose={onClose}
          />
        )}
      </DialogPopup>
    </Dialog>
  );
}

function Body({
  lead,
  onUpdated,
  onClose,
}: {
  lead: LeadSummary;
  onUpdated: (id: string, patch: Partial<LeadSummary>) => void;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, startSavingNotes] = useTransition();
  const [savingFlag, startSavingFlag] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/leads/${lead.id}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `Erro ${res.status}`);
        }
        const body = (await res.json()) as Detail;
        if (cancelled) return;
        setDetail(body);
        setNotes(body.diagnosis.lead_notes ?? "");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro ao carregar.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lead.id]);

  const flip = (flag: "contacted" | "qualified", value: boolean) => {
    startSavingFlag(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/admin/leads/${lead.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [flag]: value }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error ?? `Erro ${res.status}`);
        const updated = body.lead as Pick<
          FullDiagnosis,
          "contacted_at" | "qualified_at" | "lead_notes"
        >;
        setDetail((prev) =>
          prev ? { ...prev, diagnosis: { ...prev.diagnosis, ...updated } } : prev,
        );
        onUpdated(lead.id, {
          contacted_at: updated.contacted_at,
          qualified_at: updated.qualified_at,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro.");
      }
    });
  };

  const saveNotes = () => {
    startSavingNotes(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/admin/leads/${lead.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: notes.trim() || null }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error ?? `Erro ${res.status}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar notas.");
      }
    });
  };

  const score = lead.lead_score ?? 0;

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-semibold tabular-nums",
              score >= 80
                ? "bg-amber-500 text-white"
                : score >= 60
                  ? "bg-foreground text-background"
                  : "bg-zinc-300 text-zinc-700",
            )}
          >
            {score}
          </span>
          <div className="min-w-0">
            <DialogTitle className="truncate">
              {lead.name}
              {lead.company && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  · {lead.company}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Diagnóstico {relativeTime(lead.created_at)} · lead_score{" "}
              {lead.lead_score ?? "—"}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {loading && (
        <div className="flex items-center gap-2 px-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Carregando…
        </div>
      )}

      {error && (
        <p className="rounded-md bg-rose-50 p-2 text-sm text-rose-800">
          {error}
        </p>
      )}

      {detail && (
        <div className="space-y-5">
          <ContactBlock detail={detail} />
          <ActionsBlock
            detail={detail}
            onContacted={(v) => flip("contacted", v)}
            onQualified={(v) => flip("qualified", v)}
            saving={savingFlag}
            onClose={onClose}
          />
          <NotesBlock
            value={notes}
            onChange={setNotes}
            onSave={saveNotes}
            saving={savingNotes}
            initial={detail.diagnosis.lead_notes ?? ""}
          />
          <AnswersBlock detail={detail} />
          <AnalysisBlock analysis={detail.diagnosis.ai_analysis} />
          <SequenceBlock sequences={detail.email_sequences} />
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-blocks
// ---------------------------------------------------------------------------
function ContactBlock({ detail }: { detail: Detail }) {
  const d = detail.diagnosis;
  const wppDigits = (d.whatsapp ?? "").replace(/\D/g, "");
  const wppHref = wppDigits
    ? `https://wa.me/${wppDigits.startsWith("55") ? wppDigits : `55${wppDigits}`}`
    : null;
  return (
    <section className="rounded-xl border border-border/60 bg-muted/30 p-3">
      <h4 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Contato
      </h4>
      <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
        <Field label="Email">
          <a className="hover:underline" href={`mailto:${d.email}`}>
            {d.email}
          </a>
        </Field>
        {d.whatsapp && (
          <Field label="WhatsApp">
            {wppHref ? (
              <a
                className="inline-flex items-center gap-1 hover:underline"
                href={wppHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                {d.whatsapp}
                <ExternalLink className="size-3" aria-hidden />
              </a>
            ) : (
              d.whatsapp
            )}
          </Field>
        )}
        {d.q10_revenue && <Field label="Faturamento">{d.q10_revenue}</Field>}
        {typeof d.q10_employees === "number" && (
          <Field label="Funcionários">{d.q10_employees}</Field>
        )}
      </dl>
    </section>
  );
}

function ActionsBlock({
  detail,
  onContacted,
  onQualified,
  saving,
  onClose,
}: {
  detail: Detail;
  onContacted: (v: boolean) => void;
  onQualified: (v: boolean) => void;
  saving: boolean;
  onClose: () => void;
}) {
  const d = detail.diagnosis;
  const isContacted = Boolean(d.contacted_at);
  const isQualified = Boolean(d.qualified_at);
  const wppDigits = (d.whatsapp ?? "").replace(/\D/g, "");
  const wppHref = wppDigits
    ? `https://wa.me/${wppDigits.startsWith("55") ? wppDigits : `55${wppDigits}`}?text=${encodeURIComponent(`Olá ${d.name.split(/\s+/)[0]}, vi seu diagnóstico aqui.`)}`
    : null;

  return (
    <section className="flex flex-wrap gap-2">
      {wppHref && (
        <Button
          asChild
          size="sm"
          variant="brand"
          className="rounded-lg"
          onClick={onClose}
        >
          <a href={wppHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="size-4" aria-hidden />
            Abrir WhatsApp
          </a>
        </Button>
      )}
      <Button
        size="sm"
        variant={isContacted ? "secondary" : "outline"}
        onClick={() => onContacted(!isContacted)}
        disabled={saving}
        className="rounded-lg"
      >
        {saving ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : isContacted ? (
          <Check className="size-4" aria-hidden />
        ) : (
          <UserCheck className="size-4" aria-hidden />
        )}
        {isContacted
          ? `Contatado ${relativeTime(d.contacted_at!)}`
          : "Marcar como contatado"}
      </Button>
      <Button
        size="sm"
        variant={isQualified ? "secondary" : "outline"}
        onClick={() => onQualified(!isQualified)}
        disabled={saving}
        className="rounded-lg"
      >
        {saving ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : isQualified ? (
          <CheckCircle2 className="size-4" aria-hidden />
        ) : (
          <CheckCircle2 className="size-4" aria-hidden />
        )}
        {isQualified
          ? `Qualificado ${relativeTime(d.qualified_at!)}`
          : "Marcar como qualificado"}
      </Button>
    </section>
  );
}

function NotesBlock({
  value,
  onChange,
  onSave,
  saving,
  initial,
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  initial: string;
}) {
  const dirty = value.trim() !== initial.trim();
  return (
    <section>
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Notas internas
        </h4>
        {dirty && (
          <Button
            size="xs"
            variant="outline"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="size-3 animate-spin" aria-hidden />
            ) : (
              <Check className="size-3" aria-hidden />
            )}
            Salvar
          </Button>
        )}
      </div>
      <Textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Algo importante sobre esse lead?"
        className="mt-1.5 text-[13px]"
      />
    </section>
  );
}

const PAIN_LABELS: Record<string, string> = {
  lead_attendance: "Atendimento",
  onboarding: "Onboarding",
  reports_dashboards: "Relatórios",
  billing: "Cobrança",
  client_communication: "Comunicação",
  internal_approvals: "Aprovações",
  document_analysis: "Documentos",
  system_integration: "Integrações",
  marketing_nurturing: "Marketing",
  sales_followup: "Follow-up",
};

const SIZE_LABELS: Record<string, string> = {
  solo: "Solo",
  small_2_10: "2-10",
  medium_11_50: "11-50",
  large_51_200: "51-200",
  enterprise_200_plus: "200+",
};

function AnswersBlock({ detail }: { detail: Detail }) {
  const d = detail.diagnosis;
  const pains = (d.q3_pain_areas ?? [])
    .map((p) => PAIN_LABELS[p] ?? p)
    .join(", ");
  return (
    <section className="rounded-xl border border-border/60 bg-muted/30 p-3">
      <h4 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Diagnóstico
      </h4>
      <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
        <Field label="Tamanho">{SIZE_LABELS[d.q1_size] ?? d.q1_size}</Field>
        <Field label="Modelo">{d.q2_business_model}</Field>
        <Field label="Dores">{pains}</Field>
        <Field label="Maturidade">{d.q4_tech_maturity}</Field>
        <Field label="Horas/sem">{d.q5_hours_weekly}</Field>
        <Field label="Histórico">{d.q6_automation_history}</Field>
        <Field label="Objetivo">{d.q7_main_goal}</Field>
        <Field label="Urgência">{d.q8_timeline}</Field>
        <Field label="Orçamento">{d.q9_budget}</Field>
      </dl>
    </section>
  );
}

function AnalysisBlock({
  analysis,
}: {
  analysis: DiagnosisAnalysis | null;
}) {
  if (!analysis) {
    return (
      <section className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
        Análise da IA não disponível.
      </section>
    );
  }
  return (
    <section className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3">
      <h4 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Análise da IA
      </h4>
      <p className="text-sm">{analysis.diagnostico_resumido}</p>

      <div className="space-y-2.5">
        <h5 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Top 3 oportunidades
        </h5>
        <ol className="space-y-2.5">
          {analysis.tres_oportunidades.map((op, i) => (
            <li
              key={i}
              className="rounded-lg border border-border bg-background p-3 text-sm"
            >
              <p className="font-medium">
                {i + 1}. {op.titulo}
              </p>
              <p className="mt-1 text-muted-foreground">{op.descricao}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Impacto: <strong>{op.impacto_estimado}</strong> · Complexidade:{" "}
                {op.complexidade} · {op.prazo_implementacao}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-lg border border-border bg-background p-3 text-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Quick win
        </p>
        <p className="mt-1 font-medium">{analysis.quick_win.titulo}</p>
        <ol className="mt-1.5 list-decimal space-y-0.5 pl-5 text-muted-foreground">
          {analysis.quick_win.passo_a_passo.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </div>

      <div className="rounded-lg border border-border bg-background p-3 text-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          ROI estimado
        </p>
        <p className="mt-1">
          <strong>{analysis.estimativa_roi.valor_estimado_mensal}</strong> ·
          payback {analysis.estimativa_roi.tempo_payback}
        </p>
        {analysis.estimativa_roi.disclaimer && (
          <p className="mt-1 text-xs italic text-muted-foreground">
            {analysis.estimativa_roi.disclaimer}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-amber-900">
          Recomendação
        </p>
        <p className="mt-1 font-medium text-amber-900">
          {analysis.proximo_passo_recomendado.abordagem}
        </p>
        <p className="mt-1 text-amber-900/85">
          {analysis.proximo_passo_recomendado.justificativa}
        </p>
      </div>
    </section>
  );
}

function SequenceBlock({ sequences }: { sequences: Sequence[] }) {
  if (sequences.length === 0) {
    return (
      <section className="text-xs text-muted-foreground">
        Nenhum email de sequence agendado.
      </section>
    );
  }
  return (
    <section className="rounded-xl border border-border/60 bg-muted/30 p-3">
      <h4 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Sequence de e-mails
      </h4>
      <ul className="mt-2 space-y-1.5 text-sm">
        {sequences.map((s) => {
          const icon =
            s.status === "sent" ? (
              <Mail className="size-3.5 text-emerald-700" aria-hidden />
            ) : s.status === "failed" ? (
              <XCircle className="size-3.5 text-rose-700" aria-hidden />
            ) : s.status === "cancelled" ? (
              <XCircle className="size-3.5 text-zinc-400" aria-hidden />
            ) : (
              <Clock className="size-3.5 text-muted-foreground" aria-hidden />
            );
          return (
            <li key={s.email_number} className="flex items-center gap-2">
              {icon}
              <span className="min-w-[62px] text-xs text-muted-foreground">
                Email {s.email_number}
              </span>
              <span className="text-xs">
                {s.sent_at
                  ? `enviado ${relativeTime(s.sent_at)}`
                  : s.status === "scheduled"
                    ? `agendado pra ${relativeTime(s.scheduled_at)}`
                    : s.status}
              </span>
              {s.error_message && (
                <span className="ml-auto text-xs text-rose-700">
                  {s.error_message}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <dt className="min-w-[88px] text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}
