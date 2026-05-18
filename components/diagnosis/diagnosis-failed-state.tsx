"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SchedulingButton } from "@/components/ui/scheduling-button";

type Props = {
  id: string;
  name?: string | null;
  /** Vem do banco (error_message). Mostrado em <details> pra não assustar. */
  errorDetail?: string | null;
  /** Já retentou uma vez — esconde o botão "Tentar novamente". */
  retryUsed?: boolean;
};

type RetryState = "idle" | "submitting" | "blocked" | "error";

export function DiagnosisFailedState({
  id,
  name,
  errorDetail,
  retryUsed = false,
}: Props) {
  const router = useRouter();
  const [retryState, setRetryState] = useState<RetryState>(
    retryUsed ? "blocked" : "idle",
  );
  const [retryError, setRetryError] = useState<string | null>(null);

  async function handleRetry() {
    setRetryError(null);
    setRetryState("submitting");
    try {
      const res = await fetch(`/api/diagnosis/${id}/retry`, {
        method: "POST",
      });
      if (res.status === 429) {
        setRetryState("blocked");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Erro ${res.status}`);
      }
      // 202 — retry aceito. Volta o SSR pra renderizar o loading state
      // (status=processing) e o polling assume daqui em diante.
      router.refresh();
    } catch (err) {
      setRetryState("error");
      setRetryError(
        err instanceof Error
          ? err.message
          : "Não consegui reprocessar agora. Tenta de novo em alguns segundos.",
      );
    }
  }

  const showRetry = retryState !== "blocked" && retryState !== "submitting";
  const isSubmitting = retryState === "submitting";

  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 px-3 py-1 text-xs font-mono uppercase tracking-widest">
          <AlertTriangle className="size-3.5" aria-hidden />
          Problema técnico
        </div>
        <h1 className="heading-2">
          {name ? `${name}, ` : ""}tivemos um problema técnico ao gerar sua
          análise.
        </h1>
        <p className="text-lead text-muted-foreground">
          Não se preocupe — recebemos seus dados e nossa equipe vai entrar em
          contato em até 24h pelo WhatsApp.
        </p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
        <div className="space-y-2">
          <p className="font-semibold text-base md:text-lg">
            Se preferir já fechar agora:
          </p>
          <p className="text-sm md:text-base text-muted-foreground">
            Agenda uma conversa de 30 min pra eu te entregar o diagnóstico
            direto, sem você esperar.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <SchedulingButton
            size="lg"
            variant="primary"
            subject={`Diagnóstico — ${name ?? "lead"}`}
            label="Agendar conversa direto"
            diagnosisId={id}
            source="failed_state"
          />
          {showRetry && (
            <Button
              variant="outline"
              size="lg"
              className="rounded-xl"
              onClick={handleRetry}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Reprocessando…
                </>
              ) : (
                <>
                  <RefreshCw className="size-4" aria-hidden />
                  Tentar novamente
                </>
              )}
            </Button>
          )}
        </div>
        {retryState === "blocked" && (
          <p className="text-sm text-muted-foreground">
            Você já tentou de novo uma vez. Pra evitar gerar mais demora, é
            melhor agendar uma conversa direta agora.
          </p>
        )}
        {retryError && (
          <p className="text-sm text-destructive" role="alert">
            {retryError}
          </p>
        )}
      </div>

      {errorDetail && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer select-none hover:text-foreground">
            Detalhes técnicos
          </summary>
          <p className="mt-2 font-mono break-all">{errorDetail}</p>
        </details>
      )}
    </article>
  );
}
