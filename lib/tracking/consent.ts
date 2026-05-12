/**
 * Consent gate pra tracking de marketing (Pixel + gtag client-side).
 *
 * Hoje: stub que assume consent implícito (LGPD permite sob "interesse
 * legítimo" pra marketing direto B2B, com disclosure na privacy policy).
 * Respeita navigator.doNotTrack pra paridade com tracking interno
 * (lib/tracking.ts).
 *
 * Quando o cookie banner LGPD for adicionado, substituir isso por leitura
 * de cookie/localStorage. CAPI server-side não passa por aqui — é evento
 * de negócio iniciado pelo user, não rastreamento passivo.
 */

function isDoNotTrack(): boolean {
  if (typeof navigator === "undefined") return false;
  if (navigator.doNotTrack === "1") return true;
  type LegacyDNT = { msDoNotTrack?: string };
  const legacy = (navigator as unknown as LegacyDNT).msDoNotTrack;
  return legacy === "1";
}

export function hasMarketingConsent(): boolean {
  if (typeof window === "undefined") return false;
  if (isDoNotTrack()) return false;
  return true;
}
