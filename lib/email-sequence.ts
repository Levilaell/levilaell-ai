import type { EmailSequenceItem } from "@/lib/supabase";

const DAY_MS = 24 * 60 * 60 * 1000;

// Cadência: +2d, +5d, +8d, +12d, +20d (emails 2-6).
// Email 1 (relatório) é enviado inline no submit, não passa pelo cron.
export const SEQUENCE_OFFSETS_DAYS = [2, 5, 8, 12, 20] as const;

export function buildEmailSequenceItems(
  baseDate: Date = new Date(),
): EmailSequenceItem[] {
  return SEQUENCE_OFFSETS_DAYS.map((offset, idx) => ({
    email_number: idx + 2,
    scheduled_at: new Date(baseDate.getTime() + offset * DAY_MS).toISOString(),
  }));
}
