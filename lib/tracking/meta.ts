/**
 * Wrapper client-side pro Meta Pixel. Tipa as 4 ações que disparamos
 * (PageView, ViewContent, Lead, Schedule) e garante que PII vai hashada.
 *
 * Política:
 *   • event_id quando fornecido → habilita deduplication com CAPI.
 *   • Guards: consent + presença de window.fbq. MetaPixelLoader usa
 *     strategy="beforeInteractive", então fbq existe antes do useEffect
 *     rodar. O guard de window.fbq aqui é defensivo — protege caso o
 *     script falhe (CSP, ad blocker, network) e mantém o silent-fail.
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

  /**
   * Schedule (agendamento de call). Dedup contra CAPI via event_id.
   * Funciona via beacon do fbevents.js — sobrevive navegação same-tab,
   * mas o SchedulingButton usa target="_blank" então beacon nunca está
   * em risco mesmo.
   */
  async schedule(params: {
    event_id: string;
    value: number;
    email?: string;
    phone?: string;
    fullName?: string;
  }): Promise<void> {
    if (!canFire()) return;
    const userData = await hashUserData({
      email: params.email,
      phone: params.phone,
      firstName: firstNameFrom(params.fullName),
    });
    fire(
      "Schedule",
      {
        value: params.value,
        currency: "BRL",
        ...userData,
      },
      params.event_id,
    );
  },
};
