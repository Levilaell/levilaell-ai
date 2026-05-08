"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Check,
  Copy,
  Loader2,
  RotateCw,
  Trash2,
  X as XIcon,
} from "lucide-react";
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  xEditedSchema,
  xGeneratedSchema,
  type PipelineRow,
} from "@/types/admin";
import { CHANNEL_EMOJI, formatBRL } from "@/lib/admin-format";
import { cn } from "@/lib/utils";

const X_LIMIT = 280;
const X_SOFT_LIMIT = 240;

type Props = {
  item: PipelineRow | null;
  onClose: () => void;
  onUpdated: (entry: PipelineRow) => void;
};

export function ReviewModalX({ item, onClose, onUpdated }: Props) {
  return (
    <Dialog open={Boolean(item)} onOpenChange={(o) => !o && onClose()}>
      <DialogPopup size="xl">
        {item ? (
          // key resets internal state when the item changes (regen, swap)
          <ReviewBody
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

function ReviewBody({
  item,
  onClose,
  onUpdated,
}: {
  item: PipelineRow;
  onClose: () => void;
  onUpdated: (entry: PipelineRow) => void;
}) {
  const [posts, setPosts] = useState<string[]>(() => extractPosts(item));
  const [error, setError] = useState<string | null>(null);
  const [isApproving, startApprove] = useTransition();
  const [isRejecting, startReject] = useTransition();
  const [isRegenerating, startRegen] = useTransition();
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

  const copyPost = async (i: number) => {
    try {
      await navigator.clipboard.writeText(posts[i]);
      setCopiedIndex(i);
      if (copyResetRef.current) clearTimeout(copyResetRef.current);
      copyResetRef.current = setTimeout(() => setCopiedIndex(null), 1400);
    } catch {
      // ignored — browsers without clipboard fail silently
    }
  };

  const validatePosts = (): string | null => {
    const trimmed = posts.map((p) => p.trim()).filter(Boolean);
    if (trimmed.length === 0) return "Pelo menos 1 post.";
    const tooLong = trimmed.find((p) => p.length > X_LIMIT);
    if (tooLong) return `Post acima de ${X_LIMIT} caracteres.`;
    const parsed = xEditedSchema.safeParse({ posts: trimmed });
    if (!parsed.success) {
      return parsed.error.issues.map((i) => i.message).join("; ");
    }
    return null;
  };

  const onApprove = () => {
    const failure = validatePosts();
    if (failure) return setError(failure);
    startApprove(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/admin/pipeline/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "approved",
            edited_content: { posts: posts.map((p) => p.trim()).filter(Boolean) },
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
        "Regenerar tudo? Suas edições atuais vão ser descartadas. Custa uma nova chamada de IA.",
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
        // O servidor já marcou status='generating'. Closamos o modal — o
        // dashboard vai pollar e abrir de novo quando voltar 'generated'.
        const stub: PipelineRow = {
          ...item,
          status: "generating",
          generated_content: null,
          edited_content: null,
          error_message: null,
        };
        onUpdated(stub);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao regenerar.");
      }
    });
  };

  const isPending = isApproving || isRejecting || isRegenerating;

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <span aria-hidden>{CHANNEL_EMOJI.x}</span>
          X (Twitter)
          {item.cost_estimate_brl > 0 && (
            <span className="ml-auto text-[11px] normal-case tracking-normal">
              {formatBRL(item.cost_estimate_brl)} ·{" "}
              {item.tokens_used.toLocaleString("pt-BR")} tokens
            </span>
          )}
        </div>
        <DialogTitle>{item.topic}</DialogTitle>
        <DialogDescription>
          Edita inline. Aprovar move pra fila de publicação manual.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum post sobrou. Regenera ou rejeita.
          </div>
        ) : (
          posts.map((post, i) => (
            <PostCard
              key={i}
              index={i}
              post={post}
              onChange={(v) => setPost(i, v)}
              onRemove={() => removePost(i)}
              onCopy={() => copyPost(i)}
              copied={copiedIndex === i}
              disabled={isPending}
            />
          ))
        )}
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <DialogFooter className="sm:justify-between">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={isPending}
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
            disabled={isPending}
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
          disabled={isPending || posts.length === 0}
          className="rounded-lg"
        >
          {isApproving ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Check className="size-4" aria-hidden />
          )}
          Aprovar todos
        </Button>
      </DialogFooter>
    </>
  );
}

function PostCard({
  index,
  post,
  onChange,
  onRemove,
  onCopy,
  copied,
  disabled,
}: {
  index: number;
  post: string;
  onChange: (v: string) => void;
  onRemove: () => void;
  onCopy: () => void;
  copied: boolean;
  disabled: boolean;
}) {
  const len = post.length;
  const overSoft = len > X_SOFT_LIMIT;
  const overHard = len > X_LIMIT;

  return (
    <div className="rounded-xl border border-border bg-card p-3 ring-1 ring-foreground/5">
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-muted-foreground">
          Post {index + 1}
        </span>
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
      </div>
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
      </div>
    </div>
  );
}

function extractPosts(item: PipelineRow): string[] {
  // Prioriza edited_content; cai em generated_content; valida via Zod.
  const candidate = item.edited_content ?? item.generated_content;
  const parsed = xGeneratedSchema.safeParse(candidate);
  if (parsed.success) return parsed.data.posts;
  return [];
}
