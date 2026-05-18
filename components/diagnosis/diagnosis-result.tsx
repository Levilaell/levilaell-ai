import {
  CheckCircle2,
  Calendar,
  Flame,
  Lightbulb,
  Sparkles,
  Target,
  TrendingDown,
  Rocket,
} from "lucide-react";
import { Callout } from "@/components/ui/callout";
import { SchedulingButton } from "@/components/ui/scheduling-button";
import { formatLongDate } from "@/lib/utils";
import {
  isLegacyAnalysis,
  type DiagnosisAnalysis,
  type DiagnosisAnalysisLegacy,
  type DiagnosisAnalysisV2,
  type LegacyRecommendedApproach,
  type RecommendedApproachV2,
} from "@/types/diagnosis";

// =============================================================================
// Labels + CTA — V2 e Legacy coexistem (4 diagnósticos antigos + 3 examples.ts
// ainda renderizam via legacy branch).
// =============================================================================
const approachLabelsV2: Record<RecommendedApproachV2, string> = {
  diy: "Faça você mesmo",
  conversa: "Conversa exploratória (30 min)",
  proposta_formal: "Proposta formal de projeto",
};

const approachLabelsLegacy: Record<LegacyRecommendedApproach, string> = {
  diy: "Faça você mesmo",
  consultoria_pontual: "Consultoria pontual",
  parceria_continua: "Parceria contínua",
  ainda_nao_e_hora: "Automação ainda não é prioridade",
};

type CtaCopy = { eyebrow: string; title: string; subtitle: string; button: string };

const ctaByApproachV2: Record<RecommendedApproachV2, CtaCopy> = {
  diy: {
    eyebrow: "Próxima conversa",
    title: "Travou na implementação?",
    subtitle:
      "Te explicamos o caminho mais curto numa conversa de 30 minutos. Sem pitch.",
    button: "Tirar dúvidas em uma conversa",
  },
  conversa: {
    eyebrow: "Próxima conversa",
    title: "Vamos refinar isso juntos?",
    subtitle:
      "Uma conversa de 30 min mapeia o caminho mais curto pro seu caso. Sem pitch.",
    button: "Agendar conversa",
  },
  proposta_formal: {
    eyebrow: "Próxima conversa",
    title: "Vamos discutir um projeto formal",
    subtitle:
      "Quando o cenário pede projeto sério, alinhamos escopo, prazos e métricas numa conversa.",
    button: "Agendar conversa estratégica",
  },
};

const ctaByApproachLegacy: Record<LegacyRecommendedApproach, CtaCopy> = {
  diy: {
    eyebrow: "Próxima conversa",
    title: "Travou na implementação?",
    subtitle:
      "Te explicamos o caminho mais curto numa conversa de 30 minutos. Sem pitch.",
    button: "Tirar dúvidas em uma conversa",
  },
  ainda_nao_e_hora: {
    eyebrow: "Conversa exploratória",
    title: "Quer pensar isso com a gente?",
    subtitle:
      "Mesmo se automação não é prioridade agora, a gente pode mapear quando vai ser. Sem pitch.",
    button: "Agendar 20 min",
  },
  consultoria_pontual: {
    eyebrow: "Próxima conversa",
    title: "Quer implementar isso com apoio especializado?",
    subtitle:
      "Oferecemos uma conversa de 30 minutos sem compromisso para discutir esse plano em profundidade.",
    button: "Agendar conversa",
  },
  parceria_continua: {
    eyebrow: "Próxima conversa",
    title: "Vamos discutir uma parceria",
    subtitle:
      "Quando faz sentido trabalhar contínuo, a gente alinha escopo, ritmo e custo numa conversa.",
    button: "Agendar conversa estratégica",
  },
};

// V2 + Legacy timeline values coexistem. Dict acumula ambos.
const timelineMeta: Record<
  string,
  { label: string; emoji: string }
> = {
  // V2
  para_ontem: { label: "Urgente", emoji: "🔥" },
  proximo_mes: { label: "Próximo mês", emoji: "⚡" },
  tres_meses: { label: "Próximos 3 meses", emoji: "📅" },
  sem_urgencia: { label: "Exploratório", emoji: "🌱" },
  // Legacy
  this_week: { label: "Urgente", emoji: "🔥" },
  next_month: { label: "Próximo mês", emoji: "⚡" },
  "3_to_6_months": { label: "Médio prazo", emoji: "📅" },
  no_urgency: { label: "Exploratório", emoji: "🌱" },
};

type Props = {
  name: string;
  createdAt: string;
  analysis: DiagnosisAnalysis;
  timeline?: string;
  context?: "personal" | "example";
  diagnosisId?: string;
};

