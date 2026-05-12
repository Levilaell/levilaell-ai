/**
 * Stub server-rendered do Google Tag (Ads + GA4). Server Component que
 * inline-render script no HTML estático — executa antes da hidratação,
 * garantindo que window.gtag + window.dataLayer existam pra useEffects
 * subsequentes (mesma razão do MetaPixelStub).
 *
 * O stub:
 *   • Define window.dataLayer como array.
 *   • Define função gtag global como pusher pra dataLayer.
 *   • Queueia gtag('js', new Date()) e gtag('config', ID) pra cada
 *     ID definido.
 *
 * Quando o loader client gated carregar gtag.js, ele processa o
 * dataLayer existente em ordem: 'js' → 'config' → quaisquer eventos
 * que useEffects (viewLandingPage, beginDiagnosis etc) enfiaram.
 *
 * Nota: gtag('config', GA4_ID) auto-dispara o initial page_view do GA4.
 * PageViewTracker pula o primeiro mount via useRef, evitando duplicação
 * em route changes subsequentes.
 */
export function GoogleTagStub() {
  const ga4Id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  const gadsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  if (!ga4Id && !gadsId) return null;

  const configs: string[] = [];
  if (ga4Id) configs.push(`gtag('config','${ga4Id}');`);
  if (gadsId && gadsId !== ga4Id) configs.push(`gtag('config','${gadsId}');`);

  return (
    <script
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: `
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());
${configs.join("\n")}
`,
      }}
    />
  );
}
