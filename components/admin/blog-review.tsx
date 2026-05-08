"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Lock,
  RotateCw,
  Send,
  X as XIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  blogEditedSchema,
  blogGeneratedSchema,
  type BlogEditedOutput,
  type PipelineRow,
} from "@/types/admin";
import { cn } from "@/lib/utils";

const META_TITLE_TARGET = { min: 30, soft: 60, hard: 70 };
const META_DESC_TARGET = { min: 120, soft: 160, hard: 170 };
const TITLE_TARGET = { min: 30, soft: 70, hard: 80 };
const EXCERPT_TARGET = { min: 80, soft: 180, hard: 200 };
const AUTOSAVE_DELAY_MS = 2000;

type Props = {
  item: PipelineRow;
  onUpdated: (entry: PipelineRow) => void;
  onClose: () => void;
};

export function BlogContentSection({ item, onUpdated, onClose }: Props) {
  const initial = useMemo(() => extractContent(item), [item]);
  const editable = item.status === "generated";

  const [content, setContent] = useState<BlogEditedOutput | null>(initial);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);
  const [isApproving, startApprove] = useTransition();
  const [isRejecting, startReject] = useTransition();
  const [isRegenerating, startRegen] = useTransition();
  const [isPublishing, startPublish] = useTransition();

  // ----- Autosave (debounced) ----------------------------------------------
  const lastSavedRef = useRef<string | null>(
    initial ? JSON.stringify(initial) : null,
  );
  useEffect(() => {
    if (!editable || !content) return;
    const nextStr = JSON.stringify(content);
    if (nextStr === lastSavedRef.current) {
      setIsDirty(false);
      return;
    }
    setIsDirty(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/pipeline/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ edited_content: content }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `Erro ${res.status}`);
        }
        lastSavedRef.current = nextStr;
        setIsDirty(false);
        setHasSavedOnce(true);
      } catch (err) {
        setError(
          err instanceof Error
            ? `Autosave falhou: ${err.message}`
            : "Autosave falhou.",
        );
      }
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(handle);
  }, [content, editable, item.id]);

  // Status sem conteúdo (queued / generating / publishing)
  if (
    item.status === "queued" ||
    item.status === "generating" ||
    item.status === "publishing"
  ) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        {item.status === "queued" &&
          "Artigo ainda não foi gerado. Clica em Gerar no card."}
        {item.status === "generating" && (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Gerando artigo… leva 30-60 segundos. Card atualiza sozinho.
          </span>
        )}
        {item.status === "publishing" && (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Publicando no Notion…
          </span>
        )}
      </div>
    );
  }

  // Failed — duas variantes: failed-de-gerar (sem content) ou failed-de-publish
  if (item.status === "failed" && !content) {
    return (
      <div className="space-y-3">
        <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-900">
          <p className="font-medium">Geração falhou.</p>
          {item.error_message && (
            <p className="mt-1 text-rose-800/90">{item.error_message}</p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            startRegen(async () => {
              setError(null);
              try {
                const res = await fetch(
                  `/api/admin/pipeline/${item.id}/generate`,
                  { method: "POST" },
                );
                const body = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(body?.error ?? `Erro ${res.status}`);
                onUpdated({
                  ...item,
                  status: "generating",
                  error_message: null,
                  generated_content: null,
                  edited_content: null,
                });
                onClose();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Erro.");
              }
            });
          }}
          disabled={isRegenerating}
        >
          {isRegenerating ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <RotateCw className="size-4" aria-hidden />
          )}
          Tentar gerar de novo
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  if (!content) {
    return (
      <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-800">
        Conteúdo do artigo não pôde ser lido (formato inesperado).
      </div>
    );
  }

  // ----- Banner por status -------------------------------------------------
  let banner: React.ReactNode = null;
  if (item.status === "approved") {
    banner = (
      <div className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
        <Lock className="size-3.5 shrink-0" aria-hidden />
        Conteúdo aprovado — edição bloqueada. Clica em Publicar pra mandar pro
        Notion.
      </div>
    );
  } else if (item.status === "published") {
    banner = (
      <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-900 ring-1 ring-emerald-200">
        <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
        Publicado no Notion. ISR já revalidou /blog.
        {item.notion_page_id && (
          <a
            href={`https://www.notion.so/${item.notion_page_id.replace(/-/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1 underline-offset-2 hover:underline"
          >
            Abrir no Notion
            <ExternalLink className="size-3" aria-hidden />
          </a>
        )}
      </div>
    );
  } else if (item.status === "rejected") {
    banner = (
      <div className="rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-600 ring-1 ring-zinc-200">
        Rejeitado.
      </div>
    );
  } else if (item.status === "failed") {
    banner = (
      <div className="rounded-md bg-rose-50 p-3 text-xs text-rose-900">
        <p className="font-medium">Falha ao publicar.</p>
        {item.error_message && (
          <p className="mt-1 text-rose-800/90">{item.error_message}</p>
        )}
      </div>
    );
  }

  // ----- Word count + char counts ------------------------------------------
  const wordCount = countWords(content.content_markdown);
  const charCount = content.content_markdown.length;

  // ----- Actions -----------------------------------------------------------
  const validate = (): string | null => {
    const parsed = blogEditedSchema.safeParse(content);
    if (parsed.success) return null;
    return parsed.error.issues
      .map((i) => `${prettifyPath(i.path)}: ${i.message}`)
      .join("; ");
  };

  const flushAutosave = async () => {
    const next = JSON.stringify(content);
    if (next === lastSavedRef.current) return;
    const res = await fetch(`/api/admin/pipeline/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ edited_content: content }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error ?? `Autosave falhou: ${res.status}`);
    }
    lastSavedRef.current = next;
    setIsDirty(false);
  };

  const onApproveAndPublish = () => {
    const failure = validate();
    if (failure) return setError(failure);

    startApprove(async () => {
      setError(null);
      try {
        // 1) Garante que edited_content está salvo + transição approved
        await flushAutosave();
        const approveRes = await fetch(`/api/admin/pipeline/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "approved",
            edited_content: content,
          }),
        });
        const approveBody = await approveRes.json().catch(() => ({}));
        if (!approveRes.ok) {
          throw new Error(approveBody?.error ?? `Erro ${approveRes.status}`);
        }
        onUpdated(approveBody.entry as PipelineRow);

        // 2) Dispara publish — server já vai fazer preflight + cria página
        startPublish(async () => {
          try {
            const pubRes = await fetch(
              `/api/admin/pipeline/${item.id}/publish`,
              { method: "POST" },
            );
            const pubBody = await pubRes.json().catch(() => ({}));
            if (!pubRes.ok) {
              throw new Error(pubBody?.error ?? `Erro ${pubRes.status}`);
            }
            onUpdated(pubBody.entry as PipelineRow);
            onClose();
          } catch (pubErr) {
            setError(
              pubErr instanceof Error
                ? pubErr.message
                : "Erro ao publicar no Notion.",
            );
          }
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao aprovar.");
      }
    });
  };

  const onRetryPublish = () => {
    startPublish(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/admin/pipeline/${item.id}/publish`, {
          method: "POST",
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error ?? `Erro ${res.status}`);
        onUpdated(body.entry as PipelineRow);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao publicar.");
      }
    });
  };

  const onReject = () => {
    if (!confirm("Rejeitar este artigo? Vai pra status 'rejected'.")) return;
    startReject(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/admin/pipeline/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "rejected" }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error ?? `Erro ${res.status}`);
        onUpdated(body.entry as PipelineRow);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao rejeitar.");
      }
    });
  };

  const onRegenerate = () => {
    if (
      !confirm(
        "Regenerar artigo? Edições atuais serão descartadas. Custa nova chamada de IA (~R$ 0,30-0,80).",
      )
    )
      return;
    startRegen(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/admin/pipeline/${item.id}/generate`, {
          method: "POST",
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error ?? `Erro ${res.status}`);
        onUpdated({
          ...item,
          status: "generating",
          generated_content: null,
          edited_content: null,
          error_message: null,
        });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao regenerar.");
      }
    });
  };

  const anyPending =
    isApproving || isRejecting || isRegenerating || isPublishing;

  const setField = <K extends keyof BlogEditedOutput>(
    key: K,
    value: BlogEditedOutput[K],
  ) => {
    setContent((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  return (
    <div className="space-y-5">
      {banner}

      {/* Metadata */}
      <section className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
        <h4 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Metadata
        </h4>

        <Field
          label="Title"
          counter={
            <CharCounter
              value={content.title}
              limits={TITLE_TARGET}
              show={editable}
            />
          }
        >
          <Input
            value={content.title}
            onChange={(e) => setField("title", e.target.value)}
            disabled={!editable}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Field label="Slug">
            <Input
              value={content.slug}
              onChange={(e) =>
                setField("slug", e.target.value.toLowerCase().trim())
              }
              disabled={!editable}
              className="font-mono text-[13px]"
            />
          </Field>
          <Field label="Pillar">
            <Select
              value={content.pillar}
              onValueChange={(v) =>
                setField("pillar", v as BlogEditedOutput["pillar"])
              }
              disabled={!editable}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 — IA Aplicada</SelectItem>
                <SelectItem value="2">2 — Automação & n8n</SelectItem>
                <SelectItem value="3">3 — Profissionalização</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Meta title"
            counter={
              <CharCounter
                value={content.meta_title}
                limits={META_TITLE_TARGET}
                show={editable}
              />
            }
          >
            <Input
              value={content.meta_title}
              onChange={(e) => setField("meta_title", e.target.value)}
              disabled={!editable}
            />
          </Field>
          <Field
            label="Meta description"
            counter={
              <CharCounter
                value={content.meta_description}
                limits={META_DESC_TARGET}
                show={editable}
              />
            }
          >
            <Input
              value={content.meta_description}
              onChange={(e) => setField("meta_description", e.target.value)}
              disabled={!editable}
            />
          </Field>
        </div>

        <Field
          label="Excerpt"
          counter={
            <CharCounter
              value={content.excerpt}
              limits={EXCERPT_TARGET}
              show={editable}
            />
          }
        >
          <Textarea
            value={content.excerpt}
            onChange={(e) => setField("excerpt", e.target.value)}
            disabled={!editable}
            rows={2}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
          <Field label="Reading time (min)">
            <Input
              type="number"
              min={3}
              max={30}
              value={content.reading_time_minutes}
              onChange={(e) =>
                setField(
                  "reading_time_minutes",
                  Math.max(1, parseInt(e.target.value, 10) || 0),
                )
              }
              disabled={!editable}
            />
          </Field>
          <Field label="Target keyword">
            <Input
              value={content.target_keyword}
              onChange={(e) => setField("target_keyword", e.target.value)}
              disabled={!editable}
            />
          </Field>
        </div>

        {content.secondary_keywords.length > 0 && (
          <Field label="Secondary keywords">
            <p className="text-[12px] text-muted-foreground">
              {content.secondary_keywords.join(" · ")}
            </p>
          </Field>
        )}
      </section>

      {/* Conteúdo (markdown) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Artigo
          </h4>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "text-xs tabular-nums",
                wordCount < 1500
                  ? "text-amber-600"
                  : wordCount > 2500
                    ? "text-amber-600"
                    : "text-muted-foreground",
              )}
            >
              {wordCount.toLocaleString("pt-BR")} palavras ·{" "}
              {charCount.toLocaleString("pt-BR")} chars
            </span>
            {editable && hasSavedOnce && !isDirty && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
                <Check className="size-3" aria-hidden />
                Salvo
              </span>
            )}
            {editable && isDirty && (
              <span className="text-[11px] text-muted-foreground">Salvando…</span>
            )}
            <ToggleGroup
              value={mode}
              onChange={setMode}
              disabled={!editable && mode === "edit"}
            />
          </div>
        </div>

        {mode === "edit" ? (
          <Textarea
            value={content.content_markdown}
            onChange={(e) => setField("content_markdown", e.target.value)}
            disabled={!editable}
            rows={28}
            className="font-mono text-[13px] leading-relaxed"
          />
        ) : (
          <article className="prose prose-zinc max-w-none rounded-xl border border-border bg-background p-5 text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content.content_markdown}
            </ReactMarkdown>
          </article>
        )}
      </section>

      {error && (
        <p className="rounded-md bg-rose-50 p-2 text-sm text-rose-800">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {editable && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                disabled={anyPending}
              >
                {isRegenerating ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <RotateCw className="size-4" aria-hidden />
                )}
                Regenerar
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onReject}
                disabled={anyPending}
                className="text-muted-foreground hover:text-destructive"
              >
                {isRejecting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <XIcon className="size-4" aria-hidden />
                )}
                Rejeitar
              </Button>
            </>
          )}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {editable && (
            <Button
              type="button"
              variant="brand"
              size="sm"
              onClick={onApproveAndPublish}
              disabled={anyPending}
              className="rounded-lg"
            >
              {isApproving || isPublishing ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Send className="size-4" aria-hidden />
              )}
              {isPublishing
                ? "Publicando…"
                : isApproving
                  ? "Aprovando…"
                  : "Aprovar e publicar"}
            </Button>
          )}
          {item.status === "approved" && (
            <Button
              type="button"
              variant="brand"
              size="sm"
              onClick={onRetryPublish}
              disabled={anyPending}
              className="rounded-lg"
            >
              {isPublishing ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Send className="size-4" aria-hidden />
              )}
              Publicar no Notion
            </Button>
          )}
          {item.status === "failed" && (
            <Button
              type="button"
              variant="brand"
              size="sm"
              onClick={onRetryPublish}
              disabled={anyPending}
              className="rounded-lg"
            >
              {isPublishing ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <RotateCw className="size-4" aria-hidden />
              )}
              Tentar publicar de novo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers / sub-components
// ---------------------------------------------------------------------------
function ToggleGroup({
  value,
  onChange,
  disabled,
}: {
  value: "edit" | "preview";
  onChange: (v: "edit" | "preview") => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex rounded-md border border-border bg-background p-0.5">
      <ToggleButton
        active={value === "edit"}
        onClick={() => onChange("edit")}
        disabled={disabled}
      >
        <FileText className="size-3.5" aria-hidden />
        Editar
      </ToggleButton>
      <ToggleButton
        active={value === "preview"}
        onClick={() => onChange("preview")}
        disabled={disabled}
      >
        <Eye className="size-3.5" aria-hidden />
        Preview
      </ToggleButton>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-sm px-2 text-[11px] font-medium transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  counter,
  children,
}: {
  label: string;
  counter?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        {counter}
      </div>
      {children}
    </div>
  );
}

function CharCounter({
  value,
  limits,
  show,
}: {
  value: string;
  limits: { min: number; soft: number; hard: number };
  show: boolean;
}) {
  if (!show) return null;
  const len = value.length;
  const overSoft = len > limits.soft;
  const overHard = len > limits.hard;
  const underMin = len < limits.min;
  return (
    <span
      className={cn(
        "text-[11px] tabular-nums",
        overHard
          ? "text-destructive font-medium"
          : overSoft || underMin
            ? "text-amber-600"
            : "text-muted-foreground",
      )}
    >
      {len}/{limits.soft}
    </span>
  );
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function prettifyPath(path: ReadonlyArray<PropertyKey>): string {
  return path.map(String).join(".") || "(raiz)";
}

function extractContent(item: PipelineRow): BlogEditedOutput | null {
  // Edited tem prioridade — é o que o user editou.
  const candidate = item.edited_content ?? item.generated_content;
  const editedParse = blogEditedSchema.safeParse(candidate);
  if (editedParse.success) return editedParse.data;
  // Fallback: tenta o schema strict (o que o Claude retornou).
  const generatedParse = blogGeneratedSchema.safeParse(candidate);
  if (generatedParse.success) return generatedParse.data;
  return null;
}
