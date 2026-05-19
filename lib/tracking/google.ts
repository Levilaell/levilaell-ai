/**
 * Wrapper client-side pro gtag.js (Google Ads + GA4).
 *
 * Política:
 *   • Conversion send_to labels lidas das envs no shape AW-XXX/yyy. Se vazio,
 *     a conversion específica é pulada (mas GA4 evento ainda dispara).
 *   • Enhanced Conversions: passamos `user_data.email_address` em texto puro;
 *     o gtag.js hasha client-side automaticamente antes de mandar pro Google.
 *   • Guard de consent + window.gtag.
 */
import { hasMarketingConsent } from "@/lib/tracking/consent";

type GtagArgs =
  | ["js", Date]
  | ["config", string, Record<string, unknown>?]
  | ["set", "user_data", Record<string, unknown>]
  | ["event", string, Record<string, unknown>?];

declare global {
  interface Window {
    gtag?: (...args: GtagArgs) => void;
    dataLayer?: unknown[];
  }
}

function canFire(): boolean {
  if (typeof window === "undefined") return false;
  if (!hasMarketingConsent()) return false;
  const hasAds = Boolean(process.env.NEXT_PUBLIC_GOOGLE_ADS_ID);
  const hasGa4 = Boolean(process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID);
  return hasAds || hasGa4;
}

function gtag(...args: GtagArgs): void {
  if (!canFire()) return;
  if (typeof window.gtag !== "function") return;
  window.gtag(...args);
}

function setUserData(email?: string): void {
  if (!email) return;
  gtag("set", "user_data", { email_address: email });
}

export const googleTracking = {
  pageView(url: string): void {
    const ga4Id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
    if (ga4Id) {
      gtag("event", "page_view", {
        page_location: url,
        send_to: ga4Id,
      });
    }
  },

  viewLandingPage(lp_slug: string): void {
    gtag("event", "view_landing_page", { lp_slug });
  },

  beginDiagnosis(): void {
    gtag("event", "begin_diagnosis");
  },

  generateLead(params: { value: number; email?: string }): void {
    setUserData(params.email);
    const sendTo = process.env.NEXT_PUBLIC_GADS_CONVERSION_LEAD;
    if (sendTo) {
      gtag("event", "conversion", {
        send_to: sendTo,
        value: params.value,
        currency: "BRL",
      });
    }
    gtag("event", "generate_lead", {
      value: params.value,
      currency: "BRL",
    });
  },

  generateHotLead(params: { value: number; email?: string }): void {
    setUserData(params.email);
    const sendTo = process.env.NEXT_PUBLIC_GADS_CONVERSION_HOT_LEAD;
    if (sendTo) {
      gtag("event", "conversion", {
        send_to: sendTo,
        value: params.value,
        currency: "BRL",
      });
    }
    gtag("event", "generate_lead", {
      value: params.value,
      currency: "BRL",
      lead_quality: "hot",
    });
  },

};
