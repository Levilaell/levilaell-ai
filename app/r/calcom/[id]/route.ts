/**
 * Redirect interno que cancela a sequência de e-mails antes de levar o lead
 * pra página de agendamento. Mantém o path /r/calcom/[id] porque já está nos
 * emails enviados — mudar quebraria links em caixas de entrada — mas agora
 * redireciona pra /agendar?d=<id> em vez do Cal.com (migração 2026-05-18).
 *
 * Caminho feliz:
 *   GET /r/calcom/{diagnosisId}
 *     → cancela email_sequences scheduled
 *     → registra tracking_event 'calcom_clicked' (legado, mantido pro funnel
 *        histórico — admin-stats soma com scheduling_dialog_opened)
 *     → 302 pro /agendar?d=<id>
 */
import { NextResponse } from "next/server";
import {
  cancelEmailSequence,
  isSupabaseConfigured,
  trackEvent,
} from "@/lib/supabase";
import { siteConfig } from "@/lib/site";

type Params = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const target = `${siteConfig.url}/agendar?d=${encodeURIComponent(id)}`;

  if (isSupabaseConfigured()) {
    try {
      await cancelEmailSequence(id);
    } catch (err) {
      console.error(
        "[redirect:agendar] cancelEmailSequence failed",
        err instanceof Error ? err.message : err,
      );
    }
    try {
      await trackEvent({
        event_type: "calcom_clicked",
        event_data: { diagnosis_id: id, redirected_to: "agendar" },
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
