"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { hasMarketingConsent } from "@/lib/tracking/consent";

/**
 * Carrega gtag.js (base unificada Google Ads + GA4). GA4 dispara
 * page_view automático no config (não passamos send_page_view: false) —
 * isso garante a PageView do hard load independente de timing do
 * PageViewTracker. Tracker pula o primeiro mount via useRef e só dispara
 * page_view em route changes subsequentes.
 *
 * Strategy beforeInteractive (mesmo motivo do MetaPixelLoader): garante
 * que window.gtag exista antes do useEffect dos componentes rodar. Sem
 * isso, eventos first-mount como viewLandingPage e beginDiagnosis caem
 * num race onde gtag é undefined e o wrapper droppa silentemente.
 *
 * Consent gated via useState/useEffect pra evitar hydration mismatch
 * (mesma razão do MetaPixelLoader).
 */
export function GoogleTagLoader() {
  const gadsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  const ga4Id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(hasMarketingConsent());
  }, []);

  if (!gadsId && !ga4Id) return null;
  if (!consented) return null;

  const primaryId = ga4Id || gadsId!;

  const configLines: string[] = [];
  if (ga4Id) {
    configLines.push(`gtag('config', '${ga4Id}');`);
  }
  if (gadsId && gadsId !== ga4Id) {
    configLines.push(`gtag('config', '${gadsId}');`);
  }

  return (
    <>
      <Script
        id="gtag-base"
        strategy="beforeInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${primaryId}`}
      />
      <Script
        id="gtag-config"
        strategy="beforeInteractive"
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
