/**
 * SHA-256 helpers server-side pra CAPI (Meta Conversions API).
 *
 * Mesma política do client (lib/tracking/hash.ts): nunca hasha string vazia.
 * Hash de "" vira valor real que corrompe matching no lado do Meta.
 */
import { createHash } from "node:crypto";

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function hashEmailServer(
  email: string | undefined | null,
): string | undefined {
  const normalized = email?.toLowerCase().trim();
  if (!normalized) return undefined;
  return sha256Hex(normalized);
}

export function hashPhoneServer(
  phone: string | undefined | null,
): string | undefined {
  const digitsOnly = phone?.replace(/\D/g, "") ?? "";
  if (!digitsOnly) return undefined;
  const withCountry =
    digitsOnly.length >= 11 && !digitsOnly.startsWith("55")
      ? `55${digitsOnly}`
      : digitsOnly;
  return sha256Hex(withCountry);
}

export function hashNameServer(
  name: string | undefined | null,
): string | undefined {
  const normalized = name?.toLowerCase().trim();
  if (!normalized) return undefined;
  return sha256Hex(normalized);
}

export function firstNameFromServer(
  fullName: string | undefined | null,
): string | undefined {
  const trimmed = fullName?.trim();
  if (!trimmed) return undefined;
  const first = trimmed.split(/\s+/)[0];
  return first || undefined;
}
