/**
 * Renderiza e envia um e-mail da sequência de follow-up (números 2-6).
 *
 * Email 2: gerado via Claude (`generateFollowUpEmail2`).
 * Emails 3-6: templates fixos (`followUpFixedTemplate`).
 *
 * Após enviar via Resend, atualiza email_sequences:
 *   - status = 'sent', sent_at = now
 *   - body_html / body_subject cacheados (pra reusar em re-tentativas)
 *
 * Em erro: status = 'failed', error_message preenchido. NÃO joga exceção pra
 * cima — o cron precisa continuar a iteração mesmo se 1 row falhar.
 */
import { getSupabaseService } from "@/lib/supabase";
import { sendEmail } from "@/lib/resend";
import { generateFollowUpEmail2 } from "@/lib/email-followup-ai";
import {
  followUpFixedTemplate,
  type FollowUpContext,
} from "@/lib/email-followup-templates";
import {
  getCalcomRedirectUrl,
  getCalcomUrl,
} from "@/lib/calcom";
import { unsubscribeApiUrl, unsubscribeUrl } from "@/lib/unsubscribe";
import type { DiagnosisAnalysis } from "@/types/diagnosis";

export type SequenceRow = {
  id: string;
  diagnosis_id: string;
  email_number: number;
  body_html: string | null;
  body_subject: string | null;
};

// V2 + Legacy: registros antigos podem ter q2_erp/q3_client_profile = NULL.
// O prompt do email 2 cai num fallback "(não informado)" nesses casos.
export type DiagnosisCtx = {
  id: string;
  name: string;
  email: string;
  ai_analysis: DiagnosisAnalysis | null;
  q1_size: string;
  q2_erp: string | null;
  q3_client_profile: string | null;
};

export type RunnerResult =
  | { ok: true; cached: boolean; messageId?: string }
  | { ok: false; error: string };

export async function runFollowUpEmail(
  row: SequenceRow,
  diag: DiagnosisCtx,
): Promise<RunnerResult> {
  const supabase = getSupabaseService();
  if (!supabase) return { ok: false, error: "Supabase service não configurado." };

  const calcomBase = getCalcomUrl();
  if (!calcomBase) {
    // Sem Cal.com configurado, não rodamos — não vamos mandar lead pra mailto
    // numa sequência de nurturing.
    return { ok: false, error: "NEXT_PUBLIC_CALCOM_URL não configurado." };
  }
  // Usamos redirector interno que cancela a sequence ao clicar.
  const calcomUrl = getCalcomRedirectUrl(diag.id);
  const unsubUrl = unsubscribeUrl(diag.id);
  const unsubApi = unsubscribeApiUrl(diag.id);

  // Renderização: prefere cache se existe.
  let subject: string;
  let html: string;
  let text: string;
  let cached = true;

  if (row.body_html && row.body_subject) {
    subject = row.body_subject;
    html = row.body_html;
    // Sem text cacheado — geramos um stripped version do html.
    text = htmlToText(row.body_html);
  } else {
    cached = false;
    const op1 = diag.ai_analysis?.tres_oportunidades?.[0];

    if (row.email_number === 2) {
      if (!op1) {
        return {
          ok: false,
          error: "Diagnóstico sem ai_analysis — não pode gerar e-mail 2.",
        };
      }
      const ai = await generateFollowUpEmail2({
        diagnosisId: diag.id,
        name: diag.name,
        q1_size: diag.q1_size,
        q2_erp: diag.q2_erp ?? "",
        q3_client_profile: diag.q3_client_profile ?? "",
        opportunity1: op1,
        calcomUrl,
        unsubscribeUrl: unsubUrl,
      });
      subject = ai.subject;
      html = ai.html;
      text = ai.text;
    } else {
      const ctx: FollowUpContext = {
        diagnosisId: diag.id,
        name: diag.name,
        opportunityTitle: op1?.titulo ?? "sua principal oportunidade",
        calcomUrl,
        unsubscribeUrl: unsubUrl,
      };
      const t = followUpFixedTemplate(row.email_number, ctx);
      if (!t) {
        return {
          ok: false,
          error: `Template indisponível pro email #${row.email_number}.`,
        };
      }
      subject = t.subject;
      html = t.html;
      text = t.text;
    }

    // Cacheia antes de enviar — evita re-gerar em re-tentativas.
    const { error: cacheErr } = await supabase
      .from("email_sequences")
      .update({ body_subject: subject, body_html: html })
      .eq("id", row.id);
    if (cacheErr) {
      console.error("[DB_ERROR] cache write failed", {
        seq_id: row.id,
        message: cacheErr.message,
      });
      // Não é fatal: seguimos pra send.
    }
  }

  const sendResult = await sendEmail({
    to: diag.email,
    subject,
    html,
    text,
    headers: {
      // RFC 8058: header aponta pra endpoint que aceita POST one-click.
      // Mailto fica como segundo recurso pra clientes que não suportam HTTP.
      "List-Unsubscribe": `<${unsubApi}>, <mailto:${process.env.RESEND_FROM_EMAIL?.match(/<([^>]+)>/)?.[1] ?? "hello@levilael.com.br"}?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });

  if (!sendResult.ok) {
    return { ok: false, error: sendResult.error ?? "Send falhou." };
  }

  // Marca como sent
  const { error: updateErr } = await supabase
    .from("email_sequences")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", row.id);
  if (updateErr) {
    console.error("[DB_ERROR] mark sent failed", {
      seq_id: row.id,
      message: updateErr.message,
    });
    // Não retorna erro porque o e-mail FOI enviado — só ficou sem update.
  }

  return { ok: true, cached, messageId: sendResult.id };
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
