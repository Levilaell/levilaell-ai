import {
  CheckCircle2,
  Clock,
  Flame,
  Lightbulb,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Callout } from "@/components/ui/callout";
import { SchedulingButton } from "@/components/ui/scheduling-button";
import { formatLongDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { DiagnosisAnalysis } from "@/types/diagnosis";

const complexityStyles = {
  baixa: "bg-emerald-100 text-emerald-900 border-emerald-200",
  média: "bg-amber-100 text-amber-900 border-amber-200",
  alta: "bg-red-100 text-red-900 border-red-200",
} as const;

const approachLabels = {
  diy: "Faça você mesmo",
  consultoria_pontual: "Consultoria pontual",
  parceria_continua: "Parceria contínua",
} as const;

type Props = {
  name: string;
  createdAt: string;
  analysis: DiagnosisAnalysis;
  context?: "personal" | "example";
};

export function DiagnosisResult({ name, createdAt, analysis, context = "personal" }: Props) {
  return (
    <article className="space-y-12">
      <header className="space-y-4 border-b border-border pb-8">
        <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          <Sparkles className="size-3.5 text-brand" aria-hidden />
          Diagnóstico de operação com IA
        </span>
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
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-normal",
                        complexityStyles[op.complexidade],
                      )}
                    >
                      Complexidade: {op.complexidade}
                    </Badge>
                    <Badge variant="outline" className="font-normal">
                      <Clock className="size-3" aria-hidden /> {op.impacto_estimado}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg leading-snug">{op.titulo}</h3>
                  <p className="mt-2.5 text-sm md:text-base text-muted-foreground leading-relaxed">
                    {op.descricao}
                  </p>
                  {op.ferramentas_sugeridas.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {op.ferramentas_sugeridas.map((tool) => (
                        <span
                          key={tool}
                          className="inline-flex items-center rounded-md border border-border bg-muted/60 px-2 py-0.5 text-xs font-mono"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        eyebrow="Quick win"
        title={`Algo pra você implementar em 1 semana`}
        icon={<Rocket className="size-5 text-foreground" aria-hidden />}
      >
        <div className="rounded-2xl border border-border bg-card p-6 md:p-7">
          <p className="font-semibold text-base md:text-lg">
            {analysis.quick_win.titulo}
          </p>
          <ol className="mt-5 space-y-3 list-decimal list-inside marker:font-mono marker:text-muted-foreground">
            {analysis.quick_win.passo_a_passo.map((step, i) => (
              <li key={i} className="text-sm md:text-base text-foreground/90 leading-relaxed">
                {step}
              </li>
            ))}
          </ol>
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
      </Section>

      <Section
        eyebrow="Próximo passo"
        title="A abordagem mais inteligente pro seu caso"
        icon={<CheckCircle2 className="size-5 text-foreground" aria-hidden />}
      >
        <div className="rounded-2xl border border-border bg-card p-6 md:p-7">
          <Badge variant="outline" className="font-mono uppercase">
            {approachLabels[analysis.proximo_passo_recomendado.abordagem]}
          </Badge>
          <p className="mt-4 text-base md:text-lg leading-relaxed text-foreground/90">
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

      {context === "personal" && (
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
          <div className="mt-8">
            <SchedulingButton
              size="xl"
              subject={`Diagnóstico — ${name}`}
              label="Agendar call gratuita"
            />
          </div>
        </section>
      )}
    </article>
  );
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
        <div className="size-9 rounded-lg bg-muted grid place-items-center" aria-hidden>
          {icon}
        </div>
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            {eyebrow}
          </p>
          <h2 className="font-semibold text-xl md:text-2xl tracking-tight">{title}</h2>
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
      <p className="text-2xl md:text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
