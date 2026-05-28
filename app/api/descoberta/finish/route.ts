/**
 * POST /api/descoberta/finish
 *
 * Fecha a descoberta. Mesmo pipeline do form de agendamento — a descoberta é
 * só uma captura mais rica do mesmo lead:
 *   1. Extrai dados estruturados + recap (Sonnet). Falha → segue sem extração.
 *   2. Persiste em scheduling_requests (source=descoberta, transcript+extracted).
 *   3. Cancela email sequence pendente (se veio diagnosis_id).
 *   4. Telegram pro Levi com a necessidade + Q&A + extração.
 *   5. CAPI Lead (tier=hot) — mesmo evento de conversion do agendamento.
 *   6. CRM webhook (lead-from-site).
 *   7. tracking_events.descoberta_submitted
 *
 * Steps 2-7 são graceful (loga e segue). Devolve { ok, event_id, recap }.
 * O recap é o "aqui está o que entendi" mostrado pro lead na tela final.
 */
import { NextResponse } from "next/server";
import { discoveryFinishRequestSchema } from "@/types/forms";
import {
  extractAndRecap,
  isDescobertaAiConfigured,
  type DescobertaExtract,
} from "@/lib/descoberta/ai";
import { prazoToUrgency } from "@/lib/descoberta/slots";
import {
  cancelEmailSequence,
  isSupabaseConfigured,
  markSchedulingRequestNotified,
  saveSchedulingRequest,
  trackEvent,
} from "@/lib/supabase";
import { escapeHtml, isTelegramConfigured, notifyTelegram } from "@/lib/telegram";
import { notifyCrmLeadFromForm } from "@/lib/crm-webhook";
import {
  sendCapiEvent,
  parseFbCookies,
  extractClientIp,
} from "@/lib/server/meta-capi";
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

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function buildTelegramMessage(input: {
  id: string | null;
  name: string;
  email: string;
  whatsapp: string;
  need: string;
  collected: { key: string; question: string; answer: string }[];
  extracted: DescobertaExtract | null;
}): string {
  const waLink = `https://wa.me/${formatWhatsappForLink(input.whatsapp)}`;
  const lines = [
    "🧭 <b>Nova descoberta concluída</b>",
    "",
    `<b>Nome:</b> ${escapeHtml(input.name)}`,
    `<b>WhatsApp:</b> <a href="${waLink}">${escapeHtml(input.whatsapp)}</a>`,
    `<b>Email:</b> ${escapeHtml(input.email)}`,
    "",
    `<b>Precisa:</b> ${escapeHtml(truncate(input.need, 400))}`,
    "",
    "<b>Respostas:</b>",
  ];
  for (const c of input.collected) {
    lines.push(
      `• <b>${escapeHtml(truncate(c.question, 80))}</b> ${escapeHtml(truncate(c.answer, 280))}`,
    );
  }
  if (input.extracted) {
    const e = input.extracted;
    lines.push("", "<b>Extração (IA):</b>", escapeHtml(truncate(e.resumo, 400)));
    if (e.escopo_sugerido?.length) {
      lines.push("<b>Escopo sugerido:</b>");
      for (const item of e.escopo_sugerido.slice(0, 4)) {
        lines.push(`  – ${escapeHtml(truncate(item, 160))}`);
      }
    }
    if (e.perguntas_em_aberto?.length) {
      lines.push(
        `<b>Em aberto:</b> ${escapeHtml(
          truncate(e.perguntas_em_aberto.join("; "), 300),
        )}`,
      );
    }
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

  const parsed = discoveryFinishRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.issues },
      { status: 422 },
    );
  }
  const data = parsed.data;
  const diagnosisId = data.diagnosis_id || "";
  const source = data.source || "descoberta";

  // -----------------------------------------------------------------------
  // 1) Extração + recap (Sonnet). Falha → segue sem extração; o lead ainda
  //    é capturado e o transcript bruto vai pro Telegram.
  // -----------------------------------------------------------------------
  // Timeout duro na extração: Sonnet lento/sobrecarregado não pode travar o
  // lead. Se estourar 12s, segue sem extração (recap cai pro fallback) e o
  // pipeline dispara mesmo assim — o lead é sempre capturado.
  let extracted: DescobertaExtract | null = null;
  let recap: string | null = null;
  if (isDescobertaAiConfigured()) {
    const extractP = extractAndRecap({
      need: data.need,
      collected: data.collected,
    });
    // Evita unhandledRejection se a promise resolver/rejeitar depois do timeout.
    extractP.catch(() => {});
    try {
      const result = await Promise.race([
        extractP,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("extract timeout (12s)")), 12_000),
        ),
      ]);
      extracted = result;
      recap = result.recap;
    } catch (err) {
      console.error(
        "[descoberta/finish] extração falhou/timeout (silent)",
        err instanceof Error ? err.message : err,
      );
    }
  }

  const prazoAnswer = data.collected.find((c) => c.key === "prazo")?.answer;
  const urgency = prazoToUrgency(prazoAnswer);

  // -----------------------------------------------------------------------
  // 2) Persistência (graceful — fail-open pra não bloquear conversão).
  // -----------------------------------------------------------------------
  let requestId: string | null = null;
  if (isSupabaseConfigured()) {
    try {
      const saved = await saveSchedulingRequest({
        name: data.name,
        email: data.email,
        whatsapp: data.whatsapp,
        site_url: null,
        urgency,
        source,
        diagnosis_id: diagnosisId || null,
        utm_source: data.utm_source ?? null,
        utm_medium: data.utm_medium ?? null,
        utm_campaign: data.utm_campaign ?? null,
        utm_content: data.utm_content ?? null,
        utm_term: data.utm_term ?? null,
        landing_page: data.landing_page ?? null,
        referrer: data.referrer ?? null,
        transcript: data.collected,
        extracted,
      });
      requestId = saved.id;
    } catch (err) {
      console.error(
        "[descoberta/finish] save failed",
        err instanceof Error ? err.message : err,
      );
    }
  }

  // -----------------------------------------------------------------------
  // 3) Cancela email sequence (se veio de diagnóstico). Silent fail.
  // -----------------------------------------------------------------------
  if (diagnosisId && isSupabaseConfigured()) {
    try {
      await cancelEmailSequence(diagnosisId);
    } catch (err) {
      console.error(
        "[descoberta/finish] cancelEmailSequence failed (silent)",
        err instanceof Error ? err.message : err,
      );
    }
  }

  // -----------------------------------------------------------------------
  // 4) Telegram. Silent fail.
  // -----------------------------------------------------------------------
  if (isTelegramConfigured()) {
    const text = buildTelegramMessage({
      id: requestId,
      name: data.name,
      email: data.email,
      whatsapp: data.whatsapp,
      need: data.need,
      collected: data.collected,
      extracted,
    });
    const results = await notifyTelegram({ text, parseMode: "HTML" });
    if (results.some((r) => r.ok) && requestId) {
      await markSchedulingRequestNotified(requestId);
    }
  }

  // -----------------------------------------------------------------------
  // 5) CAPI Lead (tier=hot). event_id = requestId quando temos. Silent fail.
  // -----------------------------------------------------------------------
  const eventId =
    requestId ??
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `desc_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  try {
    await sendCapiEvent({
      event_name: "Lead",
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
        value: EVENT_VALUE_BRL.hot_lead,
        currency: "BRL",
        lead_quality: "hot",
      },
    });
  } catch (err) {
    console.error(
      "[descoberta/finish] CAPI Lead failed (silent)",
      err instanceof Error ? err.message : err,
    );
  }

  // -----------------------------------------------------------------------
  // 6) CRM Levi Lael. Silent fail.
  // -----------------------------------------------------------------------
  try {
    const msgParts = [`Descoberta: ${truncate(data.need, 200)}`];
    if (extracted?.resumo) msgParts.push(`Resumo: ${truncate(extracted.resumo, 200)}`);
    await notifyCrmLeadFromForm({
      source: "whatsapp_form",
      name: data.name,
      email: data.email,
      phone: data.whatsapp,
      message: msgParts.join(" · "),
    });
  } catch (err) {
    console.error(
      "[descoberta/finish] CRM webhook failed (silent)",
      err instanceof Error ? err.message : err,
    );
  }

  // -----------------------------------------------------------------------
  // 7) Tracking interno. Silent fail.
  // -----------------------------------------------------------------------
  await trackEvent({
    event_type: "descoberta_submitted",
    event_data: {
      request_id: requestId,
      urgency,
      source,
      diagnosis_id: diagnosisId || null,
      questions_answered: data.collected.length,
      extracted: Boolean(extracted),
    },
    page_path: request.headers.get("referer") ?? null,
    user_agent: request.headers.get("user-agent") ?? null,
  });

  return NextResponse.json({ ok: true, event_id: eventId, recap });
}
