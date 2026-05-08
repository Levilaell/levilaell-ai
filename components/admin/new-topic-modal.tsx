"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import {
  createPipelineSchema,
  type PipelineRow,
  type Channel,
} from "@/types/admin";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (entry: PipelineRow) => void;
};

export function NewTopicModal({ open, onOpenChange, onCreated }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup size="lg">
        <DialogHeader>
          <DialogTitle>Novo tema</DialogTitle>
          <DialogDescription>
            Adiciona um item à fila editorial. A geração roda quando você clicar
            em &ldquo;Gerar&rdquo; (Phase 2).
          </DialogDescription>
        </DialogHeader>
        <NewTopicForm
          onCreated={(entry) => {
            onCreated(entry);
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogPopup>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Form (separated from modal so we can reset state when reopened)
// ---------------------------------------------------------------------------
type FormValues = {
  channel: Channel;
  topic: string;
  notes: string;
  // x
  x_type: "INSIGHT_TECNICO" | "BASTIDOR" | "PROVOCACAO";
  x_tone: "DIRETO" | "PROVOCADOR" | "DIDATICO";
  x_quantity: number;
  // blog
  blog_pillar: "1" | "2" | "3";
  blog_keyword: string;
  blog_target_words: number;
  // newsletter
  newsletter_tone: "pessoal" | "tecnico" | "opinativo";
};

const DEFAULTS: FormValues = {
  channel: "x",
  topic: "",
  notes: "",
  x_type: "INSIGHT_TECNICO",
  x_tone: "DIRETO",
  x_quantity: 3,
  blog_pillar: "1",
  blog_keyword: "",
  blog_target_words: 2000,
  newsletter_tone: "tecnico",
};

function NewTopicForm({
  onCreated,
  onCancel,
}: {
  onCreated: (entry: PipelineRow) => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({ defaultValues: DEFAULTS });

  // Reset error when channel changes (avoids stale messages)
  const channel = useWatch({ control: form.control, name: "channel" });
  useEffect(() => {
    setServerError(null);
  }, [channel]);

  const submit = form.handleSubmit((values) => {
    const payload = buildPayload(values);
    const parsed = createPipelineSchema.safeParse(payload);
    if (!parsed.success) {
      setServerError(
        parsed.error.issues.map((i) => i.message).join("; ") ||
          "Validação falhou.",
      );
      return;
    }

    startTransition(async () => {
      setServerError(null);
      try {
        const res = await fetch("/api/admin/pipeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body?.error ?? `Erro ${res.status}`);
        }
        onCreated(body.entry as PipelineRow);
        form.reset(DEFAULTS);
      } catch (err) {
        setServerError(err instanceof Error ? err.message : "Erro ao criar.");
      }
    });
  });

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="topic-channel">Canal</Label>
        <Select
          value={form.watch("channel")}
          onValueChange={(v) => form.setValue("channel", v as Channel)}
        >
          <SelectTrigger id="topic-channel" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="x">X (Twitter)</SelectItem>
            <SelectItem value="blog">Blog</SelectItem>
            <SelectItem value="newsletter">Newsletter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="topic-topic">Tópico</Label>
        <Input
          id="topic-topic"
          placeholder={topicPlaceholder(channel)}
          {...form.register("topic", { required: true, maxLength: 200 })}
          disabled={isPending}
        />
      </div>

      {channel === "x" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="x-type">Tipo</Label>
            <Select
              value={form.watch("x_type")}
              onValueChange={(v) =>
                form.setValue("x_type", v as FormValues["x_type"])
              }
            >
              <SelectTrigger id="x-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INSIGHT_TECNICO">Insight técnico</SelectItem>
                <SelectItem value="BASTIDOR">Bastidor</SelectItem>
                <SelectItem value="PROVOCACAO">Provocação</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="x-tone">Tom</Label>
            <Select
              value={form.watch("x_tone")}
              onValueChange={(v) =>
                form.setValue("x_tone", v as FormValues["x_tone"])
              }
            >
              <SelectTrigger id="x-tone" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DIRETO">Direto</SelectItem>
                <SelectItem value="PROVOCADOR">Provocador</SelectItem>
                <SelectItem value="DIDATICO">Didático</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="x-quantity">Quantidade</Label>
            <Input
              id="x-quantity"
              type="number"
              min={1}
              max={10}
              {...form.register("x_quantity", {
                valueAsNumber: true,
                min: 1,
                max: 10,
              })}
              disabled={isPending}
            />
          </div>
        </div>
      )}

      {channel === "blog" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="blog-pillar">Pilar</Label>
              <Select
                value={form.watch("blog_pillar")}
                onValueChange={(v) =>
                  form.setValue("blog_pillar", v as FormValues["blog_pillar"])
                }
              >
                <SelectTrigger id="blog-pillar" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 — IA Aplicada</SelectItem>
                  <SelectItem value="2">2 — Automação & n8n</SelectItem>
                  <SelectItem value="3">3 — Profissionalização</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="blog-target">Tamanho-alvo (palavras)</Label>
              <Input
                id="blog-target"
                type="number"
                min={1000}
                max={3000}
                step={100}
                {...form.register("blog_target_words", {
                  valueAsNumber: true,
                })}
                disabled={isPending}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="blog-keyword">Keyword SEO</Label>
            <Input
              id="blog-keyword"
              placeholder="ex: idempotência webhook IA"
              {...form.register("blog_keyword", { required: true })}
              disabled={isPending}
            />
          </div>
        </div>
      )}

      {channel === "newsletter" && (
        <div className="space-y-1.5">
          <Label htmlFor="news-tone">Tom</Label>
          <Select
            value={form.watch("newsletter_tone")}
            onValueChange={(v) =>
              form.setValue("newsletter_tone", v as FormValues["newsletter_tone"])
            }
          >
            <SelectTrigger id="news-tone" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pessoal">Pessoal</SelectItem>
              <SelectItem value="tecnico">Técnico</SelectItem>
              <SelectItem value="opinativo">Opinativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="topic-notes">
          Notas pra IA <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Textarea
          id="topic-notes"
          rows={3}
          placeholder="Direção, ângulo, exemplo concreto que você quer ver…"
          {...form.register("notes", { maxLength: 1000 })}
          disabled={isPending}
        />
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <DialogFooter>
        <DialogClose
          render={
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancelar
            </Button>
          }
        />
        <Button
          type="submit"
          variant="brand"
          disabled={isPending}
          className="rounded-lg"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Adicionando…
            </>
          ) : (
            <>
              <Plus className="size-4" aria-hidden />
              Adicionar à fila
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

function topicPlaceholder(channel: Channel): string {
  if (channel === "blog")
    return "ex: Como cobrar por IA sem virar consultoria barata";
  if (channel === "newsletter")
    return "ex: O ano em que parei de prometer ROI";
  return "ex: Idempotência em webhooks de IA";
}

function buildPayload(values: FormValues): unknown {
  const base = {
    topic: values.topic.trim(),
    notes: values.notes?.trim() || null,
  };
  if (values.channel === "x") {
    return {
      ...base,
      channel: "x",
      metadata: {
        type: values.x_type,
        tone: values.x_tone,
        quantity: values.x_quantity,
      },
    };
  }
  if (values.channel === "blog") {
    return {
      ...base,
      channel: "blog",
      pillar: values.blog_pillar,
      keyword: values.blog_keyword.trim(),
      metadata: { target_words: values.blog_target_words },
    };
  }
  return {
    ...base,
    channel: "newsletter",
    metadata: { tone: values.newsletter_tone },
  };
}
