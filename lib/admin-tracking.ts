/**
 * Server-side tracking pra fluxo do /admin. Reusa a tabela tracking_events
 * (mesma do site público), mas com session_id="admin" pra distinguir.
 *
 * Fire-and-forget — nunca lança. trackEvent já é resiliente.
 */
import { trackEvent } from "@/lib/supabase";

export type AdminEventType =
  | "admin_pipeline_created"
  | "admin_pipeline_generated"
  | "admin_pipeline_approved"
  | "admin_pipeline_published"
  | "admin_pipeline_rejected"
  | "admin_pipeline_failed";

export type AdminEventData = {
  pipeline_id?: string;
  channel?: string;
  cost_brl?: number;
  tokens?: number;
  duration_ms?: number;
  generation_count?: number;
  reason?: string;
  notion_page_id?: string;
};

export async function trackAdminEvent(
  type: AdminEventType,
  data: AdminEventData = {},
): Promise<void> {
  try {
    await trackEvent({
      event_type: type,
      event_data: data as Record<string, unknown>,
      session_id: "admin",
      user_agent: null,
      referrer: null,
      page_path: "/admin",
    });
  } catch (err) {
    console.warn("[admin-tracking] silent fail", {
      type,
      err: err instanceof Error ? err.message : err,
    });
  }
}
