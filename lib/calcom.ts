import { siteConfig } from "@/lib/site";

const FALLBACK_SUBJECT = "Quero agendar uma call";

export type SchedulingTarget = {
  href: string;
  isMailto: boolean;
};

export function getSchedulingTarget(subject: string = FALLBACK_SUBJECT): SchedulingTarget {
  const calcom = process.env.NEXT_PUBLIC_CALCOM_URL?.trim();
  if (calcom && calcom.length > 0) {
    return { href: calcom, isMailto: false };
  }

  const params = new URLSearchParams({ subject });
  return {
    href: `mailto:${siteConfig.email.contact}?${params.toString()}`,
    isMailto: true,
  };
}
