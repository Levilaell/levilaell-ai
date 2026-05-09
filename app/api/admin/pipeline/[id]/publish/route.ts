import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminAuthorized } from "@/lib/admin-auth";
import {
  getPipelineById,
  patchPipelineEntry,
  PipelineError,
} from "@/lib/admin-pipeline";
import { getSupabaseService } from "@/lib/supabase";
import {
  NotionPublishError,
  preflightNotionBlog,
  publishArticleToNotion,
} from "@/lib/notion-publish";
import {
  PILLAR_SLUG_MAP,
  type BlogEditedOutput,
  type PipelineRow,
  type PipelineUpdate,
} from "@/types/admin";
import { siteConfig } from "@/lib/site";
import { trackAdminEvent } from "@/lib/admin-tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Params = Promise<{ id: string }>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request, ctx: { params: Params }) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  let entry;
  try {
    entry = await getPipelineById(id);
  } catch (err) {
    return errorResponse(err);
  }

  if (!entry) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }

  try {
    if (entry.channel === "x") {
      return await publishXChannel(entry);
    }

    if (entry.channel === "blog") {
      return await publishBlogChannel(entry);
    }

    // Newsletter — Phase 4.
    return NextResponse.json(
      {
        error: `Publish para canal ${entry.channel} ainda não implementado.`,
      },
      { status: 501 },
    );
  } catch (err) {
    return errorResponse(err);
  }
}

// ---------------------------------------------------------------------------
// X — manual posting. Aprova → publishing → published, sem chamar API externa.
// ---------------------------------------------------------------------------
async function publishXChannel(entry: PipelineRow) {
  if (entry.status !== "approved") {
    return NextResponse.json(
      {
        error: `Publish exige status 'approved' (atual: ${entry.status}).`,
      },
      { status: 409 },
    );
  }
  const transit = await patchPipelineEntry(entry.id, { status: "publishing" });
  const published = await patchPipelineEntry(transit.id, {
    status: "published",
  });
  void trackAdminEvent("admin_pipeline_published", {
    pipeline_id: published.id,
    channel: "x",
  });
  return NextResponse.json({ entry: published });
}

// ---------------------------------------------------------------------------
// Blog — cria página no Notion + revalida ISR. Aceita retry quando o item
// ficou em 'failed' depois de ter sido aprovado/publicado parcialmente.
// ---------------------------------------------------------------------------
async function publishBlogChannel(entry: PipelineRow) {
  const isFresh = entry.status === "approved";
  const isRetry =
    entry.status === "failed" &&
    entry.edited_content !== null;

  if (!isFresh && !isRetry) {
    return NextResponse.json(
      {
        error: `Publish exige status 'approved' (atual: ${entry.status}). Pra retry, item precisa ter conteúdo aprovado.`,
      },
      { status: 409 },
    );
  }

  const content = (entry.edited_content ?? entry.generated_content) as
    | BlogEditedOutput
    | null;
  if (!content) {
    return NextResponse.json(
      { error: "Sem conteúdo aprovado pra publicar." },
      { status: 409 },
    );
  }

  // Preflight: bail early se Notion DB tá mal configurado, pra não consumir
  // tempo nem ficar com item em 'publishing' indefinidamente.
  const pre = await preflightNotionBlog();
  if (!pre.ok) {
    await persistFailure(entry.id, `[publish] ${pre.reason}`);
    return NextResponse.json({ error: pre.reason }, { status: 503 });
  }

  // Transição approved|failed → publishing.
  let publishing: PipelineRow;
  try {
    publishing = await patchPipelineEntry(entry.id, { status: "publishing" });
  } catch (err) {
    return errorResponse(err);
  }

  let result;
  try {
    result = await publishArticleToNotion(publishing);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao publicar.";
    const pageId =
      err instanceof NotionPublishError ? err.pageId : undefined;
    await persistFailure(entry.id, `[publish] ${message}`, pageId);
    if (err instanceof NotionPublishError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  // Save notion_page_id, clear error, mark published, revalidate ISR.
  const supabase = getSupabaseService();
  if (!supabase) {
    await persistFailure(
      entry.id,
      "[publish] Supabase service client não configurado (após Notion publicado).",
      result.pageId,
    );
    return NextResponse.json(
      { error: "DB indisponível após publish — confira logs e Notion." },
      { status: 503 },
    );
  }

  await supabase
    .from("content_pipeline")
    .update({
      notion_page_id: result.pageId,
      error_message: null,
    })
    .eq("id", entry.id);

  const pillarSlug = PILLAR_SLUG_MAP[content.pillar];
  revalidatePath("/blog");
  revalidatePath(`/blog/${content.slug}`);
  revalidatePath(`/blog/category/${pillarSlug}`);

  const published = await patchPipelineEntry(entry.id, { status: "published" });

  void trackAdminEvent("admin_pipeline_published", {
    pipeline_id: published.id,
    channel: "blog",
    notion_page_id: result.pageId,
  });

  return NextResponse.json({
    entry: published,
    notion_url: result.url,
    public_url: `${siteConfig.url}/blog/${content.slug}`,
    blocks_total: result.totalBlocks,
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function persistFailure(
  id: string,
  message: string,
  notionPageId?: string,
): Promise<void> {
  const supabase = getSupabaseService();
  if (!supabase) {
    console.error("[admin/publish] persistFailure sem supabase", { id, message });
    return;
  }
  const update: PipelineUpdate = {
    status: "failed",
    error_message: message,
  };
  if (notionPageId) update.notion_page_id = notionPageId;
  const { error } = await supabase
    .from("content_pipeline")
    .update(update)
    .eq("id", id);
  if (error) {
    console.error("[admin/publish] persistFailure db error", { id, error });
  }
}

function errorResponse(err: unknown) {
  if (err instanceof PipelineError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof NotionPublishError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("[admin/publish] unexpected", err);
  return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
}
