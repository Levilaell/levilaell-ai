import { Resend } from "resend";
import { siteConfig } from "@/lib/site";

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

let client: Resend | null = null;

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export type EmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
};

export async function sendEmail(payload: EmailPayload): Promise<{
  ok: boolean;
  id?: string;
  error?: string;
  stubbed?: boolean;
}> {
  const c = getClient();
  if (!c) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[resend:stub] RESEND_API_KEY ausente — e-mail não enviado.", {
        to: payload.to,
        subject: payload.subject,
      });
    }
    return { ok: true, stubbed: true };
  }

  try {
    const { data, error } = await c.emails.send({
      from: payload.from ?? siteConfig.email.from,
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: payload.replyTo,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro desconhecido.",
    };
  }
}
