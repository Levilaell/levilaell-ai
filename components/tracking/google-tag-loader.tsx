"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { hasMarketingConsent } from "@/lib/tracking/consent";

/**
 * Carrega gtag.js afterInteractive. window.gtag + window.dataLayer +
 * configs já foram setupados pelo GoogleTagStub no HTML estático
 * server-rendered. gtag.js processa o dataLayer acumulado em ordem:
 * 'js' → 'config' → eventos que useEffects pushed.
 *
 * Estratégia de URL: src usa GA4_ID se setado (mais comum), senão
 * Google Ads ID. Os dois compartilham o mesmo gtag.js — só muda o ID
 * primário no query string.
 *
 * Consent gated via useState/useEffect (mesma razão do MetaPixelLoader).
 * DNT users: nunca carrega gtag.js → dataLayer queue nunca processa.
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

  return (
    <Script
      id="gtag-base"
      src={`https://www.googletagmanager.com/gtag/js?id=${primaryId}`}
      strategy="afterInteractive"
    />
  );
}
