/**
 * Rate limit best-effort, in-memory por instância serverless. NÃO é garantia
 * global — só segura burst de abuso do mesmo IP nos endpoints que batem em
 * modelo pago (descoberta/*). Cada endpoint passa seu próprio escopo + teto.
 */
const buckets = new Map<string, Map<string, number[]>>();

export function rateLimited(
  scope: string,
  key: string,
  opts: { windowMs?: number; max?: number } = {},
): boolean {
  const { windowMs = 5 * 60_000, max = 40 } = opts;
  let bucket = buckets.get(scope);
  if (!bucket) {
    bucket = new Map();
    buckets.set(scope, bucket);
  }
  const now = Date.now();
  const hits = (bucket.get(key) ?? []).filter((t) => now - t < windowMs);
  hits.push(now);
  bucket.set(key, hits);
  return hits.length > max;
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || "unknown";
}
