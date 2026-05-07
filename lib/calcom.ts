import { siteConfig } from "@/lib/site";

const FALLBACK_SUBJECT = "Conversa com Levi Lael";

export type SchedulingTarget = {
  href: string;
  isMailto: boolean;
};

export function getCalcomUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_CALCOM_URL?.trim();
  if (!url) return null;
  return url;
}

export function getSchedulingTarget(
  subject: string = FALLBACK_SUBJECT,
): SchedulingTarget {
  const calcom = getCalcomUrl();
  if (calcom) return { href: calcom, isMailto: false };
  const params = new URLSearchParams({ subject });
  return {
    href: `mailto:${siteConfig.email.contact}?${params.toString()}`,
    isMailto: true,
  };
}
