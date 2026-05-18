/**
 * Tipos discriminados pra eventos de marketing. Espelham as ações que vão
 * pro Pixel, CAPI, gtag (Google Ads) e GA4. Tracking interno (lib/tracking.ts)
 * tem tipagem própria — esses tipos cobrem só o fluxo de plataformas externas.
 */

export type MarketingEvent =
  | { type: "page_view"; data: { url: string } }
  | { type: "lp_viewed"; data: { lp_slug: string; lp_category?: string } }
  | { type: "diagnosis_started"; data: Record<string, never> }
  | {
      type: "diagnosis_completed";
      data: {
        diagnosis_id: string;
        lead_score: number;
        email: string;
        phone?: string;
        first_name?: string;
      };
    }
  | {
      type: "calcom_clicked";
      data: {
        diagnosis_id?: string;
        email?: string;
        phone?: string;
      };
    }
  | {
      type: "scheduling_dialog_opened";
      data: {
        source: string | null;
        diagnosis_id: string | null;
      };
    }
  | {
      type: "scheduling_submitted";
      data: {
        source: string | null;
        urgency: "this_week" | "next_month" | "researching";
        diagnosis_id: string | null;
        has_site_url: boolean;
      };
    };

/**
 * Tier de lead derivado do score. Espelha decisões de valor monetário e
 * mapping pra Google Ads conversion actions.
 */
export type LeadTier = "hot" | "warm" | "cold";

export function leadTier(score: number): LeadTier {
  if (score >= 80) return "hot";
  if (score >= 60) return "warm";
  return "cold";
}

/**
 * Valores monetários (em BRL) anexados aos eventos. Servem pra Google Ads
 * estimar ROAS e pra Meta otimizar campanhas de valor.
 *
 * Heurística: hot lead vale 5x mais que warm/cold, schedule vale 2x hot.
 * Não são valores reais de pipeline — são proxies pra otimização.
 */
export const EVENT_VALUE_BRL = {
  lead: 100,
  hot_lead: 500,
  schedule: 1000,
} as const;
