import { NextResponse } from "next/server";
import { contactSchema } from "@/types/forms";
import { getSupabaseService, isSupabaseConfigured } from "@/lib/supabase";
import { sendEmail, isResendConfigured } from "@/lib/resend";
import {
  contactConfirmationEmail,
  internalNotificationEmail,
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

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseService();
    if (supabase) {
      const { error } = await supabase.from("contacts").insert({
        name: data.name,
        email: data.email,
        company: data.company || null,
        subject: data.subject,
        message: data.message,
      });
      if (error) {
        console.error("[contact] supabase insert error:", error);
      }
    }
  }

  if (isResendConfigured()) {
    const userEmail = contactConfirmationEmail({ name: data.name });
    await sendEmail({
      to: data.email,
      subject: userEmail.subject,
      html: userEmail.html,
      text: userEmail.text,
    });

    const internal = internalNotificationEmail({
      kind: "contact",
      payload: {
        name: data.name,
        email: data.email,
        company: data.company ?? "",
        subject: data.subject,
        message: data.message,
      },
    });
    await sendEmail({
      to: siteConfig.email.internal,
      subject: internal.subject,
      html: internal.html,
      text: internal.text,
      replyTo: data.email,
    });
  } else {
    console.info("[contact] stubbed delivery", {
      from: data.email,
      subject: data.subject,
    });
  }

  return NextResponse.json({ ok: true });
}
