/**
 * Meta Conversions API (CAPI) — server-side espelho do Pixel pra eventos
 * críticos. Reduz perda por iOS/Safari ITP, ad blockers, e dá ao Meta
 * dados de match mais ricos (IP, UA, cookies fbc/fbp).
 *
 * Política:
 *   • Fire-and-forget com timeout 500ms via Promise.race. Falha do CAPI
 *     NUNCA bloqueia/quebra a response do user.
 *   • action_source: 'website' é obrigatório no v17+ — sem isso, Meta
 *     rejeita o evento.
 *   • event_source_url vem do Referer (URL real onde o user estava),
 *     não da URL do API route.
 *   • PII chega já hashado pelo caller (lib/server/hash.ts).
 *   • Dedup com Pixel via event_id idêntico no par (event_id, event_name).
 */

const GRAPH_VERSION = "v20.0";
const TIMEOUT_MS = 500;

export type CapiEventName = "Lead" | "Schedule" | "PageView";

export type CapiUserData = {
  /** SHA-256 do email lowercased+trimmed */
  em?: string;
  /** SHA-256 do phone só dígitos com DDI (BR: 55...) */
  ph?: string;
  /** SHA-256 do primeiro nome lowercased+trimmed */
  fn?: string;
  /** IPv4 ou IPv6 do client (request headers) */
  client_ip_address?: string;
  client_user_agent?: string;
  /** Facebook Click ID cookie — formato fb.subdomainIndex.creationTime.fbclid */
  fbc?: string;
  /** Facebook Browser ID cookie — formato fb.subdomainIndex.creationTime.randomNumber */
  fbp?: string;
};

export type CapiCustomData = {
  value?: number;
  currency?: string;
  content_name?: string;
  lead_quality?: "hot" | "warm" | "cold";
};

export type CapiEvent = {
  event_name: CapiEventName;
  event_id: string;
  event_time: number;
  event_source_url: string;
  user_data: CapiUserData;
  custom_data?: CapiCustomData;
};

/**
 * Lê fbc/fbp de uma string de cookies (request.headers.get("cookie")).
 * Retorna undefined se ausentes.
 */
export function parseFbCookies(cookieHeader: string | null): {
  fbc?: string;
  fbp?: string;
} {
  if (!cookieHeader) return {};
  const out: { fbc?: string; fbp?: string } = {};
  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rest] = part.split("=");
    if (!rawKey) continue;
    const key = rawKey.trim();
    const value = rest.join("=").trim();
    if (key === "_fbc") out.fbc = value;
    else if (key === "_fbp") out.fbp = value;
  }
  return out;
}

/** Extrai client IP de request headers (x-forwarded-for tem prioridade). */
export function extractClientIp(headers: Headers): string | undefined {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return undefined;
}

/**
 * Envia 1 evento pro Meta CAPI. Fire-and-forget — chame sem await pra não
 * bloquear, ou await com confiança que timeout 500ms limita o pior caso.
 */
export async function sendCapiEvent(event: CapiEvent): Promise<void> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  const testCode = process.env.META_CAPI_TEST_EVENT_CODE;

  if (!pixelId || !token) {
    // CAPI off — log uma vez seria barulhento, então silent.
    return;
  }

  const body: Record<string, unknown> = {
    data: [
      {
        ...event,
        action_source: "website",
      },
    ],
    access_token: token,
  };
  if (testCode) {
    body.test_event_code = testCode;
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[CAPI] non-2xx response", {
        status: res.status,
        event_name: event.event_name,
        event_id: event.event_id,
        body: text.slice(0, 500),
      });
      return;
    }
    console.info("[CAPI] event sent", {
      event_name: event.event_name,
      event_id: event.event_id,
    });
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    console.error("[CAPI] dispatch failed", {
      event_name: event.event_name,
      event_id: event.event_id,
      reason: isAbort ? "timeout" : err instanceof Error ? err.message : err,
    });
  } finally {
    clearTimeout(timeout);
  }
}
