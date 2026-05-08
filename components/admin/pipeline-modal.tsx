"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Lock,
  RotateCw,
  Send,
  Trash2,
  X as XIcon,
} from "lucide-react";
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PipelineStatusBadge } from "@/components/admin/pipeline-status-badge";
import {
  xEditedSchema,
  xGeneratedSchema,
  type PipelineRow,
  type PipelineStatus,
} from "@/types/admin";
import {
  CHANNEL_EMOJI,
  CHANNEL_LABELS,
  formatBRL,
  relativeTime,
} from "@/lib/admin-format";
import { cn } from "@/lib/utils";

const X_LIMIT = 280;
const X_SOFT_LIMIT = 240;

type Props = {
  item: PipelineRow | null;
  onClose: () => void;
  onUpdated: (entry: PipelineRow) => void;
};

export function PipelineModal({ item, onClose, onUpdated }: Props) {
  return (
    <Dialog open={Boolean(item)} onOpenChange={(o) => !o && onClose()}>
      <DialogPopup size="xl">
        {item ? (
          <ModalBody
            key={item.id + item.updated_at}
            item={item}
            onClose={onClose}
            onUpdated={onUpdated}
          />
        ) : null}
      </DialogPopup>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Header — sempre presente
// ---------------------------------------------------------------------------
function ModalBody({
  item,
  onClose,
  onUpdated,
}: {
  item: PipelineRow;
  onClose: () => void;
  onUpdated: (entry: PipelineRow) => void;
}) {
  return (
    <>
      <DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <span
            aria-label={CHANNEL_LABELS[item.channel]}
            className="inline-flex h-5 items-center gap-1 rounded-full bg-muted px-2 text-[11px] font-medium text-muted-foreground"
          >
            <span aria-hidden>{CHANNEL_EMOJI[item.channel]}</span>
            {CHANNEL_LABELS[item.channel]}
          </span>
          <PipelineStatusBadge status={item.status} />
          {item.status === "published" && (
            <span
              className="inline-flex items-center gap-1 text-xs text-emerald-700"
              title="Publicado"
            >
              <CheckCircle2 className="size-3.5" aria-hidden />
            </span>
          )}
          {item.cost_estimate_brl > 0 && (
            <span className="ml-auto text-[11px] text-muted-foreground">
              {formatBRL(item.cost_estimate_brl)} ·{" "}
              {item.tokens_used.toLocaleString("pt-BR")} tokens
            </span>
          )}
        </div>
        <DialogTitle>{item.topic}</DialogTitle>
        <DialogDescription>
          Criado {relativeTime(item.created_at)}
          {item.updated_at !== item.created_at &&
            ` · atualizado ${relativeTime(item.updated_at)}`}
          {item.published_at && ` · publicado ${relativeTime(item.published_at)}`}
        </DialogDescription>
      </DialogHeader>

      {item.channel === "x" ? (
        <XContentSection item={item} onUpdated={onUpdated} onClose={onClose} />
      ) : (
        <ChannelPlaceholder channel={item.channel} />
      )}

      <SecondaryDetails item={item} />
    </>
  );
}

// ---------------------------------------------------------------------------
// X content — editável em 'generated', read-only nos demais
// ---------------------------------------------------------------------------
function XContentSection({
  item,
  onUpdated,
  onClose,
}: {
  item: PipelineRow;
  onUpdated: (entry: PipelineRow) => void;
  onClose: () => void;
}) {
  const initialPosts = extractPosts(item);
  const editable = item.status === "generated";

  const [posts, setPosts] = useState<string[]>(initialPosts);
  const [error, setError] = useState<string | null>(null);
  const [isApproving, startApprove] = useTransition();
  const [isRejecting, startReject] = useTransition();
  const [isRegenerating, startRegen] = useTransition();
  const [isPublishing, startPublish] = useTransition();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetRef.current) clearTimeout(copyResetRef.current);
    };
  }, []);

  const setPost = (i: number, value: string) =>
    setPosts((prev) => prev.map((p, idx) => (idx === i ? value : p)));

  const removePost = (i: number) =>
    setPosts((prev) => prev.filter((_, idx) => idx !== i));

  const copyPost = async (i: number, source: string[]) => {
    try {
      await navigator.clipboard.writeText(source[i]);
      setCopiedIndex(i);
      if (copyResetRef.current) clearTimeout(copyResetRef.current);
      copyResetRef.current = setTimeout(() => setCopiedIndex(null), 1400);
    } catch {
      // browsers without clipboard API fail silently
    }
  };

  // Status sem conteúdo (queued / generating / publishing): mostra placeholder
  if (
    item.status === "queued" ||
    item.status === "generating" ||
    item.status === "publishing"
  ) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        {item.status === "queued" &&
          "Posts ainda não foram gerados. Clica em Gerar no card."}
        {item.status === "generating" && (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Gerando posts… o card atualiza sozinho quando terminar.
          </span>
        )}
        {item.status === "publishing" && (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Publicando…
          </span>
        )}
      </div>
    );
  }

  // Status 'failed': sem conteúdo, mostra erro com retry
  if (item.status === "failed") {
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
          Tentar de novo
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  // Demais status (generated, approved, published, rejected): renderiza posts.
  const visiblePosts = editable ? posts : initialPosts;

  // Banner contextual
  let banner: React.ReactNode = null;
  if (item.status === "approved") {
    banner = (
      <div className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
        <Lock className="size-3.5 shrink-0" aria-hidden />
        Conteúdo aprovado — edição bloqueada. Cola no X e marca como postado.
      </div>
    );
  } else if (item.status === "published") {
    banner = (
      <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-900 ring-1 ring-emerald-200">
        <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
        Já postado — só pra referência ou reuso.
      </div>
    );
  } else if (item.status === "rejected") {
    banner = (
      <div className="rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-600 ring-1 ring-zinc-200">
        Rejeitado.
      </div>
    );
  }

  const validate = (): string | null => {
    const trimmed = posts.map((p) => p.trim()).filter(Boolean);
    if (trimmed.length === 0) return "Pelo menos 1 post.";
    if (trimmed.find((p) => p.length > X_LIMIT))
      return `Post acima de ${X_LIMIT} caracteres.`;
    const parsed = xEditedSchema.safeParse({ posts: trimmed });
    if (!parsed.success)
      return parsed.error.issues.map((i) => i.message).join("; ");
    return null;
  };

  const onApprove = () => {
    const failure = validate();
    if (failure) return setError(failure);
    startApprove(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/admin/pipeline/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "approved",
            edited_content: {
              posts: posts.map((p) => p.trim()).filter(Boolean),
            },
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error ?? `Erro ${res.status}`);
        onUpdated(body.entry as PipelineRow);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao aprovar.");
      }
    });
  };

  const onReject = () => {
    if (!confirm("Rejeitar este conteúdo? Vai pra status 'rejected'.")) return;
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
        "Regenerar tudo? Edições atuais serão descartadas. Custa nova chamada de IA.",
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

  const onMarkPosted = () => {
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

  const isPending =
    isApproving || isRejecting || isRegenerating || isPublishing;

  return (
    <div className="space-y-3">
      {banner}

      {visiblePosts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum post pra mostrar.
        </div>
      ) : (
        visiblePosts.map((post, i) => (
          <PostCard
            key={i}
            index={i}
            post={post}
            editable={editable}
            disabled={isPending}
            tachado={item.status === "rejected"}
            copied={copiedIndex === i}
            onChange={(v) => setPost(i, v)}
            onRemove={editable ? () => removePost(i) : undefined}
            onCopy={() => copyPost(i, visiblePosts)}
          />
        ))
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <XActions
        status={item.status}
        editable={editable}
        isApproving={isApproving}
        isRejecting={isRejecting}
        isRegenerating={isRegenerating}
        isPublishing={isPublishing}
        onApprove={onApprove}
        onReject={onReject}
        onRegenerate={onRegenerate}
        onMarkPosted={onMarkPosted}
      />
    </div>
  );
}

function XActions({
  status,
  editable,
  isApproving,
  isRejecting,
  isRegenerating,
  isPublishing,
  onApprove,
  onReject,
  onRegenerate,
  onMarkPosted,
}: {
  status: PipelineStatus;
  editable: boolean;
  isApproving: boolean;
  isRejecting: boolean;
  isRegenerating: boolean;
  isPublishing: boolean;
  onApprove: () => void;
  onReject: () => void;
  onRegenerate: () => void;
  onMarkPosted: () => void;
}) {
  const anyPending =
    isApproving || isRejecting || isRegenerating || isPublishing;

  if (editable) {
    return (
      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
        <div className="flex gap-2">
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
            Regenerar tudo
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
        </div>
        <Button
          type="button"
          variant="brand"
          size="sm"
          onClick={onApprove}
          disabled={anyPending}
          className="rounded-lg"
        >
          {isApproving ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Check className="size-4" aria-hidden />
          )}
          Aprovar todos
        </Button>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button
          type="button"
          variant="brand"
          size="sm"
          onClick={onMarkPosted}
          disabled={anyPending}
          className="rounded-lg"
        >
          {isPublishing ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Send className="size-4" aria-hidden />
          )}
          Marcar como postado
        </Button>
      </div>
    );
  }

  return null;
}

