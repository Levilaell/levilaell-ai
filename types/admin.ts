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
//
// `failed → publishing` permite retry de publish (ex: Notion 503 após user já
// ter aprovado e editado). Sem isso, retry exigia regenerar do zero e perder
// edições. Detecção generate-fail vs publish-fail é feita pela presença de
// notion_page_id / edited_content (ver pipeline-card.tsx).
export const PIPELINE_TRANSITIONS: Record<PipelineStatus, PipelineStatus[]> = {
  queued: ["generating", "rejected"],
  generating: ["generated", "failed"],
  generated: ["approved", "rejected", "generating"], // re-gerar volta pra generating
  approved: ["publishing", "rejected"],
  publishing: ["published", "failed"],
  published: [],
  rejected: ["queued"], // permite "ressuscitar" item rejeitado
  failed: ["queued", "generating", "publishing"], // retry generate ou publish
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

// Brief Phase 3: artigos médios 1500-2500 palavras. Permitimos faixa mais
// ampla (1000-3000) pra ter espaço de teste/oversize sem ter que mexer no
// schema; default no UI é 2000.
export const blogMetadataSchema = z.object({
  target_words: z.number().int().min(1000).max(3000),
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

// ---------------------------------------------------------------------------
// Generated content schemas — usados pra validar tool_use do Claude e o
// payload editado que vem do front.
// ---------------------------------------------------------------------------
export const xGeneratedSchema = z.object({
  posts: z.array(z.string().min(1).max(280)).min(1).max(10),
});

export type XGeneratedOutput = z.infer<typeof xGeneratedSchema>;

export const xEditedSchema = z.object({
  posts: z.array(z.string().min(1).max(280)).min(1).max(10),
});

// ---------------------------------------------------------------------------
// Blog channel (Phase 3)
// ---------------------------------------------------------------------------
// Strict — usado pra validar tool_use do Claude. content_markdown >= 8000
// chars ≈ 1500 palavras (target mínimo do brief).
export const blogGeneratedSchema = z.object({
  title: z.string().min(30).max(80),
  slug: z
    .string()
    .min(5)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug deve ser kebab-case"),
  meta_title: z.string().min(30).max(70),
  meta_description: z.string().min(120).max(170),
  excerpt: z.string().min(80).max(200),
  reading_time_minutes: z.number().int().min(5).max(25),
  content_markdown: z.string().min(8000),
  pillar: z.enum(["1", "2", "3"]),
  target_keyword: z.string().min(2).max(80),
  secondary_keywords: z.array(z.string().min(2).max(80)).min(2).max(7),
});

export type BlogGeneratedOutput = z.infer<typeof blogGeneratedSchema>;

// Editado — ranges levemente mais permissivos pra acomodar revisão humana.
// Aprova-e-publica re-valida com este schema.
export const blogEditedSchema = z.object({
  title: z.string().min(30).max(80),
  slug: z
    .string()
    .min(5)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug deve ser kebab-case"),
  meta_title: z.string().min(30).max(70),
  meta_description: z.string().min(120).max(170),
  excerpt: z.string().min(80).max(200),
  reading_time_minutes: z.number().int().min(3).max(30),
  content_markdown: z.string().min(8000),
  pillar: z.enum(["1", "2", "3"]),
  target_keyword: z.string().min(2).max(80),
  secondary_keywords: z.array(z.string().min(2).max(80)).min(0).max(7),
});

export type BlogEditedOutput = z.infer<typeof blogEditedSchema>;

// Pillar ('1'|'2'|'3') → slug usado no Notion DB e nas rotas /blog/category.
// SLUGS, não display labels. lib/notion.ts filtra por slug; mudar isso quebra
// listagem do blog público.
export const PILLAR_SLUG_MAP: Record<"1" | "2" | "3", string> = {
  "1": "ai-applied",
  "2": "automation-stack",
  "3": "professional-operations",
};

export const PILLAR_LABEL_MAP: Record<"1" | "2" | "3", string> = {
  "1": "IA Aplicada a Operações",
  "2": "Automação com n8n e Stack Moderna",
  "3": "Profissionalização de Operações",
};
