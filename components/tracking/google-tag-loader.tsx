"use client";

import Script from "next/script";
import { hasMarketingConsent } from "@/lib/tracking/consent";

/**
 * Carrega gtag.js (Google Tag) — base unificada pra Google Ads + GA4.
 * O loader só inicializa as configs; PageView é disparado pelo
 * PageViewTracker em cada route change (send_page_view: false aqui).
 *
 * Estratégia de URL:
 *   • Se GA4_ID existe, base script src usa GA4_ID (mais comum).
 *   • Senão, usa Google Ads ID.
 *   • Configs separadas pra cada produto que estiver definido.
 *
 * Guard: pula completamente se nenhuma das duas vars está setada ou se o
 * user não consentiu.
 */
export function GoogleTagLoader() {
  const gadsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  const ga4Id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

  if (!gadsId && !ga4Id) return null;
  if (!hasMarketingConsent()) return null;

  const primaryId = ga4Id || gadsId!;

  const configLines: string[] = [];
  if (ga4Id) {
    configLines.push(`gtag('config', '${ga4Id}', { send_page_view: false });`);
  }
  if (gadsId && gadsId !== ga4Id) {
    configLines.push(`gtag('config', '${gadsId}');`);
  }

  return (
    <>
      <Script
        id="gtag-base"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${primaryId}`}
      />
      <Script
        id="gtag-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
${configLines.join("\n")}
`,
        }}
      />
    </>
  );
}