function PostCard({
  index,
  post,
  editable,
  disabled,
  tachado,
  copied,
  onChange,
  onRemove,
  onCopy,
}: {
  index: number;
  post: string;
  editable: boolean;
  disabled: boolean;
  tachado: boolean;
  copied: boolean;
  onChange: (v: string) => void;
  onRemove?: () => void;
  onCopy: () => void;
}) {
  const len = post.length;
  const overSoft = len > X_SOFT_LIMIT;
  const overHard = len > X_LIMIT;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-3 ring-1 ring-foreground/5",
        tachado && "opacity-60",
      )}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-muted-foreground">
          Post {index + 1}
        </span>
        {editable && (
          <span
            className={cn(
              "tabular-nums",
              overHard
                ? "text-destructive font-medium"
                : overSoft
                  ? "text-amber-600"
                  : "text-muted-foreground",
            )}
          >
            {len}/{X_SOFT_LIMIT}
          </span>
        )}
      </div>

      {editable ? (
        <Textarea
          value={post}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          disabled={disabled}
          className={cn(
            "resize-y font-mono text-[13px] leading-relaxed",
            overHard && "border-destructive ring-destructive/20",
          )}
        />
      ) : (
        <p
          className={cn(
            "whitespace-pre-wrap rounded-md bg-muted/40 p-2 font-mono text-[13px] leading-relaxed text-foreground",
            tachado && "line-through decoration-zinc-400",
          )}
        >
          {post}
        </p>
      )}

      <div className="mt-2 flex justify-end gap-1">
        <Button
          type="button"
          size="xs"
          variant="ghost"
          onClick={onCopy}
          disabled={disabled}
          aria-label="Copiar"
        >
          {copied ? (
            <>
              <Check className="size-3" aria-hidden />
              Copiado
            </>
          ) : (
            <>
              <Copy className="size-3" aria-hidden />
              Copiar
            </>
          )}
        </Button>
        {onRemove && (
          <Button
            type="button"
            size="xs"
            variant="ghost"
            onClick={onRemove}
            disabled={disabled}
            aria-label="Remover"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3" aria-hidden />
            Remover
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Outros canais — placeholder até Phase 3/4
// ---------------------------------------------------------------------------
function ChannelPlaceholder({ channel }: { channel: PipelineRow["channel"] }) {
  const phase = channel === "blog" ? "3" : "4";
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
      Renderização do canal {CHANNEL_LABELS[channel]} entra na Phase {phase}.
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detalhes técnicos — sempre no rodapé como seção secundária
// ---------------------------------------------------------------------------
function SecondaryDetails({ item }: { item: PipelineRow }) {
  const hasAny =
    item.pillar ||
    item.keyword ||
    item.notes ||
    item.error_message ||
    item.notion_page_id ||
    Boolean(item.metadata);

  if (!hasAny) return null;

  return (
    <details className="mt-5 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
      <summary className="cursor-pointer text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Detalhes técnicos
      </summary>
      <dl className="mt-3 space-y-2.5">
        {item.pillar && <Field label="Pilar">{item.pillar}</Field>}
        {item.keyword && (
          <Field label="Keyword">
            <span className="font-mono">{item.keyword}</span>
          </Field>
        )}
        {item.notes && (
          <Field label="Notas">
            <p className="whitespace-pre-wrap text-muted-foreground">
              {item.notes}
            </p>
          </Field>
        )}
        <Field label="Metadata">
          <pre className="overflow-auto rounded-md bg-background p-2 text-[11px] text-muted-foreground">
            {JSON.stringify(item.metadata, null, 2)}
          </pre>
        </Field>
        {item.error_message && item.status !== "failed" && (
          <Field label="Último erro">
            <p className="rounded-md bg-rose-50 p-2 text-rose-800">
              {item.error_message}
            </p>
          </Field>
        )}
        {item.notion_page_id && (
          <Field label="Notion page id">
            <span className="font-mono text-xs">{item.notion_page_id}</span>
          </Field>
        )}
      </dl>
    </details>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-start gap-3">
      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function extractPosts(item: PipelineRow): string[] {
  // edited_content tem prioridade — é o que o usuário aprovou.
  // Em 'rejected' caímos no edited (se houve edit antes) ou no generated.
  const candidate = item.edited_content ?? item.generated_content;
  const parsed = xGeneratedSchema.safeParse(candidate);
  if (parsed.success) return parsed.data.posts;
  return [];
}
