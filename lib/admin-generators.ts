import { getSupabaseService } from "@/lib/supabase";
import {
  ANTHROPIC_MODEL,
  estimateCostBRL,
  GenerationError,
  getAdminClient,
} from "@/lib/admin-anthropic";
import {
  buildXPrompt,
  X_TOOL_NAME,
  X_TOOL_SCHEMA,
} from "@/lib/admin-prompts/x";
import {
  buildBlogPrompt,
  BLOG_TOOL_NAME,
  BLOG_TOOL_SCHEMA,
} from "@/lib/admin-prompts/blog";
import {
  blogGeneratedSchema,
  xGeneratedSchema,
  type BlogMetadata,
  type PipelineRow,
  type XMetadata,
} from "@/types/admin";
import { trackAdminEvent } from "@/lib/admin-tracking";
import { sendEditorialReadyEmail } from "@/lib/admin-notifications";

const MAX_OUTPUT_TOKENS_X = 2_000;
const MAX_OUTPUT_TOKENS_BLOG = 8_000;
const MAX_RETRIES = 2;
const MAX_RETRIES_BLOG = 3; // artigo é caro pra perder por 429

/**
 * Roda a geração para uma entry já claimed (status='generating').
 * Em caso de erro, marca como failed; em caso de sucesso, status='generated'.
 * Não lança — desenhada pra rodar dentro de `after()`.
 */
export async function runGeneration(entry: PipelineRow): Promise<void> {
  try {
    if (entry.status !== "generating") {
      console.warn("[admin-generators] entry not in generating", {
        id: entry.id,
        status: entry.status,
      });
      return;
    }
    if (entry.channel === "x") {
      await runX(entry);
      return;
    }
    if (entry.channel === "blog") {
      await runBlog(entry);
      return;
    }
    await markFailed(
      entry.id,
      `Canal ${entry.channel} ainda não suportado (Phase 4).`,
    );
  } catch (err) {
    console.error("[admin-generators] unhandled", {
      id: entry.id,
      err: err instanceof Error ? err.message : err,
    });
    await markFailed(
      entry.id,
      err instanceof Error ? err.message : "Erro desconhecido.",
    );
  }
}

// ---------------------------------------------------------------------------
// X channel
// ---------------------------------------------------------------------------
async function runX(entry: PipelineRow): Promise<void> {
  const client = getAdminClient();
  if (!client) {
    await markFailed(
      entry.id,
      "ANTHROPIC_API_KEY ausente — não consegui chamar Claude.",
    );
    return;
  }

  const metadata = entry.metadata as unknown as XMetadata;
  const prompt = buildXPrompt({
    topic: entry.topic,
    notes: entry.notes,
    metadata,
  });

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const startedAt = Date.now();
      const response = await client.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: MAX_OUTPUT_TOKENS_X,
        tools: [X_TOOL_SCHEMA],
        tool_choice: { type: "tool", name: X_TOOL_NAME },
        messages: [{ role: "user", content: prompt }],
      });

      const toolUse = response.content.find(
        (b): b is Extract<typeof b, { type: "tool_use" }> =>
          b.type === "tool_use",
      );
      if (!toolUse) {
        throw new GenerationError("Claude não retornou tool_use.");
      }

      const parsed = xGeneratedSchema.safeParse(toolUse.input);
      if (!parsed.success) {
        throw new GenerationError(
          `Schema inválido: ${parsed.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; ")}`,
        );
      }

      const cost = estimateCostBRL({
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      });
      const durationMs = Date.now() - startedAt;

      await markGenerated(entry.id, {
        generated_content: parsed.data,
        tokens_used: cost.totalTokens,
        cost_estimate_brl: cost.costBRL,
        generated_in_ms: durationMs,
      });

      console.info(
        `[admin-generators] x ok · id=${entry.id} · in=${response.usage.input_tokens} out=${response.usage.output_tokens} · ${durationMs}ms`,
      );
      void trackAdminEvent("admin_pipeline_generated", {
        pipeline_id: entry.id,
        channel: "x",
        cost_brl: cost.costBRL,
        tokens: cost.totalTokens,
        duration_ms: durationMs,
        generation_count: entry.generation_count,
      });
      void sendEditorialReadyEmail({
        pipelineId: entry.id,
        channel: "x",
        topic: entry.topic,
        durationMs,
        costBRL: cost.costBRL,
        tokens: cost.totalTokens,
      });
      return;
    } catch (err) {
      lastError = err;
      const status = (err as { status?: number }).status;
      const retryable =
        attempt < MAX_RETRIES &&
        (!status || status === 429 || status === 500 || status === 502 || status === 503);
      if (!retryable) break;
      const backoff = 1000 * 2 ** (attempt - 1);
      console.warn(
        `[admin-generators] x retry ${attempt}/${MAX_RETRIES} em ${backoff}ms`,
        err instanceof Error ? err.message : err,
      );
      await new Promise((r) => setTimeout(r, backoff));
    }
  }

  await markFailed(
    entry.id,
    lastError instanceof Error ? lastError.message : "Falha ao chamar Claude.",
  );
}

