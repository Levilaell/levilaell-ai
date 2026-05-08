import { getSupabaseService } from "@/lib/supabase";
import {
  canTransition,
  type CreatePipelineInput,
  type ListPipelineQuery,
  type PatchPipelineInput,
  type PipelineRow,
  type PipelineStatus,
  type PipelineUpdate,
} from "@/types/admin";

export class PipelineError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "PipelineError";
    this.status = status;
  }
}

function service() {
  const c = getSupabaseService();
  if (!c) {
    throw new PipelineError(
      "Supabase service client não configurado.",
      503,
    );
  }
  return c;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------
export async function listPipeline(
  query: ListPipelineQuery = {},
): Promise<PipelineRow[]> {
  let q = service()
    .from("content_pipeline")
    .select("*")
    .order("created_at", { ascending: false });

  if (query.channel) q = q.eq("channel", query.channel);
  if (query.status) q = q.eq("status", query.status);

  const { data, error } = await q;
  if (error) {
    console.error("[admin-pipeline] list failed", error);
    throw new PipelineError(error.message, 500);
  }
  return data ?? [];
}

export async function getPipelineById(id: string): Promise<PipelineRow | null> {
  const { data, error } = await service()
    .from("content_pipeline")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[admin-pipeline] get failed", { id, error });
    throw new PipelineError(error.message, 500);
  }
  return data ?? null;
}

export async function createPipelineEntry(
  input: CreatePipelineInput,
): Promise<PipelineRow> {
  const insert = {
    channel: input.channel,
    topic: input.topic,
    notes: input.notes ?? null,
    metadata: input.metadata as unknown as PipelineRow["metadata"],
    pillar: input.channel === "blog" ? input.pillar : null,
    keyword: input.channel === "blog" ? input.keyword : null,
  };

  const { data, error } = await service()
    .from("content_pipeline")
    .insert(insert)
    .select("*")
    .single();
  if (error) {
    console.error("[admin-pipeline] create failed", error);
    throw new PipelineError(error.message, 500);
  }
  return data;
}

export async function patchPipelineEntry(
  id: string,
  patch: PatchPipelineInput,
): Promise<PipelineRow> {
  const current = await getPipelineById(id);
  if (!current) throw new PipelineError("Item não encontrado.", 404);

  const update: PipelineUpdate = {};

  if (patch.status && patch.status !== current.status) {
    if (!canTransition(current.status, patch.status)) {
      throw new PipelineError(
        `Transição inválida: ${current.status} → ${patch.status}`,
        409,
      );
    }
    update.status = patch.status;
    if (patch.status === "approved") update.approved_at = new Date().toISOString();
    if (patch.status === "published") update.published_at = new Date().toISOString();
  }

  if (patch.edited_content !== undefined) {
    update.edited_content = patch.edited_content as PipelineRow["edited_content"];
  }
  if (patch.topic !== undefined) update.topic = patch.topic;
  if (patch.notes !== undefined) update.notes = patch.notes;
  if (patch.pillar !== undefined) update.pillar = patch.pillar;
  if (patch.keyword !== undefined) update.keyword = patch.keyword;
  if (patch.metadata !== undefined) {
    update.metadata = patch.metadata as PipelineRow["metadata"];
  }

  if (Object.keys(update).length === 0) return current;

  const { data, error } = await service()
    .from("content_pipeline")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    console.error("[admin-pipeline] patch failed", { id, error });
    throw new PipelineError(error.message, 500);
  }
  return data;
}

export async function deletePipelineEntry(id: string): Promise<void> {
  const { error } = await service()
    .from("content_pipeline")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("[admin-pipeline] delete failed", { id, error });
    throw new PipelineError(error.message, 500);
  }
}

// ---------------------------------------------------------------------------
// Phase 2 helper — claim atômico para evitar double-generation. Aceita
// 'generated' também: usado quando o usuário pede "regenerar" no review modal.
// ---------------------------------------------------------------------------
const CLAIMABLE: PipelineStatus[] = ["queued", "failed", "generated"];

export async function claimForGeneration(
  id: string,
): Promise<PipelineRow | null> {
  const { data, error } = await service()
    .from("content_pipeline")
    .update({
      status: "generating",
      error_message: null,
      generated_content: null,
      edited_content: null,
    })
    .eq("id", id)
    .in("status", CLAIMABLE)
    .select("*")
    .maybeSingle();
  if (error) {
    console.error("[admin-pipeline] claim failed", { id, error });
    throw new PipelineError(error.message, 500);
  }
  return data ?? null;
}
