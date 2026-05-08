/**
 * Admin auth — HMAC signed session cookie via Web Crypto.
 *
 * Funciona em qualquer runtime (Node, Edge, middleware) sem `node:crypto`.
 * Padrão: cookie `levilael_admin_session` com formato
 * `<base64url(issuedAtMs)>.<base64url(hmac_sha256)>` e validade de 30 dias.
 *
 * Em produção, ADMIN_SESSION_SECRET é obrigatório. Em dev, fallback fixo só
 * pra evitar travar o setup local.
 */

export const ADMIN_SESSION_COOKIE = "levilael_admin_session";
export const ADMIN_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const ADMIN_SESSION_TTL_SECONDS = ADMIN_SESSION_TTL_MS / 1000;

function getSessionSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ADMIN_SESSION_SECRET ausente — gere com `openssl rand -hex 32` e seta no Vercel.",
    );
  }
  return "dev-only-admin-session-secret";
}

function getAdminPassword(): string | null {
  return process.env.ADMIN_PASSWORD ?? null;
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

// ---------------------------------------------------------------------------
// Web Crypto helpers — todos os buffers transitam como ArrayBuffer pra evitar
// incompatibilidade Uint8Array<ArrayBufferLike> em lib.dom mais nova.
// ---------------------------------------------------------------------------
async function importHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    toArrayBuffer(enc.encode(secret)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function hmacSign(secret: string, data: string): Promise<ArrayBuffer> {
  const key = await importHmacKey(secret);
  return crypto.subtle.sign(
    "HMAC",
    key,
    toArrayBuffer(new TextEncoder().encode(data)),
  );
}

async function hmacVerify(
  secret: string,
  data: string,
  signature: ArrayBuffer,
): Promise<boolean> {
  const key = await importHmacKey(secret);
  return crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    toArrayBuffer(new TextEncoder().encode(data)),
  );
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(out).set(bytes);
  return out;
}

function bufferToB64url(buf: ArrayBuffer): string {
  const arr = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function strToB64url(s: string): string {
  return bufferToB64url(toArrayBuffer(new TextEncoder().encode(s)));
}

function b64urlToBuffer(s: string): ArrayBuffer {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const bin = atob(padded + pad);
  const buf = new ArrayBuffer(bin.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
  return buf;
}

function b64urlToStr(s: string): string {
  return new TextDecoder().decode(b64urlToBuffer(s));
}

function constantTimeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// ---------------------------------------------------------------------------
// Public API — sign / verify / validate password
// ---------------------------------------------------------------------------
export async function signAdminSession(now: number = Date.now()): Promise<string> {
  const payload = String(now);
  const sig = await hmacSign(getSessionSecret(), payload);
  return `${strToB64url(payload)}.${bufferToB64url(sig)}`;
}

export type SessionVerification =
  | { valid: true; issuedAt: number }
  | { valid: false; reason: "malformed" | "bad_signature" | "expired" };

export async function verifyAdminSession(
  token: string,
): Promise<SessionVerification> {
  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false, reason: "malformed" };

  let payload: string;
  let sig: ArrayBuffer;
  try {
    payload = b64urlToStr(parts[0]);
    sig = b64urlToBuffer(parts[1]);
  } catch {
    return { valid: false, reason: "malformed" };
  }

  const issuedAt = Number(payload);
  if (!Number.isFinite(issuedAt) || issuedAt <= 0) {
    return { valid: false, reason: "malformed" };
  }

  const ok = await hmacVerify(getSessionSecret(), payload, sig);
  if (!ok) return { valid: false, reason: "bad_signature" };

  if (Date.now() - issuedAt > ADMIN_SESSION_TTL_MS) {
    return { valid: false, reason: "expired" };
  }

  return { valid: true, issuedAt };
}

export async function validateAdminPassword(input: string): Promise<boolean> {
  const expected = getAdminPassword();
  if (!expected) return false;
  return constantTimeEqualStr(input, expected);
}

// ---------------------------------------------------------------------------
// Server-side guard — uso em route handlers e server components
// ---------------------------------------------------------------------------
export async function isAdminAuthorized(request: Request): Promise<boolean> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = readCookie(cookieHeader, ADMIN_SESSION_COOKIE);
  if (!token) return false;
  const result = await verifyAdminSession(token);
  return result.valid;
}

function readCookie(header: string, name: string): string | null {
  if (!header) return null;
  const target = `${name}=`;
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(target)) {
      return decodeURIComponent(trimmed.slice(target.length));
    }
  }
  return null;
}
