"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { contactSchema, type ContactInput } from "@/types/forms";

const subjectOptions = [
  { value: "partnership", label: "Parceria" },
  { value: "question", label: "Dúvida" },
  { value: "press", label: "Imprensa" },
  { value: "other", label: "Outro" },
] as const;

const serviceMessage: Record<string, string> = {
  diagnosis: "Tenho interesse no Diagnóstico Estratégico. Conta mais sobre o escopo.",
  automation:
    "Tenho interesse em Automação Sob Medida. Quero discutir um projeto específico.",
  partnership:
    "Tenho interesse na Operação Inteligente como parceria contínua. Vamos conversar?",
};

export function ContactForm() {
  const params = useSearchParams();
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      subject: "question",
      message: "",
    },
  });

  useEffect(() => {
    const service = params.get("service");
    if (service && serviceMessage[service]) {
      form.setValue("subject", "partnership");
      form.setValue("message", serviceMessage[service]);
    }
  }, [params, form]);

  const onSubmit = (values: ContactInput) => {
    startTransition(async () => {
      setErrorMsg(null);
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
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
            : "Não consegui enviar agora. Tenta de novo em alguns segundos.",
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
              Recebi sua mensagem.
            </p>
            <p className="text-sm text-emerald-900/80 dark:text-emerald-100/80 mt-1">
              Respondo em até 24-48h em dia útil.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">Nome <span className="text-destructive">*</span></Label>
          <Input
            id="contact-name"
            {...form.register("name")}
            autoComplete="name"
          />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-email">E-mail <span className="text-destructive">*</span></Label>
          <Input
            id="contact-email"
            type="email"
            {...form.register("email")}
            autoComplete="email"
          />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contact-company">Empresa <span className="text-muted-foreground">(opcional)</span></Label>
          <Input
            id="contact-company"
            {...form.register("company")}
            autoComplete="organization"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-subject">Assunto</Label>
          <Select
            value={form.watch("subject")}
            onValueChange={(v) =>
              form.setValue("subject", v as ContactInput["subject"])
            }
          >
            <SelectTrigger id="contact-subject" className="w-full">
              <SelectValue placeholder="Escolha um assunto" />
            </SelectTrigger>
            <SelectContent>
              {subjectOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-message">
          Mensagem <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="contact-message"
          rows={6}
          {...form.register("message")}
          placeholder="Conta um pouco do contexto: empresa, problema, prazo, orçamento estimado..."
        />
        {form.formState.errors.message && (
          <p className="text-xs text-destructive">
            {form.formState.errors.message.message}
          </p>
        )}
      </div>

      {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}

      <Button
        type="submit"
        disabled={isPending}
        size="lg"
        variant="brand"
        className="rounded-xl"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Enviando…
          </>
        ) : (
          <>
            <Send className="size-4" aria-hidden />
            Enviar mensagem
          </>
        )}
      </Button>
    </form>
  );
}
