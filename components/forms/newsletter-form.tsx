"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { newsletterSchema, type NewsletterInput } from "@/types/forms";

type Props = {
  source?: string;
  variant?: "default" | "compact";
};

export function NewsletterForm({ source = "newsletter_page", variant = "default" }: Props) {
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<NewsletterInput>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { name: "", email: "", consent: false },
  });

  const onSubmit = (values: NewsletterInput) => {
    startTransition(async () => {
      setErrorMsg(null);
      try {
        const res = await fetch("/api/newsletter/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, source }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `Erro ${res.status}`);
        }
        setSuccess(true);
        form.reset();
      } catch (err) {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Não consegui assinar agora. Tenta de novo.",
        );
      }
    });
  };

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:bg-emerald-950/30 dark:border-emerald-900">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="size-5 text-emerald-700 dark:text-emerald-300 mt-0.5" aria-hidden />
          <div>
            <p className="font-semibold text-emerald-950 dark:text-emerald-100">
              Pronto. Cheque seu e-mail.
            </p>
            <p className="text-sm text-emerald-900/80 dark:text-emerald-100/80 mt-1">
              Em poucos minutos você recebe o link do Mapa de Operação Inteligente.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const inputClasses = variant === "compact" ? "" : "h-11";

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="newsletter-name">Nome</Label>
        <Input
          id="newsletter-name"
          {...form.register("name")}
          placeholder="Seu primeiro nome"
          autoComplete="name"
          className={inputClasses}
        />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="newsletter-email">E-mail</Label>
        <Input
          id="newsletter-email"
          type="email"
          {...form.register("email")}
          placeholder="seu@email.com"
          autoComplete="email"
          className={inputClasses}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>
      <label className="flex items-start gap-2.5 cursor-pointer pt-1">
        <Checkbox
          checked={form.watch("consent")}
          onCheckedChange={(v) => form.setValue("consent", Boolean(v))}
        />
        <span className="text-xs text-muted-foreground leading-relaxed">
          Concordo em receber o conteúdo. Sem spam, sem vender lista, e sai com 1 clique.
        </span>
      </label>
      {form.formState.errors.consent && (
        <p className="text-xs text-destructive">
          {form.formState.errors.consent.message}
        </p>
      )}
      {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
      <Button
        type="submit"
        disabled={isPending}
        size="lg"
        variant="brand"
        className="w-full rounded-xl"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Assinando…
          </>
        ) : (
          <>
            <Mail className="size-4" aria-hidden />
            Quero receber
          </>
        )}
      </Button>
    </form>
  );
}
