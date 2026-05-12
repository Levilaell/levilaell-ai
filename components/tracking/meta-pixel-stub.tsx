/**
 * Stub server-rendered do Meta Pixel. Server Component (sem "use client")
 * pra HTML estático renderizado inline — executa no browser quando o body
 * é parseado, ANTES de qualquer useEffect React rodar.
 *
 * Por que separado do MetaPixelLoader:
 *   • Loader é client component ("use client") com gate de consent via
 *     useState/useEffect — necessário pra evitar hydration mismatch.
 *   • Next.js NÃO permite strategy="beforeInteractive" em client components.
 *   • Sem o stub server-rendered, window.fbq não existia quando os
 *     useEffects das LPs (ViewContent), diagnosis form (InitiateCheckout),
 *     etc. rodavam — eventos eram silentemente dropados.
 *
 * O stub aqui faz exatamente o que o snippet original Meta faz, MENOS o
 * inject do fbevents.js (esse vem do loader client gated em consent):
 *   • Define window.fbq como pusher pra fila local (n.queue).
 *   • Queueia 'init' + 'track', 'PageView' — esses ficam aguardando.
 *   • Quando o loader (gated) carregar fbevents.js, ele replay a fila
 *     em ordem: init → PageView → quaisquer eventos que useEffects
 *     enfiaram entre o parse do HTML e o load do fbevents.js.
 *
 * DNT users: stub roda (só define funções no window, zero rede) mas o
 * loader nunca carrega fbevents.js, então a fila nunca flusha. Eventos
 * morrem em memória ao fechar a aba.
 */
export function MetaPixelStub() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (!pixelId) return null;

  return (
    <script
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: `
!function(f,b,e,v,n){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[]}(window,document);
fbq('init','${pixelId}');
fbq('track','PageView');
`,
      }}
    />
  );
}
