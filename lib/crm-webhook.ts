/**
 * Cliente do webhook do CRM Levi Lael.
 *
 * Site → CRM: dois eventos distintos.
 *
 *  - notifyCrmLeadFromForm(): chamado quando o formulário "Vamos conversar"
 *    é submetido (este é o gatilho oficial de lead — CRM cria registro +
 *    dispara Telegram).
 *
 *  - notifyCrmDiagnosisCompleted(): chamado quando o diagnóstico é
 *    completado (CRM só armazena snapshot pra matching futuro; NÃO cria
 *    lead, NÃO dispara Telegram).
 *
 * Ambas falham em silêncio (loga e segue). Falha do CRM não bloqueia
 * a resposta pro usuário do site.
 */

const CRM_URL = process.env.CRM_URL ?? "https://crm-levilael.vercel.app";

function getSecret(): string | null {
  const s = process.env.CRM_WEBHOOK_SECRET;
  if (!s) {
    console.warn("[crm] CRM_WEBHOOK_SECRET not set — skipping");
    return null;
  }
  return s;
}

interface LeadFromFormInput {
  source: "whatsapp_form" | "calcom";
  name: string;
  email?: string | null;
  phone: string;
  company_name?: string | null;
  message?: string | null;
  calcom_event_uri?: string | null;
}

export interface CrmLeadResult {
  id: string;
  telegram_sent: boolean;
  matched_diagnosis: boolean;
  duplicate: boolean;
}

export async function notifyCrmLeadFromForm(
  input: LeadFromFormInput,
): Promise<CrmLeadResult | null> {
  const secret = getSecret();
  if (!secret) return null;
  try {
    const res = await fetch(`${CRM_URL}/api/webhooks/lead-from-site`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-webhook-secret": secret,
      },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        "[crm] lead webhook non-ok",
        res.status,
        body.slice(0, 200),
      );
      return null;
    }
    return (await res.json()) as CrmLeadResult;
  } catch (err) {
    console.error(
      "[crm] lead webhook error",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

interface DiagnosisCompletedInput {
  source_diagnosis_id: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  score: number;
  answers: Record<string, unknown>;
  ai_analysis?: Record<string, unknown> | null;
  completed_at: string;
}

export interface CrmDiagnosisResult {
  id: string;
  status: "stored";
  duplicate: boolean;
}

export async function notifyCrmDiagnosisCompleted(
  input: DiagnosisCompletedInput,
): Promise<CrmDiagnosisResult | null> {
  const secret = getSecret();
  if (!secret) return null;
  try {
    const res = await fetch(`${CRM_URL}/api/webhooks/diagnosis-completed`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-webhook-secret": secret,
      },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        "[crm] diagnosis webhook non-ok",
        res.status,
        body.slice(0, 200),
      );
      return null;
    }
    return (await res.json()) as CrmDiagnosisResult;
  } catch (err) {
    console.error(
      "[crm] diagnosis webhook error",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}
