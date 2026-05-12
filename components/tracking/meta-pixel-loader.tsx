"use client";

import Script from "next/script";
import { hasMarketingConsent } from "@/lib/tracking/consent";

/**
 * Carrega o snippet base do Meta Pixel. SÓ inicializa o pixel — não dispara
 * PageView aqui. O PageViewTracker dispara TODAS as PageViews (inicial +
 * subsequentes) pra ficar consistente com o tracking interno e evitar
 * duplicação no primeiro load.
 *
 * Renderizado uma vez no root layout. Guard: pula completamente se a env
 * var não existe ou se o user não consentiu (LGPD/DNT).
 */
export function MetaPixelLoader() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (!pixelId) return null;
  if (!hasMarketingConsent()) return null;

  return (
    <Script
      id="meta-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
`,
      }}
    />
  );
}
