import { createHmac, timingSafeEqual } from "node:crypto";
import { siteConfig } from "@/lib/site";

function getSecret(): string {
  const s = process.env.UNSUBSCRIBE_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "UNSUBSCRIBE_SECRET ausente — defina antes de enviar emails de sequência.",
      );
    }
    // Fallback determinístico só em dev — não usar em produção.
    return "dev-only-unsubscribe-secret";
  }
  return s;
}

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromB64url(s: string): Buffer {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64");
}

/** Token = base64url(diagnosisId).base64url(hmac_sha256(diagnosisId, secret)). */
export function signUnsubscribeToken(diagnosisId: string): string {
  const idB = Buffer.from(diagnosisId, "utf8");
  const sig = createHmac("sha256", getSecret()).update(idB).digest();
  return `${b64url(idB)}.${b64url(sig)}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  let idB: Buffer;
  let givenSig: Buffer;
  try {
    idB = fromB64url(parts[0]);
    givenSig = fromB64url(parts[1]);
  } catch {
    return null;
  }
  const expected = createHmac("sha256", getSecret()).update(idB).digest();
  if (expected.length !== givenSig.length) return null;
  if (!timingSafeEqual(expected, givenSig)) return null;
  const id = idB.toString("utf8");
  // UUID format quick check
  if (!/^[0-9a-f-]{32,40}$/i.test(id)) return null;
  return id;
}

/** URL pra humano (renderiza UI confirmando cancelamento). */
export function unsubscribeUrl(diagnosisId: string): string {
  const token = signUnsubscribeToken(diagnosisId);
  return `${siteConfig.url}/unsubscribe/${token}`;
}

/** URL pro bot do Gmail/Yahoo (POST one-click, RFC 8058). Não renderiza UI. */
export function unsubscribeApiUrl(diagnosisId: string): string {
  const token = signUnsubscribeToken(diagnosisId);
  return `${siteConfig.url}/api/unsubscribe/${token}`;
}
