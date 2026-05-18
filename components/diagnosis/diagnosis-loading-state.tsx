"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Target, TrendingDown, Flame, Calendar, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/tracking";

type Props = {
  id: string;
  /**
   * Nome opcional pra preencher o header do skeleton — vem do SSR quando
   * disponível. Sem nome, mostra "Pra você" pra evitar parecer skeleton vazio.
   */
  name?: string | null;
};

const LOADING_MESSAGES = [
  "Analisando sua carteira de clientes...",
  "Mapeando ERP e perfil tributário...",
  "Identificando gargalos prioritários...",
  "Cruzando com operações similares...",
  "Calibrando próximo passo recomendado...",
  "Gerando seu plano 30/60/90 dias...",
  "Finalizando análise estratégica...",
] as const;

// Backoff exponencial leve: 1,1,1,2,2,3,3,5,5,5,5... capped 5s.
const POLL_INTERVALS_MS = [1000, 1000, 1000, 2000, 2000, 3000, 3000, 5000];
const POLL_TIMEOUT_MS = 90_000;
const MESSAGE_INTERVAL_MS = 5_000;

type PollState = "polling" | "completed" | "failed" | "timeout";

export function DiagnosisLoadingState({ id, name }: Props) {
  const router = useRouter();
  const mountedAtRef = useRef(Date.now());
  const [messageIndex, setMessageIndex] = useState(0);
  const [pollState, setPollState] = useState<PollState>("polling");

  // Dispara o evento de visualização uma única vez.
  useEffect(() => {
    track({
      type: "diagnosis_loading_viewed",
      data: { id },
    });
    // Eslint quer `id` nos deps; com dep estável o efeito ainda só roda 1x
    // (mount).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rotação de mensagens (a cada 5s, cíclica).
  useEffect(() => {
    if (pollState !== "polling") return;
    const t = setInterval(() => {
      setMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, MESSAGE_INTERVAL_MS);
    return () => clearInterval(t);
  }, [pollState]);

  // Polling. Usamos cancelToken pra evitar setState em componente desmontado
  // e pra cortar a cadeia se o usuário fechar a aba (cleanup).
  useEffect(() => {
    let cancelled = false;
    let pollIdx = 0;

    async function poll(): Promise<void> {
      if (cancelled) return;
      const elapsed = Date.now() - mountedAtRef.current;
      if (elapsed >= POLL_TIMEOUT_MS) {
        setPollState("timeout");
        track({
          type: "diagnosis_loading_failed",
          data: { id, reason: "timeout", wait_ms: elapsed },
        });
        return;
      }

      try {
        const res = await fetch(`/api/diagnosis/${id}/status`, {
          cache: "no-store",
        });
        if (cancelled) return;

        if (res.ok) {
          const data = (await res.json()) as {
            status: "pending" | "completed" | "failed";
            ready: boolean;
            error?: string;
          };
          if (data.status === "completed") {
            const wait = Date.now() - mountedAtRef.current;
            track({
              type: "diagnosis_loading_completed",
              data: { id, wait_ms: wait },
            });
            setPollState("completed");
            // Re-executa o RSC pra carregar o DiagnosisResult com o analysis.
            router.refresh();
            return;
          }
          if (data.status === "failed") {
            const wait = Date.now() - mountedAtRef.current;
            track({
              type: "diagnosis_loading_failed",
              data: { id, reason: "ai_failed", wait_ms: wait },
            });
            setPollState("failed");
            router.refresh();
            return;
          }
        }
        // 404 ou 5xx: continuamos polling enquanto o orçamento permite.
        // Endpoint /status pode dar 404 brevemente se o submit ainda tá
        // commitando o row — não fail-fast.
      } catch {
        // Network blip — ignora, próxima iteração tenta de novo.
      }

      const interval =
        POLL_INTERVALS_MS[Math.min(pollIdx, POLL_INTERVALS_MS.length - 1)];
      pollIdx += 1;
      setTimeout(poll, interval);
    }

    void poll();

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (pollState === "timeout") {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="heading-3">Ainda não consegui carregar.</h1>
        <p className="mt-3 text-muted-foreground">
          Deu mais tempo que o normal pra gerar sua análise. Se já recebeu o
          e-mail com o PDF, pode usar ele direto. Senão, recarrega esta página
          em alguns segundos.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button
            variant="brand"
            size="lg"
            className="rounded-xl"
            onClick={() => router.refresh()}
          >
            Recarregar página
          </Button>
        </div>
      </div>
    );
  }

  // pollState === "polling" — skeleton + mensagem.
  return (
    <article className="space-y-12">
      <header className="space-y-4 border-b border-border pb-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <Sparkles className="size-3.5 text-brand" aria-hidden />
            Diagnóstico contábil com IA
          </span>
        </div>
        <h1 className="heading-1">{name ? `Para: ${name}` : "Sua análise"}</h1>
        <p
          className="text-sm text-muted-foreground font-mono inline-flex items-center gap-2"
          aria-live="polite"
        >
          <span
            className="inline-block size-1.5 rounded-full bg-brand animate-pulse"
            aria-hidden
          />
          {LOADING_MESSAGES[messageIndex]}
        </p>
      </header>

      <SkeletonSection
        eyebrow="Sua situação"
        title="O retrato do seu escritório hoje"
        icon={<Target className="size-5 text-foreground" aria-hidden />}
      >
        <div className="space-y-2">
          <SkeletonBar widthClass="w-full" />
          <SkeletonBar widthClass="w-11/12" />
          <SkeletonBar widthClass="w-9/12" />
        </div>
      </SkeletonSection>

      <SkeletonSection
        eyebrow="Gargalo principal"
        title="O ponto onde a equipe trava primeiro"
        icon={<TrendingDown className="size-5 text-foreground" aria-hidden />}
      >
        <div className="rounded-2xl border border-border bg-card p-6 md:p-7 space-y-3">
          <SkeletonBar widthClass="w-5/12" heightClass="h-5" />
          <SkeletonBar widthClass="w-full" />
          <SkeletonBar widthClass="w-10/12" />
          <SkeletonBar widthClass="w-7/12" heightClass="h-3" />
        </div>
      </SkeletonSection>

      <SkeletonSection
        eyebrow="Top 3 oportunidades"
        title="Onde atacar primeiro — em ordem de prioridade"
        icon={<Flame className="size-5 text-foreground" aria-hidden />}
      >
        <ol className="space-y-5">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="rounded-2xl border border-border bg-card p-6 md:p-7"
            >
              <div className="flex items-start gap-5">
                <span
                  aria-hidden
                  className="font-mono text-3xl font-semibold text-brand/30 shrink-0"
                >
                  0{i + 1}
                </span>
                <div className="flex-1 min-w-0 space-y-3">
                  <SkeletonBar widthClass="w-7/12" heightClass="h-5" />
                  <SkeletonBar widthClass="w-full" />
                  <SkeletonBar widthClass="w-11/12" />
                  <SkeletonBar widthClass="w-8/12" heightClass="h-3" />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </SkeletonSection>

      <SkeletonSection
        eyebrow="Plano 30 / 60 / 90 dias"
        title="O caminho prático nas próximas semanas"
        icon={<Calendar className="size-5 text-foreground" aria-hidden />}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-5 space-y-2"
            >
              <SkeletonBar widthClass="w-1/3" heightClass="h-3" />
              <SkeletonBar widthClass="w-full" />
              <SkeletonBar widthClass="w-10/12" />
              <SkeletonBar widthClass="w-7/12" />
            </div>
          ))}
        </div>
      </SkeletonSection>

      <SkeletonSection
        eyebrow="Próximo passo"
        title="A abordagem mais inteligente pro seu caso"
        icon={<CheckCircle2 className="size-5 text-foreground" aria-hidden />}
      >
        <div className="rounded-2xl border border-border bg-card p-6 md:p-7 space-y-3">
          <SkeletonBar widthClass="w-4/12" heightClass="h-3" />
          <SkeletonBar widthClass="w-full" />
          <SkeletonBar widthClass="w-11/12" />
          <SkeletonBar widthClass="w-9/12" />
        </div>
      </SkeletonSection>
    </article>
  );
}

function SkeletonSection({
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
          <h2 className="font-semibold text-xl md:text-2xl tracking-tight text-muted-foreground/70">
            {title}
          </h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function SkeletonBar({
  widthClass,
  heightClass = "h-4",
}: {
  widthClass: string;
  heightClass?: string;
}) {
  return (
    <div
      className={`${widthClass} ${heightClass} rounded-md bg-muted animate-pulse`}
      aria-hidden
    />
  );
}
