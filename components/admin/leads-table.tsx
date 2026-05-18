"use client";

import { CheckCircle2, MessageCircle, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/admin-format";
import type { LeadSummary } from "@/lib/admin-stats";

// Listing mostra ERP (V2) ou modelo de negócio (legacy). Ambos coexistem
// porque mudamos de público em 2026-05-18 e os leads antigos seguem visíveis.
const ERP_LABELS: Record<string, string> = {
  dominio: "Domínio",
  onvio: "Onvio",
  alterdata: "Alterdata",
  sage: "Sage",
  contmatic: "Contmatic",
  mastermaq: "MasterMaq",
  outro_planilha: "Outro/planilha",
};

const BUSINESS_LABELS: Record<string, string> = {
  b2b_services: "Serviços B2B",
  ecommerce: "E-commerce",
  infoproduct: "Infoproduto",
  saas: "SaaS",
  b2c_services: "Serviços B2C",
  industry: "Indústria",
  other: "Outro",
};

const TIMELINE_LABELS: Record<string, string> = {
  // V2 contábil
  para_ontem: "🔥 Pra ontem",
  proximo_mes: "⚡ Próximo mês",
  tres_meses: "📅 3 meses",
  sem_urgencia: "🌱 Exploratório",
  // Legacy v1
  this_week: "🔥 Esta semana",
  next_month: "⚡ Próximo mês",
  "3_to_6_months": "📅 3-6 meses",
  no_urgency: "🌱 Exploratório",
};

export function LeadsTable({
  leads,
  onSelect,
}: {
  leads: LeadSummary[];
  onSelect: (lead: LeadSummary) => void;
}) {
  if (leads.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-border/80 px-6 py-10 text-center text-sm text-muted-foreground">
        Nenhum diagnóstico completado ainda.
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card ring-1 ring-foreground/5">
      <header className="border-b border-border/60 px-4 py-3">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Top leads (lead_score)
        </h2>
      </header>
      <ul className="divide-y divide-border/50">
        {leads.map((l) => {
          const score = l.lead_score ?? 0;
          const tone =
            score >= 80
              ? "bg-amber-50 hover:bg-amber-100"
              : score >= 60
                ? "hover:bg-muted/40"
                : "bg-zinc-50/50 hover:bg-zinc-100/60";
          return (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => onSelect(l)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                  tone,
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xs font-semibold tabular-nums",
                    score >= 80
                      ? "bg-amber-500 text-white"
                      : score >= 60
                        ? "bg-foreground text-background"
                        : "bg-zinc-300 text-zinc-700",
                  )}
                  aria-label={`lead score ${score}`}
                >
                  {score}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-medium">{l.name}</span>
                    {l.company && (
                      <span className="text-xs text-muted-foreground">
                        · {l.company}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                    <span>
                      {l.q2_erp
                        ? (ERP_LABELS[l.q2_erp] ?? l.q2_erp)
                        : l.q2_business_model
                          ? (BUSINESS_LABELS[l.q2_business_model] ??
                            l.q2_business_model)
                          : "(sem perfil)"}
                    </span>
                    <span>·</span>
                    <span>
                      {TIMELINE_LABELS[l.q8_timeline] ?? l.q8_timeline}
                    </span>
                    <span>·</span>
                    <span>{relativeTime(l.created_at)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-[11px]">
                  {l.qualified_at && (
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 className="size-3" aria-hidden /> qualificado
                    </span>
                  )}
                  {l.contacted_at && !l.qualified_at && (
                    <span className="inline-flex items-center gap-1 text-blue-700">
                      <UserCheck className="size-3" aria-hidden /> contatado
                    </span>
                  )}
                  {!l.contacted_at && !l.qualified_at && l.whatsapp && (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <MessageCircle className="size-3" aria-hidden /> wpp
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
