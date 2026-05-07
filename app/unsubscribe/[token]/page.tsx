import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  cancelEmailSequence,
  getSupabaseService,
  isSupabaseConfigured,
} from "@/lib/supabase";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

type Props = { params: Promise<{ token: string }> };

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cancelar e-mails",
  robots: { index: false, follow: false },
};

async function processUnsubscribe(
  token: string,
): Promise<{ ok: boolean; reason?: string }> {
  const diagnosisId = verifyUnsubscribeToken(token);
  if (!diagnosisId) {
    return { ok: false, reason: "Link inválido ou expirado." };
  }
  if (!isSupabaseConfigured()) {
    return { ok: true }; // dev fallback
  }

  try {
    await cancelEmailSequence(diagnosisId);
  } catch (err) {
    console.error(
      "[unsubscribe] cancelEmailSequence failed",
      err instanceof Error ? err.message : err,
    );
    return { ok: false, reason: "Erro processando cancelamento." };
  }

  // Tenta marcar unsubscribed_at em subscribers se o email do diagnose
  // estiver inscrito. Best-effort — não bloqueia.
  const supabase = getSupabaseService();
  if (supabase) {
    const { data: diag } = await supabase
      .from("diagnoses")
      .select("email")
      .eq("id", diagnosisId)
      .maybeSingle();
    if (diag?.email) {
      await supabase
        .from("subscribers")
        .update({ unsubscribed_at: new Date().toISOString() })
        .eq("email", diag.email.toLowerCase());
    }
  }
  return { ok: true };
}

export default async function UnsubscribePage({ params }: Props) {
  const { token } = await params;
  const result = await processUnsubscribe(token);

  return (
    <section className="container-prose py-16 md:py-20 text-center">
      {result.ok ? (
        <div className="mx-auto max-w-md space-y-5">
          <div className="size-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/40 grid place-items-center">
            <CheckCircle2
              className="size-7 text-emerald-700 dark:text-emerald-300"
              aria-hidden
            />
          </div>
          <h1 className="heading-2">Cancelado.</h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Você não vai mais receber emails automáticos sobre o seu diagnóstico.
            Se quiser conversar comigo, é só responder qualquer email anterior
            ou usar o formulário abaixo.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button asChild size="lg" variant="outline" className="rounded-xl">
              <Link href="/contact">Formulário de contato</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="rounded-xl">
              <Link href="/">Voltar ao início</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-md space-y-5">
          <div className="size-14 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/40 grid place-items-center">
            <AlertTriangle
              className="size-7 text-amber-700 dark:text-amber-300"
              aria-hidden
            />
          </div>
          <h1 className="heading-2">Não consegui processar.</h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            {result.reason ?? "Tente novamente mais tarde."} Se quiser cancelar
            manualmente, mande um email pra{" "}
            <a
              href="mailto:hello@levilael.com.br?subject=unsubscribe"
              className="text-foreground underline decoration-brand decoration-2 underline-offset-4"
            >
              hello@levilael.com.br
            </a>{" "}
            com o assunto "unsubscribe".
          </p>
          <Button asChild size="lg" variant="outline" className="rounded-xl">
            <Link href="/">Voltar ao início</Link>
          </Button>
        </div>
      )}
    </section>
  );
}
