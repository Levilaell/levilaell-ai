/**
 * POST /api/scheduling/request
 *
 * Recebe o form de "Agendar conversa" e:
 *   1. Salva em scheduling_requests (se Supabase configurado)
 *   2. Cancela email sequence pendente (se vier diagnosis_id)
 *   3. Dispara notificação Telegram pro Levi + comercial
 *   4. Dispara CAPI Schedule (server-side, dedup com Pixel via event_id)
 *   5. Loga tracking_events.scheduling_submitted
 *
 * Tudo step 2-5 é graceful: ausência de integração só loga e segue.
 * O lead vê success se step 1 deu certo (ou se Supabase off, loga e ok).
 */
import { NextResponse } from "next/server";
import {
  SCHEDULING_URGENCY_LABEL,
  schedulingRequestSchema,
  type SchedulingUrgency,
} from "@/types/forms";
import {
  cancelEmailSequence,
  isSupabaseConfigured,
  markSchedulingRequestNotified,
  saveSchedulingRequest,
  trackEvent,
} from "@/lib/supabase";
import { escapeHtml, isTelegramConfigured, notifyTelegram } from "@/lib/telegram";
import { sendCapiEvent, parseFbCookies, extractClientIp } from "@/lib/server/meta-capi";
import {
  hashEmailServer,
  hashPhoneServer,
  hashNameServer,
  firstNameFromServer,
} from "@/lib/server/hash";
import { EVENT_VALUE_BRL } from "@/lib/tracking/types";
import { siteConfig } from "@/lib/site";

export const runtime = "nodejs";

function formatWhatsappForLink(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

function buildTelegramMessage(input: {
  id: string | null;
  name: string;
  email: string;
  whatsapp: string;
  siteUrl: string;
  urgency: SchedulingUrgency;
  source: string;
  diagnosisId: string;
}): string {
  const waLink = `https://wa.me/${formatWhatsappForLink(input.whatsapp)}`;
  const urgency = SCHEDULING_URGENCY_LABEL[input.urgency];
  const lines = [
    "🔥 <b>Novo pedido de agendamento</b>",
    "",
    `<b>Nome:</b> ${escapeHtml(input.name)}`,
    `<b>WhatsApp:</b> <a href="${waLink}">${escapeHtml(input.whatsapp)}</a>`,
    `<b>Email:</b> ${escapeHtml(input.email)}`,
  ];
  if (input.siteUrl) {
    lines.push(`<b>Site:</b> ${escapeHtml(input.siteUrl)}`);
  }
  lines.push(`<b>Urgência:</b> ${escapeHtml(urgency)}`);
  if (input.source) {
    lines.push(`<b>Origem:</b> <code>${escapeHtml(input.source)}</code>`);
  }
  if (input.diagnosisId) {
    lines.push(`<b>Diagnóstico:</b> <code>${escapeHtml(input.diagnosisId)}</code>`);
  }
  if (input.id) {
    lines.push("", `<i>ID: ${escapeHtml(input.id)}</i>`);
  }
  return lines.join("\n");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = schedulingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.issues },
      { status: 422 },
    );
  }
  const data = parsed.data;
  const diagnosisId = data.diagnosis_id || "";
  const source = data.source || "";

  // -----------------------------------------------------------------------
  // 1) Persistência — único step bloqueante. Se Supabase off, segue mesmo
  // assim (fail-open) pra não bloquear conversão.
  // -----------------------------------------------------------------------
  let requestId: string | null = null;
  if (isSupabaseConfigured()) {
    try {
      const saved = await saveSchedulingRequest({
        name: data.name,
        email: data.email,
        whatsapp: data.whatsapp,
        site_url: (data.site_url || "").trim() || null,
        urgency: data.urgency,
        source: source || null,
        diagnosis_id: diagnosisId || null,
        utm_source: data.utm_source ?? null,
        utm_medium: data.utm_medium ?? null,
        utm_campaign: data.utm_campaign ?? null,
        utm_content: data.utm_content ?? null,
        utm_term: data.utm_term ?? null,
        landing_page: data.landing_page ?? null,
        referrer: data.referrer ?? null,
      });
      requestId = saved.id;
    } catch (err) {
      console.error(
        "[scheduling] save failed",
        err instanceof Error ? err.message : err,
      );
      // Não falhar pro lead — segue pra notificar mesmo sem persistir.
    }
  } else {
    console.info("[scheduling] supabase off — não persistido", {
      source,
      urgency: data.urgency,
    });
  }

  // -----------------------------------------------------------------------
  // 2) Cancela email sequence (se veio de diagnóstico). Silent fail.
  // -----------------------------------------------------------------------
  if (diagnosisId && isSupabaseConfigured()) {
    try {
      await cancelEmailSequence(diagnosisId);
    } catch (err) {
      console.error(
        "[scheduling] cancelEmailSequence failed (silent)",
        err instanceof Error ? err.message : err,
      );
    }
  }

  // -----------------------------------------------------------------------
  // 3) Notificação Telegram. Silent fail.
  // -----------------------------------------------------------------------
  if (isTelegramConfigured()) {
    const text = buildTelegramMessage({
      id: requestId,
      name: data.name,
      email: data.email,
      whatsapp: data.whatsapp,
      siteUrl: data.site_url ?? "",
      urgency: data.urgency,
      source,
      diagnosisId,
    });
    const results = await notifyTelegram({ text, parseMode: "HTML" });
    if (results.some((r) => r.ok) && requestId) {
      await markSchedulingRequestNotified(requestId);
    }
  } else {
    console.info("[scheduling] telegram off — sem notificação interna", {
      request_id: requestId,
      source,
    });
  }

  // -----------------------------------------------------------------------
  // 4) CAPI Schedule (server-side). event_id = requestId quando temos, senão
  // gera um próprio. Cliente também dispara Pixel.schedule com mesmo id =>
  // dedup. Silent fail.
  // -----------------------------------------------------------------------
  const eventId =
    requestId ??
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `sched_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  try {
    await sendCapiEvent({
      event_name: "Schedule",
      event_id: eventId,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: request.headers.get("referer") ?? siteConfig.url,
      user_data: {
        em: hashEmailServer(data.email),
        ph: hashPhoneServer(data.whatsapp),
        fn: hashNameServer(firstNameFromServer(data.name)),
        client_ip_address: extractClientIp(request.headers),
        client_user_agent: request.headers.get("user-agent") ?? undefined,
        ...parseFbCookies(request.headers.get("cookie")),
      },
      custom_data: {
        value: EVENT_VALUE_BRL.schedule,
        currency: "BRL",
      },
    });
  } catch (err) {
    console.error(
      "[scheduling] CAPI Schedule failed (silent)",
      err instanceof Error ? err.message : err,
    );
  }

  // -----------------------------------------------------------------------
  // 5) Tracking interno. Silent fail.
  // -----------------------------------------------------------------------
  await trackEvent({
    event_type: "scheduling_submitted",
    event_data: {
      request_id: requestId,
      urgency: data.urgency,
      source: source || null,
      diagnosis_id: diagnosisId || null,
      has_site_url: Boolean(data.site_url),
    },
    page_path: request.headers.get("referer") ?? null,
    user_agent: request.headers.get("user-agent") ?? null,
  });

  return NextResponse.json({
    ok: true,
    event_id: eventId,
  });
}
