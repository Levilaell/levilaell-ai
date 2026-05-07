import { NextResponse } from "next/server";
import { contactSchema } from "@/types/forms";
import { saveContact } from "@/lib/supabase";
import { sendEmail, isResendConfigured } from "@/lib/resend";
import {
  contactConfirmationEmail,
  internalContactEmail,
} from "@/lib/email-templates";
import { siteConfig } from "@/lib/site";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.issues },
      { status: 422 },
    );
  }
  const data = parsed.data;

  await saveContact({
    name: data.name,
    email: data.email,
    company: data.company || null,
    service_interest: data.service_interest || null,
    subject: data.subject,
    message: data.message,
  });

  if (isResendConfigured()) {
    const userEmail = contactConfirmationEmail({ name: data.name });
    await sendEmail({
      to: data.email,
      subject: userEmail.subject,
      html: userEmail.html,
      text: userEmail.text,
    });

    const internal = internalContactEmail({
      name: data.name,
      email: data.email,
      company: data.company || null,
      subject: data.subject,
      serviceInterest: data.service_interest || null,
      message: data.message,
    });
    await sendEmail({
      to: siteConfig.email.internal,
      subject: internal.subject,
      html: internal.html,
      text: internal.text,
      replyTo: data.email,
    });
  } else {
    console.info("[contact] resend off — não enviado", {
      from: data.email,
      subject: data.subject,
    });
  }

  return NextResponse.json({ ok: true });
}
