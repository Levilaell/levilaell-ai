"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { hasMarketingConsent } from "@/lib/tracking/consent";

/**
 * Carrega o snippet base do Meta Pixel. Init + PageView inicial no próprio
 * snippet (padrão canônico Meta) pra não depender da ordem entre script
 * inject e useEffect do PageViewTracker — a PageView do hard load fica
 * garantida. PageViewTracker pula esse primeiro mount via useRef flag e
 * só dispara em route changes subsequentes.
 *
 * Consent: gated via useState/useEffect pra evitar hydration mismatch
 * (hasMarketingConsent retorna falso no SSR / true no client com DNT off).
 * Os wrappers metaPixel/googleTracking checam consent em cada call — o
 * gate aqui só decide carregar o script de jeito que SSR == initial client.
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
fbq('track', 'PageView');
`,
      }}
    />
  );
}
