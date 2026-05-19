/**
 * Wrapper client-side pro Meta Pixel. Tipa as ações que disparamos
 * (PageView, ViewContent, InitiateCheckout, Lead) e garante que PII vai hashada.
 *
 * Política:
 *   • event_id quando fornecido → habilita deduplication com CAPI.
 *   • Guards: consent + presença de window.fbq. MetaPixelStub
 *     (Server Component inline no body) define window.fbq como pusher
 *     synchronously durante parse do HTML, antes da hidratação React.
 *     useEffect calls a este wrapper encontram fbq pronto, push pra
 *     fila local que vai ser replayed quando fbevents.js carregar
 *     (via MetaPixelLoader, gated em consent).
 *   • Guard de window.fbq aqui é defensivo — protege caso o stub falhe
 *     (CSP, render error) e mantém o silent-fail.
 *   • Não throws — silent fail. Tracking interno cobre dashboard próprio.
 */
import { hasMarketingConsent } from "@/lib/tracking/consent";
import { hashEmail, hashPhone, hashName, firstNameFrom } from "@/lib/tracking/hash";

type FbqCommand =
  | ["init", string, Record<string, string>?]
  | ["track", string, Record<string, unknown>?, { eventID?: string }?]
  | ["trackCustom", string, Record<string, unknown>?, { eventID?: string }?];

type Fbq = {
  (...args: FbqCommand): void;
  queue?: unknown[];
  loaded?: boolean;
};

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

function canFire(): boolean {
  if (typeof window === "undefined") return false;
  if (!hasMarketingConsent()) return false;
  if (!process.env.NEXT_PUBLIC_META_PIXEL_ID) return false;
  return true;
}

function fire(
  eventName: string,
  params?: Record<string, unknown>,
  eventId?: string,
): void {
  if (!canFire()) return;
  const fbq = window.fbq;
  if (!fbq) return;
  if (eventId) {
    fbq("track", eventName, params, { eventID: eventId });
  } else {
    fbq("track", eventName, params);
  }
}

async function hashUserData(input: {
  email?: string;
  phone?: string;
  firstName?: string;
}): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const em = await hashEmail(input.email);
  if (em) out.em = em;
  const ph = await hashPhone(input.phone);
  if (ph) out.ph = ph;
  const fn = await hashName(input.firstName);
  if (fn) out.fn = fn;
  return out;
}

/**
 * Wrapper público — chame essas funções diretamente nos componentes.
 */
export const metaPixel = {
  pageView(): void {
    fire("PageView");
  },

  viewContent(params: {
    content_name: string;
    content_category?: string;
  }): void {
    fire("ViewContent", params);
  },

  initiateCheckout(): void {
    fire("InitiateCheckout");
  },

  /**
   * Lead com advanced matching + dedup contra CAPI via event_id.
   * @param params.value valor em BRL (heurística — 100 warm/cold, 500 hot)
   * @param params.event_id mesmo id usado no CAPI Lead (= diagnosis_id)
   */
  async lead(params: {
    event_id: string;
    value: number;
    email?: string;
    phone?: string;
    fullName?: string;
    leadQuality?: "hot" | "warm" | "cold";
  }): Promise<void> {
    if (!canFire()) return;
    const userData = await hashUserData({
      email: params.email,
      phone: params.phone,
      firstName: firstNameFrom(params.fullName),
    });
    fire(
      "Lead",
      {
        value: params.value,
        currency: "BRL",
        lead_quality: params.leadQuality,
        ...userData,
      },
      params.event_id,
    );
  },
};