export function DiagnosisResult(props: Props) {
  // Branch: legacy renders the pre-2026-05-18 structure (4 diagnoses no banco
  // + 3 hardcoded em content/examples.ts). V2 é o que sai do submit V2.
  if (isLegacyAnalysis(props.analysis)) {
    return <LegacyDiagnosisResult {...props} analysis={props.analysis} />;
  }
  return <V2DiagnosisResult {...props} analysis={props.analysis} />;
}

// =============================================================================
// V2 — diagnóstico contábil
// =============================================================================
function V2DiagnosisResult({
  name,
  createdAt,
  analysis,
  timeline,
  context = "personal",
  diagnosisId,
}: Omit<Props, "analysis"> & { analysis: DiagnosisAnalysisV2 }) {
  return (
    <article className="space-y-12">
      <header className="space-y-4 border-b border-border pb-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <Sparkles className="size-3.5 text-brand" aria-hidden />
            Diagnóstico contábil com IA
          </span>
          {timeline && timelineMeta[timeline] && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-medium">
              <span aria-hidden>{timelineMeta[timeline].emoji}</span>
              {timelineMeta[timeline].label}
            </span>
          )}
        </div>
        <h1 className="heading-1">
          {context === "example" ? `Exemplo: ${name}` : `Para: ${name}`}
        </h1>
        <p className="text-sm text-muted-foreground font-mono">
          {formatLongDate(createdAt)}
        </p>
      </header>

      <Section
        eyebrow="Sua situação"
        title="O retrato do seu escritório hoje"
        icon={<Target className="size-5 text-foreground" aria-hidden />}
      >
        <p className="text-base md:text-lg leading-relaxed text-foreground/90">
          {analysis.diagnostico_resumido}
        </p>
      </Section>

      <Section
        eyebrow="Gargalo principal"
        title="O ponto onde a equipe trava primeiro"
        icon={<TrendingDown className="size-5 text-foreground" aria-hidden />}
      >
        <div className="rounded-2xl border border-border bg-card p-6 md:p-7 space-y-3">
          <p className="font-semibold text-base md:text-lg">
            {analysis.gargalo_principal.area}
          </p>
          <p className="text-sm md:text-base text-foreground/90 leading-relaxed">
            {analysis.gargalo_principal.descricao}
          </p>
          <p className="text-sm text-muted-foreground">
            Impacto estimado:{" "}
            <strong className="text-foreground/90">
              {analysis.gargalo_principal.impacto_estimado}
            </strong>
          </p>
        </div>
      </Section>

      <Section
        eyebrow="Top 3 oportunidades"
        title="Onde atacar primeiro — em ordem de prioridade"
        icon={<Flame className="size-5 text-foreground" aria-hidden />}
      >
        <ol className="space-y-5">
          {analysis.tres_oportunidades.map((op, i) => (
            <li
              key={i}
              className="rounded-2xl border border-border bg-card p-6 md:p-7"
            >
              <div className="flex items-start gap-5">
                <span
                  aria-hidden
                  className="font-mono text-3xl font-semibold text-brand shrink-0"
                >
                  0{i + 1}
                </span>
                <div className="flex-1 min-w-0 space-y-3">
                  <h3 className="font-semibold text-lg leading-snug">
                    {op.titulo}
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                    {op.descricao}
                  </p>
                  <p className="text-sm md:text-base text-foreground/90 leading-relaxed">
                    Complexidade: <strong>{op.complexidade}</strong>. Prazo:{" "}
                    <strong>{op.prazo_implementacao}</strong>. Impacto:{" "}
                    <strong>{op.impacto_estimado}</strong>.
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        eyebrow="Plano 30 / 60 / 90 dias"
        title="O caminho prático nas próximas semanas"
        icon={<Calendar className="size-5 text-foreground" aria-hidden />}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <PhaseCard label="30 dias" value={analysis.plano_30_60_90["30_dias"]} />
          <PhaseCard label="60 dias" value={analysis.plano_30_60_90["60_dias"]} />
          <PhaseCard label="90 dias" value={analysis.plano_30_60_90["90_dias"]} />
        </div>
      </Section>

      <Section
        eyebrow="Próximo passo"
        title="A abordagem mais inteligente pro seu caso"
        icon={<CheckCircle2 className="size-5 text-foreground" aria-hidden />}
      >
        <div className="rounded-2xl border border-border bg-card p-6 md:p-7">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            {approachLabelsV2[analysis.proximo_passo_recomendado.abordagem]}
          </p>
          <p className="mt-3 text-base md:text-lg leading-relaxed text-foreground/90">
            {analysis.proximo_passo_recomendado.justificativa}
          </p>
        </div>
      </Section>

      <Section
        eyebrow="Alerta estratégico"
        title="Algo que você precisa ouvir mesmo que não goste"
        icon={<Lightbulb className="size-5 text-foreground" aria-hidden />}
      >
        <Callout tone="alert">
          <p className="text-base md:text-lg leading-relaxed">
            {analysis.alerta_estrategico}
          </p>
        </Callout>
      </Section>

      {context === "personal" && (() => {
        const cta = ctaByApproachV2[analysis.proximo_passo_recomendado.abordagem];
        return (
          <section className="rounded-2xl border border-border bg-zinc-950 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-950 p-8 md:p-12 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-4">
              {cta.eyebrow}
            </p>
            <h2 className="heading-2">{cta.title}</h2>
            <p className="text-lead mt-4 max-w-xl mx-auto !text-zinc-300 dark:!text-zinc-700">
              {cta.subtitle}
            </p>
            <div className="mt-8 flex justify-center">
              <SchedulingButton
                size="xl"
                variant="white"
                subject={`Diagnóstico — ${name}`}
                label={cta.button}
                diagnosisId={diagnosisId}
                source="result_page"
              />
            </div>
          </section>
        );
      })()}
    </article>
  );
}

// =============================================================================
// Legacy — renderiza diagnósticos pre-2026-05-18 + examples.ts hardcoded
// =============================================================================
function LegacyDiagnosisResult({
  name,
  createdAt,
  analysis,
  timeline,
  context = "personal",
  diagnosisId,
}: Omit<Props, "analysis"> & { analysis: DiagnosisAnalysisLegacy }) {
  const isNotYet =
    analysis.proximo_passo_recomendado.abordagem === "ainda_nao_e_hora";

  return (
    <article className="space-y-12">
      <header className="space-y-4 border-b border-border pb-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <Sparkles className="size-3.5 text-brand" aria-hidden />
            Diagnóstico de operação com IA
          </span>
          {timeline && timelineMeta[timeline] && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-medium">
              <span aria-hidden>{timelineMeta[timeline].emoji}</span>
              {timelineMeta[timeline].label}
            </span>
          )}
        </div>
        <h1 className="heading-1">
          {context === "example" ? `Exemplo: ${name}` : `Para: ${name}`}
        </h1>
        <p className="text-sm text-muted-foreground font-mono">
          {formatLongDate(createdAt)}
        </p>
      </header>

      <Section
        eyebrow="Sua situação"
        title="O retrato da sua operação hoje"
        icon={<Target className="size-5 text-foreground" aria-hidden />}
      >
        <p className="text-base md:text-lg leading-relaxed text-foreground/90">
          {analysis.diagnostico_resumido}
        </p>
      </Section>

      <Section
        eyebrow="Top 3 oportunidades"
        title="Onde atacar primeiro — em ordem de prioridade"
        icon={<Flame className="size-5 text-foreground" aria-hidden />}
      >
        <ol className="space-y-5">
          {analysis.tres_oportunidades.map((op, i) => (
            <li
              key={i}
              className="rounded-2xl border border-border bg-card p-6 md:p-7"
            >
              <div className="flex items-start gap-5">
                <span
                  aria-hidden
                  className="font-mono text-3xl font-semibold text-brand shrink-0"
                >
                  0{i + 1}
                </span>
                <div className="flex-1 min-w-0 space-y-3">
                  <h3 className="font-semibold text-lg leading-snug">
                    {op.titulo}
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                    {op.descricao}
                  </p>
                  <p className="text-sm md:text-base text-foreground/90 leading-relaxed">
                    Impacto: <strong>{op.impacto_estimado}</strong>. Complexidade:{" "}
                    <strong>{op.complexidade}</strong>. Prazo de implementação:{" "}
                    <strong>{op.prazo_implementacao}</strong>.
                    {op.ferramentas_sugeridas.length > 0 && (
                      <>
                        {" "}
                        Ferramentas sugeridas:{" "}
                        <strong>{op.ferramentas_sugeridas.join(", ")}</strong>.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        eyebrow="Quick win"
        title="Algo pra você implementar em 1 semana"
        icon={<Rocket className="size-5 text-foreground" aria-hidden />}
      >
        <div className="rounded-2xl border border-border bg-card p-6 md:p-7">
          <p className="font-semibold text-base md:text-lg">
            {analysis.quick_win.titulo}
          </p>
          <ol className="mt-5 space-y-3 list-decimal list-outside pl-6 marker:font-mono marker:text-muted-foreground">
            {analysis.quick_win.passo_a_passo.map((step, i) => (
              <li
                key={i}
                className="text-sm md:text-base text-foreground/90 leading-relaxed"
              >
                {stripLeadingNumber(step)}
              </li>
            ))}
          </ol>
          {analysis.quick_win.ferramentas_necessarias.length > 0 && (
            <p className="mt-5 text-sm text-muted-foreground">
              Ferramentas necessárias:{" "}
              <strong className="text-foreground/90">
                {analysis.quick_win.ferramentas_necessarias.join(", ")}
              </strong>
              .
            </p>
          )}
        </div>
      </Section>

      <Section
        eyebrow="Estimativa de retorno"
        title="O custo de não automatizar"
        icon={<TrendingDown className="size-5 text-foreground" aria-hidden />}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Stat
            label="Horas recuperáveis/mês"
            value={String(analysis.estimativa_roi.horas_recuperaveis_mes)}
          />
          <Stat
            label="Valor estimado/mês"
            value={analysis.estimativa_roi.valor_estimado_mensal}
          />
          <Stat
            label="Tempo de payback"
            value={analysis.estimativa_roi.tempo_payback}
          />
        </div>
        {analysis.estimativa_roi.disclaimer && (
          <p className="mt-3 text-xs italic text-muted-foreground">
            {analysis.estimativa_roi.disclaimer}
          </p>
        )}
        {analysis.estimativa_roi.metodologia && (
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="font-mono uppercase tracking-widest">Método:</span>{" "}
            {analysis.estimativa_roi.metodologia}
          </p>
        )}
      </Section>

      <Section
        eyebrow="Próximo passo"
        title={
          isNotYet
            ? "Antes de pensar em automação"
            : "A abordagem mais inteligente pro seu caso"
        }
        icon={
          isNotYet ? (
            <Lightbulb className="size-5 text-foreground" aria-hidden />
          ) : (
            <CheckCircle2 className="size-5 text-foreground" aria-hidden />
          )
        }
      >
        <div
          className={
            isNotYet
              ? "rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-6 md:p-7"
              : "rounded-2xl border border-border bg-card p-6 md:p-7"
          }
        >
          <p
            className={
              isNotYet
                ? "text-xs font-mono uppercase tracking-widest text-amber-900 dark:text-amber-100"
                : "text-xs font-mono uppercase tracking-widest text-muted-foreground"
            }
          >
            {approachLabelsLegacy[analysis.proximo_passo_recomendado.abordagem]}
          </p>
          <p className="mt-3 text-base md:text-lg leading-relaxed text-foreground/90">
            {analysis.proximo_passo_recomendado.justificativa}
          </p>
        </div>
      </Section>

      <Section
        eyebrow="Alerta estratégico"
        title="Algo que você precisa ouvir mesmo que não goste"
        icon={<Lightbulb className="size-5 text-foreground" aria-hidden />}
      >
        <Callout tone="alert">
          <p className="text-base md:text-lg leading-relaxed">
            {analysis.alerta_estrategico}
          </p>
        </Callout>
      </Section>

      {context === "personal" && (() => {
        const cta = ctaByApproachLegacy[analysis.proximo_passo_recomendado.abordagem];
        return (
          <section className="rounded-2xl border border-border bg-zinc-950 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-950 p-8 md:p-12 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-4">
              {cta.eyebrow}
            </p>
            <h2 className="heading-2">{cta.title}</h2>
            <p className="text-lead mt-4 max-w-xl mx-auto !text-zinc-300 dark:!text-zinc-700">
              {cta.subtitle}
            </p>
            <div className="mt-8 flex justify-center">
              <SchedulingButton
                size="xl"
                variant="white"
                subject={`Diagnóstico — ${name}`}
                label={cta.button}
                diagnosisId={diagnosisId}
                source="result_page"
              />
            </div>
          </section>
        );
      })()}
    </article>
  );
}

function stripLeadingNumber(input: string): string {
  return input.replace(/^\s*\d+[.)]\s*/, "");
}

function Section({
  eyebrow,
  title,
  icon,
  children,
}: {
  eyebrow: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <div
          className="size-9 rounded-lg bg-muted grid place-items-center"
          aria-hidden
        >
          {icon}
        </div>
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            {eyebrow}
          </p>
          <h2 className="font-semibold text-xl md:text-2xl tracking-tight">
            {title}
          </h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function PhaseCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-mono uppercase tracking-widest text-brand mb-2">
        {label}
      </p>
      <p className="text-sm md:text-base text-foreground/90 leading-relaxed">
        {value}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
        {label}
      </p>
      <p className="text-2xl md:text-3xl font-semibold tracking-tight">
        {value}
      </p>
    </div>
  );
}
