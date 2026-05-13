/**
 * First-touch attribution persistida em localStorage.
 *
 * Por quê: UTMs chegavam em tracking_events mas se perdiam no fluxo
 * LP → /diagnosis → submit. Sem persistir no client, atribuição de
 * campanha/anúncio dependia de JOIN frágil em sessão.
 *
 * Política:
 *   • Captura SÓ quando URL tem `utm_*` (entrada paga). Visitas orgânicas
 *     não escrevem — evita "first-touch" travado em `/` quando o lead
 *     volta depois via anúncio.
 *   • First-touch: uma vez gravado, não sobrescreve. Anúncio que trouxe
 *     o lead pela primeira vez é o que conta.
 *   • TTL 30 dias: após isso, registro expira; nova entrada com UTMs
 *     começa atribuição do zero.
 *   • Fallback silencioso: localStorage bloqueado/privado → no-op,
 *     fluxo do diagnóstico continua sem UTMs.
 */

export const ATTRIBUTION_STORAGE_KEY = "levilael_attribution";
export const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

export type Attribution = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  landing_page: string;
  referrer: string | null;
  first_seen: string;
};

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

type UtmKey = (typeof UTM_KEYS)[number];

function hasUtmsInSearch(search: URLSearchParams): boolean {
  return UTM_KEYS.some((k) => search.has(k));
}

function extractUtms(search: URLSearchParams): Record<UtmKey, string | null> {
  const out = {} as Record<UtmKey, string | null>;
  for (const k of UTM_KEYS) {
    const v = search.get(k);
    out[k] = v && v.trim() ? v : null;
  }
  return out;
}

function safeGetItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // silent — quota cheia, modo privado, etc.
  }
}

function safeRemoveItem(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // silent
  }
}

function parseAttribution(raw: string): Attribution | null {
  try {
    const obj = JSON.parse(raw) as Partial<Attribution>;
    if (!obj || typeof obj !== "object") return null;
    if (typeof obj.first_seen !== "string") return null;
    if (typeof obj.landing_page !== "string") return null;
    return {
      utm_source: obj.utm_source ?? null,
      utm_medium: obj.utm_medium ?? null,
      utm_campaign: obj.utm_campaign ?? null,
      utm_content: obj.utm_content ?? null,
      utm_term: obj.utm_term ?? null,
      landing_page: obj.landing_page,
      referrer: obj.referrer ?? null,
      first_seen: obj.first_seen,
    };
  } catch {
    return null;
  }
}

function isExpired(record: Attribution, now: number): boolean {
  const seenAt = Date.parse(record.first_seen);
  if (Number.isNaN(seenAt)) return true;
  return now - seenAt > ATTRIBUTION_TTL_MS;
}

/**
 * Lê atribuição atual, descartando registro expirado.
 * Retorna null se ausente, expirado, inválido ou localStorage bloqueado.
 */
export function readAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;
  const raw = safeGetItem(ATTRIBUTION_STORAGE_KEY);
  if (!raw) return null;

  const record = parseAttribution(raw);
  if (!record) {
    safeRemoveItem(ATTRIBUTION_STORAGE_KEY);
    return null;
  }
  if (isExpired(record, Date.now())) {
    safeRemoveItem(ATTRIBUTION_STORAGE_KEY);
    return null;
  }
  return record;
}

/**
 * Captura atribuição se URL atual tem UTMs e ainda não há registro válido.
 *
 * Idempotente — pode ser chamado de múltiplos pontos (LpPageTracker,
 * DiagnosisForm.useEffect) sem efeitos colaterais.
 */
export function captureAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;

  const search = new URLSearchParams(window.location.search);
  const existing = readAttribution();

  // First-touch: já temos registro válido → não mexe.
  if (existing) return existing;

  // Sem UTMs e sem registro → nada a fazer. Não escreve orgânico.
  if (!hasUtmsInSearch(search)) return null;

  const utms = extractUtms(search);
  const record: Attribution = {
    ...utms,
    landing_page: window.location.pathname,
    referrer:
      typeof document !== "undefined" && document.referrer
        ? document.referrer
        : null,
    first_seen: new Date().toISOString(),
  };

  safeSetItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(record));
  return record;
}

/**
 * Limpa registro — útil em testes / debug. Não é chamado no fluxo normal.
 */
export function clearAttribution(): void {
  if (typeof window === "undefined") return;
  safeRemoveItem(ATTRIBUTION_STORAGE_KEY);
}