// ---------------------------------------------------------------------------
// Blog channel
// ---------------------------------------------------------------------------
async function runBlog(entry: PipelineRow): Promise<void> {
  const client = getAdminClient();
  if (!client) {
    await markFailed(
      entry.id,
      "ANTHROPIC_API_KEY ausente — não consegui chamar Claude.",
    );
    return;
  }

  if (!entry.keyword || !entry.pillar) {
    await markFailed(
      entry.id,
      "Blog precisa de keyword e pillar definidos no tema antes de gerar.",
    );
    return;
  }

  const metadata = entry.metadata as unknown as BlogMetadata;
  const prompt = buildBlogPrompt({
    topic: entry.topic,
    notes: entry.notes,
    keyword: entry.keyword,
    pillar: entry.pillar as "1" | "2" | "3",
    metadata,
  });

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES_BLOG; attempt++) {
    try {
      const startedAt = Date.now();
      const response = await client.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: MAX_OUTPUT_TOKENS_BLOG,
        tools: [BLOG_TOOL_SCHEMA],
        tool_choice: { type: "tool", name: BLOG_TOOL_NAME },
        messages: [{ role: "user", content: prompt }],
      });

      const toolUse = response.content.find(
        (b): b is Extract<typeof b, { type: "tool_use" }> =>
          b.type === "tool_use",
      );
      if (!toolUse) {
        throw new GenerationError("Claude não retornou tool_use.");
      }

      const parsed = blogGeneratedSchema.safeParse(toolUse.input);
      if (!parsed.success) {
        throw new GenerationError(
          `Schema inválido: ${parsed.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; ")}`,
        );
      }

      const cost = estimateCostBRL({
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      });
      const durationMs = Date.now() - startedAt;

      await markGenerated(entry.id, {
        generated_content: parsed.data,
        tokens_used: cost.totalTokens,
        cost_estimate_brl: cost.costBRL,
        generated_in_ms: durationMs,
      });

      console.info(
        `[admin-generators] blog ok · id=${entry.id} · in=${response.usage.input_tokens} out=${response.usage.output_tokens} · ${durationMs}ms · ${parsed.data.content_markdown.length} chars`,
      );
      void trackAdminEvent("admin_pipeline_generated", {
        pipeline_id: entry.id,
        channel: "blog",
        cost_brl: cost.costBRL,
        tokens: cost.totalTokens,
        duration_ms: durationMs,
        generation_count: entry.generation_count,
      });
      void sendEditorialReadyEmail({
        pipelineId: entry.id,
        channel: "blog",
        topic: entry.topic,
        durationMs,
        costBRL: cost.costBRL,
        tokens: cost.totalTokens,
      });
      return;
    } catch (err) {
      lastError = err;
      const status = (err as { status?: number }).status;
      const retryable =
        attempt < MAX_RETRIES_BLOG &&
        (!status || status === 429 || status === 500 || status === 502 || status === 503);
      if (!retryable) break;
      const backoff = 2000 * 2 ** (attempt - 1); // 2s, 4s, 8s
      console.warn(
        `[admin-generators] blog retry ${attempt}/${MAX_RETRIES_BLOG} em ${backoff}ms`,
        err instanceof Error ? err.message : err,
      );
      await new Promise((r) => setTimeout(r, backoff));
    }
  }

  await markFailed(
    entry.id,
    lastError instanceof Error ? lastError.message : "Falha ao chamar Claude.",
  );
}

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------
async function markFailed(id: string, message: string): Promise<void> {
  const supabase = getSupabaseService();
  if (!supabase) {
    console.error("[admin-generators] markFailed sem supabase", {
      id,
      message,
    });
    return;
  }
  const { error } = await supabase
    .from("content_pipeline")
    .update({ status: "failed", error_message: message })
    .eq("id", id);
  if (error) {
    console.error("[admin-generators] markFailed db error", {
      id,
      error,
    });
  }
  void trackAdminEvent("admin_pipeline_failed", {
    pipeline_id: id,
    reason: message,
  });
}

async function markGenerated(
  id: string,
  patch: {
    generated_content: unknown;
    tokens_used: number;
    cost_estimate_brl: number;
    generated_in_ms: number;
  },
): Promise<void> {
  const supabase = getSupabaseService();
  if (!supabase) {
    console.error("[admin-generators] markGenerated sem supabase", { id });
    return;
  }
  const { error } = await supabase
    .from("content_pipeline")
    .update({
      status: "generated",
      generated_content:
        patch.generated_content as PipelineRow["generated_content"],
      generated_at: new Date().toISOString(),
      tokens_used: patch.tokens_used,
      cost_estimate_brl: patch.cost_estimate_brl,
      generated_in_ms: patch.generated_in_ms,
      error_message: null,
    })
    .eq("id", id);
  if (error) {
    console.error("[admin-generators] markGenerated db error", { id, error });
  }
}
