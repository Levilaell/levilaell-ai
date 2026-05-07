/**
 * Endpoint do tracking client-side. Recebe via fetch ou sendBeacon, valida
 * leve com zod, e grava em tracking_events. Sempre responde 204 — nem mesmo
 * payload inválido bloqueia o cliente, pra não vazar erros pra navegador.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { trackEvent } from "@/lib/supabase";

export const runtime = "nodejs";

const trackingSchema = z.object({
  type: z.string().min(1).max(60),
  data: z.record(z.string(), z.unknown()).optional(),
  sessionId: z.string().max(60).optional(),
  referrer: z.string().max(500).optional(),
  pagePath: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  const parsed = trackingSchema.safeParse(body);
  if (!parsed.success) return new NextResponse(null, { status: 204 });

  // Truncar UA pra evitar payloads gigantes
  const ua = (request.headers.get("user-agent") ?? "").slice(0, 300);

  // trackEvent é fire-and-forget no Supabase wrapper — nunca lança.
  await trackEvent({
    event_type: parsed.data.type,
    event_data: parsed.data.data ? (parsed.data.data as Record<string, unknown>) : null,
    session_id: parsed.data.sessionId ?? null,
    referrer: parsed.data.referrer ?? null,
    page_path: parsed.data.pagePath ?? null,
    user_agent: ua,
  });

  return new NextResponse(null, { status: 204 });
}
