/**
 * Auth helper pra cron routes do Vercel.
 *
 * Vercel envia automaticamente o header `Authorization: Bearer {CRON_SECRET}`
 * pros endpoints listados em vercel.json:crons. Pra dev local, simulamos:
 *   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/...
 */
export function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") return false;
    // Dev sem secret: aceita request sem header (útil pra testar manualmente)
    return true;
  }

  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  // timing-safe comparison
  if (auth.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < auth.length; i++) {
    mismatch |= auth.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}
