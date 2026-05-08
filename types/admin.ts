import { z } from "zod";
import type { Database } from "@/types/supabase";

// ---------------------------------------------------------------------------
// Channel + status enums (mirror do schema SQL)
// ---------------------------------------------------------------------------
export type Channel = "blog" | "newsletter" | "x";

export type PipelineStatus =
  | "queued"
  | "generating"
  | "generated"
  | "approved"
  | "publishing"
  | "published"
  | "rejected"
  | "failed";

// ---------------------------------------------------------------------------
// Channel-discriminated metadata — define o shape esperado em
// content_pipeline.metadata pra cada canal. Preview na Phase 1; usado pelos
// generators em Phase 2-4.
// ---------------------------------------------------------------------------
export type XPostType = "INSIGHT_TECNICO" | "BASTIDOR" | "PROVOCACAO";
export type XPostTone = "DIRETO" | "PROVOCADOR" | "DIDATICO";

export type XMetadata = {
  type: XPostType;
  tone: XPostTone;
  quantity: number;
};

export type BlogMetadata = {
  target_words: number;
};

export type NewsletterTone = "pessoal" | "tecnico" | "opinativo";

export type NewsletterMetadata = {
  tone: NewsletterTone;
};

export type ChannelMetadata =
  | { channel: "x"; metadata: XMetadata }
  | { channel: "blog"; metadata: BlogMetadata }
  | { channel: "newsletter"; metadata: NewsletterMetadata };

// ---------------------------------------------------------------------------
// Generated content shapes (preview — schemas reais saem nas próximas phases)
// ---------------------------------------------------------------------------
export type GeneratedXContent = {
  posts: string[];
};

export type GeneratedBlogContent = {
  title: string;
  slug: string;
  meta_title: string;
  meta_description: string;
  excerpt: string;
  reading_time_minutes: number;
  content_markdown: string;
  pillar: "1" | "2" | "3";
};

export type GeneratedNewsletterContent = {
  subject: string;
  preheader: string;
  body_html: string;
  body_text: string;
  excerpt: string;
};

// ---------------------------------------------------------------------------
// Row alias + state machine
// ---------------------------------------------------------------------------
export type PipelineRow = Database["public"]["Tables"]["content_pipeline"]["Row"];
export type PipelineInsert =
  Database["public"]["Tables"]["content_pipeline"]["Insert"];
export type PipelineUpdate =
  Database["public"]["Tables"]["content_pipeline"]["Update"];

// Transições permitidas entre status. Server valida no PATCH; cliente nunca é
// fonte da verdade. Brief: queued → generating → generated → approved →
// publishing → published; ramos paralelos: rejected, failed.
export const PIPELINE_TRANSITIONS: Record<PipelineStatus, PipelineStatus[]> = {
  queued: ["generating", "rejected"],
  generating: ["generated", "failed"],
  generated: ["approved", "rejected", "generating"], // re-gerar volta pra generating
  approved: ["publishing", "rejected"],
  publishing: ["published", "failed"],
  published: [],
  rejected: ["queued"], // permite "ressuscitar" item rejeitado
  failed: ["queued", "generating"], // retry
};

export function canTransition(
  from: PipelineStatus,
  to: PipelineStatus,
): boolean {
  return PIPELINE_TRANSITIONS[from]?.includes(to) ?? false;
}

// ---------------------------------------------------------------------------
// Zod schemas (input validation)
// ---------------------------------------------------------------------------
export const xMetadataSchema = z.object({
  type: z.enum(["INSIGHT_TECNICO", "BASTIDOR", "PROVOCACAO"]),
  tone: z.enum(["DIRETO", "PROVOCADOR", "DIDATICO"]),
  quantity: z.number().int().min(1).max(10),
});

export const blogMetadataSchema = z.object({
  target_words: z.number().int().min(400).max(3000),
});

export const newsletterMetadataSchema = z.object({
  tone: z.enum(["pessoal", "tecnico", "opinativo"]),
});

const baseTopicFields = {
  topic: z.string().min(2).max(200),
  notes: z.string().max(1000).optional().nullable(),
};

export const createPipelineSchema = z.discriminatedUnion("channel", [
  z.object({
    channel: z.literal("x"),
    ...baseTopicFields,
    metadata: xMetadataSchema,
  }),
  z.object({
    channel: z.literal("blog"),
    ...baseTopicFields,
    pillar: z.enum(["1", "2", "3"]),
    keyword: z.string().min(2).max(80),
    metadata: blogMetadataSchema,
  }),
  z.object({
    channel: z.literal("newsletter"),
    ...baseTopicFields,
    metadata: newsletterMetadataSchema,
  }),
]);

export type CreatePipelineInput = z.infer<typeof createPipelineSchema>;

const pipelineStatusSchema = z.enum([
  "queued",
  "generating",
  "generated",
  "approved",
  "publishing",
  "published",
  "rejected",
  "failed",
]);

export const patchPipelineSchema = z.object({
  status: pipelineStatusSchema.optional(),
  edited_content: z.unknown().optional(),
  topic: z.string().min(2).max(200).optional(),
  notes: z.string().max(1000).optional().nullable(),
  pillar: z.string().optional().nullable(),
  keyword: z.string().optional().nullable(),
  metadata: z.unknown().optional(),
});

export type PatchPipelineInput = z.infer<typeof patchPipelineSchema>;

export const listPipelineQuerySchema = z.object({
  channel: z.enum(["blog", "newsletter", "x"]).optional(),
  status: pipelineStatusSchema.optional(),
});

export type ListPipelineQuery = z.infer<typeof listPipelineQuerySchema>;
