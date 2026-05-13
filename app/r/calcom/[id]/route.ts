/**
 * Redirect interno pro Cal.com que cancela a sequência de e-mails antes de
 * mandar o lead pro agendamento. Usado nos links das sequências (emails 2-6)
 * e no CTA de "Agendar conversa gratuita" na /diagnosis/result/[id].
 *
 * Caminho feliz:
 *   GET /r/calcom/{diagnosisId}
 *     → cancela email_sequences scheduled
 *     → registra tracking_event 'calcom_clicked'
 *     → 302 pro NEXT_PUBLIC_CALCOM_URL
 */
import { NextResponse } from "next/server";
import {
  cancelEmailSequence,
  isSupabaseConfigured,
  trackEvent,
} from "@/lib/supabase";
import { getCalcomUrl } from "@/lib/calcom";
import { siteConfig } from "@/lib/site";

type Params = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const calcomUrl = getCalcomUrl();
  const fallback = `mailto:${siteConfig.email.contact}`;
  const target = calcomUrl ?? fallback;

  if (isSupabaseConfigured()) {
    try {
      await cancelEmailSequence(id);
    } catch (err) {
      console.error(
        "[redirect:calcom] cancelEmailSequence failed",
        err instanceof Error ? err.message : err,
      );
    }
    try {
      await trackEvent({
        event_type: "calcom_clicked",
        event_data: { diagnosis_id: id },
        referrer: request.headers.get("referer") ?? null,
        user_agent: request.headers.get("user-agent") ?? null,
        page_path: `/r/calcom/${id}`,
      });
    } catch {
      // silent — tracking nunca bloqueia
    }
  }

  return NextResponse.redirect(target, { status: 302 });
}
