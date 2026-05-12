"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { hasMarketingConsent } from "@/lib/tracking/consent";

/**
 * Carrega fbevents.js (o cliente real do Meta Pixel) afterInteractive.
 * window.fbq + queue + init + PageView já foram setupados pelo
 * MetaPixelStub no HTML estático server-rendered. Quando esse script
 * termina de carregar, fbevents.js processa a fila acumulada em ordem
 * (init → PageView → useEffect events).
 *
 * Consent gated via useState/useEffect:
 *   • Server e initial client render retornam null (consented = false).
 *   • useEffect lê DNT, atualiza consented.
 *   • Próximo render: monta Script.
 *
 * Sem hydration mismatch porque SSR e initial client render coincidem.
 *
 * DNT users: este componente nunca monta Script → fbevents.js nunca
 * carrega → fila do stub nunca é flushada → zero dados enviados ao Meta.
 */
export function MetaPixelLoader() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(hasMarketingConsent());
  }, []);

  if (!pixelId) return null;
  if (!consented) return null;

  return (
    <Script
      id="meta-pixel-fbevents"
      src="https://connect.facebook.net/en_US/fbevents.js"
      strategy="afterInteractive"
    />
  );
}
