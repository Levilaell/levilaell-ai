/**
 * UTM preservation helpers para landing pages de tráfego pago.
 *
 * Garante que UTMs e click IDs (gclid, fbclid, msclkid) chegam até /diagnosis,
 * preservando atribuição mesmo após o usuário pular pelo funil.
 */

const UTM_WHITELIST = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "gclid",
  "fbclid",
  "msclkid",
  "keyword",
  "k",
  "ref",
] as const;

type SearchInput = string | URLSearchParams | null | undefined;

function toSearchParams(input: SearchInput): URLSearchParams {
  if (!input) return new URLSearchParams();
  if (input instanceof URLSearchParams) return new URLSearchParams(input);
  return new URLSearchParams(input.startsWith("?") ? input.slice(1) : input);
}

/**
 * Monta `/diagnosis?...` preservando UTMs/click IDs e adicionando `from_lp`.
 *
 * @param fromLp slug da LP de origem (ex: "document-classification")
 * @param currentSearch search params atuais (window.location.search ou similar)
 */
export function buildDiagnosisUrl(
  fromLp: string,
  currentSearch?: SearchInput,
): string {
  const incoming = toSearchParams(currentSearch);
  const out = new URLSearchParams();

  for (const key of UTM_WHITELIST) {
    const value = incoming.get(key);
    if (value) out.set(key, value);
  }
  out.set("from_lp", fromLp);

  const qs = out.toString();
  return qs ? `/diagnosis?${qs}` : "/diagnosis";
}

/**
 * Extrai apenas params de tracking pra logging (não inclui from_lp).
 * Útil pra anexar nos eventos.
 */
export function extractTrackingParams(
  currentSearch?: SearchInput,
): Record<string, string> {
  const incoming = toSearchParams(currentSearch);
  const result: Record<string, string> = {};
  for (const key of UTM_WHITELIST) {
    const value = incoming.get(key);
    if (value) result[key] = value;
  }
  return result;
}
