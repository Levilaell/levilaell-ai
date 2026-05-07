import {
  CheckCircle2,
  Flame,
  Lightbulb,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Callout } from "@/components/ui/callout";
import { SchedulingButton } from "@/components/ui/scheduling-button";
import { formatLongDate } from "@/lib/utils";
import type { DiagnosisAnalysis, RecommendedApproach } from "@/types/diagnosis";

const approachLabels: Record<RecommendedApproach, string> = {
  diy: "Faça você mesmo",
  consultoria_pontual: "Consultoria pontual",
  parceria_continua: "Parceria contínua",
  ainda_nao_e_hora: "Automação ainda não é prioridade",
};

const timelineMeta: Record<
  string,
  { label: string; emoji: string; tone: "alert" | "info" | "warning" | "success" }
> = {
  this_week: { label: "Urgente", emoji: "🔥", tone: "alert" },
  next_month: { label: "Próximo mês", emoji: "⚡", tone: "info" },
  "3_to_6_months": { label: "Médio prazo", emoji: "📅", tone: "info" },
  no_urgency: { label: "Exploratório", emoji: "🌱", tone: "success" },
};

type Props = {
  name: string;
  createdAt: string;
  analysis: DiagnosisAnalysis;
  timeline?: string;
  context?: "personal" | "example";
};

export function DiagnosisResult({
  name,
  createdAt,
  analysis,
  timeline,
  context = "personal",
}: Props) {
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
        icon={<TrendingUp className="size-5 text-foreground" aria-hidden />}
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
            {approachLabels[analysis.proximo_passo_recomendado.abordagem]}
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

      {context === "personal" && !isNotYet && (
        <section className="rounded-2xl border border-border bg-zinc-950 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-950 p-8 md:p-12 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-4">
            Próxima conversa
          </p>
          <h2 className="heading-2">
            Quer implementar isso com apoio especializado?
          </h2>
          <p className="text-lead mt-4 max-w-xl mx-auto !text-zinc-300 dark:!text-zinc-700">
            Eu ofereço uma call de 30 minutos sem compromisso para discutir esse plano em profundidade.
          </p>
          <div className="mt-8 flex justify-center">
            <SchedulingButton
              size="xl"
              variant="white"
              subject={`Diagnóstico — ${name}`}
              label="Agendar call gratuita"
            />
          </div>
        </section>
      )}
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
