/**
 * CAPI Schedule espelho do Pixel client-side. SchedulingButton posta aqui
 * via sendBeacon imediatamente antes de abrir o Cal.com em nova aba.
 *
 * Dedup com Pixel: event_id é gerado client-side (= diagnosisId quando
 * presente, senão UUID) e enviado pra cá. Meta deduplica pelo par
 * (event_id, event_name=Schedule).
 *
 * Body:
 *   { event_id: string; diagnosis_id?: uuid }
 *
 * Quando diagnosis_id presente, busca email/phone/nome na linha pra
 * advanced matching mais rico (em/ph/fn hashados). Senão, manda só com
 * IP/UA/fbc/fbp do request.
 *
 * NOTA: /r/calcom/[id] continua existindo separado — cancela email
 * sequence + faz 302 pro Cal.com. Esses dois endpoints são complementares,
 * não concorrentes.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
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
import { getDiagnosisById } from "@/lib/supabase";
import { siteConfig } from "@/lib/site";
import { EVENT_VALUE_BRL } from "@/lib/tracking/types";

const schema = z.object({
  event_id: z.string().min(1).max(120),
  diagnosis_id: z.uuid().optional(),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return new NextResponse(null, { status: 204 });

  const { event_id, diagnosis_id } = parsed.data;

  let email: string | undefined;
  let whatsapp: string | undefined;
  let name: string | undefined;

  if (diagnosis_id) {
    const diag = await getDiagnosisById(diagnosis_id);
    if (diag) {
      email = diag.email;
      whatsapp = diag.whatsapp ?? undefined;
      name = diag.name;
    }
  }

  await sendCapiEvent({
    event_name: "Schedule",
    event_id,
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: request.headers.get("referer") ?? siteConfig.url,
    user_data: {
      em: hashEmailServer(email),
      ph: hashPhoneServer(whatsapp),
      fn: hashNameServer(firstNameFromServer(name)),
      client_ip_address: extractClientIp(request.headers),
      client_user_agent: request.headers.get("user-agent") ?? undefined,
      ...parseFbCookies(request.headers.get("cookie")),
    },
    custom_data: {
      value: EVENT_VALUE_BRL.schedule,
      currency: "BRL",
    },
  });

  return new NextResponse(null, { status: 204 });
}
