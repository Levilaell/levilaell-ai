"use client";

/**
 * Form de "Agendar conversa". Substituiu o link direto pro Cal.com.
 *
 * Fluxo:
 *   1. Lead preenche 5 campos (nome, whatsapp, email, site, urgência)
 *   2. Submit → POST /api/scheduling/request
 *   3. API salva no banco + dispara Telegram pro Levi/comercial + CAPI Lead
 *      (único evento de conversion — não tem agendamento real, só pedido de
 *      contato 1x1 via WhatsApp, então Schedule seria semanticamente errado)
 *   4. Cliente dispara Meta Pixel Lead (dedup com CAPI via event_id) +
 *      Google generateHotLead + track interno
 *   5. Tela de sucesso: "vou te chamar no WhatsApp"
 *
 * Props:
 *   • source       — origem do clique (header, home_hero, etc) pra tracking
 *   • diagnosisId  — quando vem do fluxo de diagnóstico, cancela email
 *     sequence e enriquece atribuição
 *   • onSuccess    — callback opcional (ex: pra fechar dialog após delay)
 */

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SCHEDULING_URGENCY_LABEL,
  schedulingRequestSchema,
  type SchedulingUrgency,
} from "@/types/forms";

// attributionField tem .transform(...) então o tipo OUTPUT é mais estrito
// que o INPUT. react-hook-form precisa do tipo de INPUT pros defaultValues
// e do OUTPUT pro handleSubmit. Usar generics de 3 args do useForm resolve.
type SchedulingFormInput = z.input<typeof schedulingRequestSchema>;
type SchedulingFormOutput = z.output<typeof schedulingRequestSchema>;
import { track } from "@/lib/tracking";
import { metaPixel } from "@/lib/tracking/meta";
import { googleTracking } from "@/lib/tracking/google";
import { EVENT_VALUE_BRL } from "@/lib/tracking/types";
import { readAttribution } from "@/lib/tracking/attribution";

const urgencyOptions: SchedulingUrgency[] = [
  "this_week",
  "next_month",
  "researching",
];

export type SchedulingFormPrefill = {
  name?: string;
  email?: string;
  whatsapp?: string;
};

type Props = {
  source?: string;
  diagnosisId?: string;
  /** Valores pré-preenchidos (ex: lead que veio do link no email pós-diagnóstico). */
  prefill?: SchedulingFormPrefill;
  onSuccess?: () => void;
};

export function SchedulingRequestForm({
  source,
  diagnosisId,
  prefill,
  onSuccess,
}: Props) {
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<SchedulingFormInput, unknown, SchedulingFormOutput>({
    resolver: zodResolver(schedulingRequestSchema),
    defaultValues: {
      name: prefill?.name ?? "",
      email: prefill?.email ?? "",
      whatsapp: prefill?.whatsapp ?? "",
      site_url: "",
      urgency: "this_week",
      source: source ?? "",
      diagnosis_id: diagnosisId ?? "",
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
      landing_page: null,
      referrer: null,
    },
  });

  // Mantém source/diagnosis em sincronia caso o componente seja reutilizado
  // dentro de dialogs disparados de pontos diferentes.
  useEffect(() => {
    form.setValue("source", source ?? "");
    form.setValue("diagnosis_id", diagnosisId ?? "");
  }, [source, diagnosisId, form]);

  function onSubmit(values: SchedulingFormOutput) {
    startTransition(async () => {
      setErrorMsg(null);
      try {
        const attribution = readAttribution();
        const payload: SchedulingFormOutput = {
          ...values,
          source: source ?? values.source ?? "",
          diagnosis_id: diagnosisId ?? values.diagnosis_id ?? "",
          utm_source: attribution?.utm_source ?? null,
          utm_medium: attribution?.utm_medium ?? null,
          utm_campaign: attribution?.utm_campaign ?? null,
          utm_content: attribution?.utm_content ?? null,
          utm_term: attribution?.utm_term ?? null,
          landing_page: attribution?.landing_page ?? null,
          referrer: attribution?.referrer ?? null,
        };
        const res = await fetch("/api/scheduling/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `Erro ${res.status}`);
        }
        const data = (await res.json()) as {
          ok: true;
          event_id: string;
        };

        // Dispara Lead client-side com mesmo event_id pra dedup CAPI.
        void metaPixel.lead({
          event_id: data.event_id,
          value: EVENT_VALUE_BRL.hot_lead,
          email: values.email,
          phone: values.whatsapp,
          fullName: values.name,
          leadQuality: "hot",
        });
        googleTracking.generateHotLead({
          value: EVENT_VALUE_BRL.hot_lead,
          email: values.email,
        });
        track({
          type: "scheduling_submitted",
          data: {
            source: source ?? null,
            urgency: values.urgency,
            diagnosis_id: diagnosisId ?? null,
            has_site_url: false,
          },
        });

        setSuccess(true);
        onSuccess?.();
      } catch (err) {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Não consegui enviar agora. Tenta de novo em alguns segundos.",
        );
      }
    });
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:bg-emerald-950/30 dark:border-emerald-900">
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="size-5 text-emerald-700 dark:text-emerald-300 mt-0.5"
            aria-hidden
          />
          <div>
            <p className="font-semibold text-emerald-950 dark:text-emerald-100">
              Recebi. Te chamo no WhatsApp em alguns minutos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="sched-name">
          Nome <span className="text-destructive">*</span>
        </Label>
        <Input
          id="sched-name"
          {...form.register("name")}
          autoComplete="name"
          placeholder="Como prefere ser chamado"
        />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="sched-whatsapp">
            WhatsApp <span className="text-destructive">*</span>
          </Label>
          <Input
            id="sched-whatsapp"
            type="tel"
            {...form.register("whatsapp")}
            autoComplete="tel"
            placeholder="(17) 99999-9999"
          />
          {form.formState.errors.whatsapp && (
            <p className="text-xs text-destructive">
              {form.formState.errors.whatsapp.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sched-email">
            E-mail <span className="text-destructive">*</span>
          </Label>
          <Input
            id="sched-email"
            type="email"
            {...form.register("email")}
            autoComplete="email"
            placeholder="voce@empresa.com.br"
          />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sched-urgency">
          Quando quer começar? <span className="text-destructive">*</span>
        </Label>
        <Select
          value={form.watch("urgency")}
          onValueChange={(v) =>
            form.setValue("urgency", v as SchedulingUrgency)
          }
        >
          <SelectTrigger id="sched-urgency" className="w-full">
            <SelectValue placeholder="Escolha um prazo">
              {(value: SchedulingUrgency) =>
                SCHEDULING_URGENCY_LABEL[value] ?? "Escolha um prazo"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {urgencyOptions.map((u) => (
              <SelectItem key={u} value={u}>
                {SCHEDULING_URGENCY_LABEL[u]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
            Enviando…
          </>
        ) : (
          <>
            <Send className="size-4" aria-hidden />
            Quero conversar
          </>
        )}
      </Button>
    </form>
  );
}
