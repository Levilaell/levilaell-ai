/**
 * SHA-256 helpers client-side pra advanced matching do Meta Pixel.
 *
 * Política: nunca hasha string vazia — hash de "" vira valor real que Meta
 * trata como dado válido e corrompe matching. Retorna undefined nesses casos
 * pra o caller poder omitir o campo.
 */

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashEmail(
  email: string | undefined | null,
): Promise<string | undefined> {
  const normalized = email?.toLowerCase().trim();
  if (!normalized) return undefined;
  return sha256Hex(normalized);
}

export async function hashPhone(
  phone: string | undefined | null,
): Promise<string | undefined> {
  // Meta exige E.164-ish: só dígitos, com código de país. Pra BR, se vier
  // sem o 55 prefixo (formato comum), prependa.
  const digitsOnly = phone?.replace(/\D/g, "") ?? "";
  if (!digitsOnly) return undefined;
  const withCountry =
    digitsOnly.length >= 11 && !digitsOnly.startsWith("55")
      ? `55${digitsOnly}`
      : digitsOnly;
  return sha256Hex(withCountry);
}

export async function hashName(
  name: string | undefined | null,
): Promise<string | undefined> {
  const normalized = name?.toLowerCase().trim();
  if (!normalized) return undefined;
  return sha256Hex(normalized);
}

/** Extrai primeiro token de um nome completo. "Levi Lael" → "levi". */
export function firstNameFrom(
  fullName: string | undefined | null,
): string | undefined {
  const trimmed = fullName?.trim();
  if (!trimmed) return undefined;
  const first = trimmed.split(/\s+/)[0];
  return first || undefined;
}
