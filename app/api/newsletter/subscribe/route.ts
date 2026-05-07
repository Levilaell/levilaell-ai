import { NextResponse } from "next/server";
import { z } from "zod";
import { newsletterSchema } from "@/types/forms";
import { saveSubscriber } from "@/lib/supabase";
import { sendEmail, isResendConfigured } from "@/lib/resend";
import { newsletterWelcomeEmail } from "@/lib/email-templates";

export const runtime = "nodejs";

const apiSchema = newsletterSchema.extend({
  source: z.string().max(60).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  const parsed = apiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.issues },
      { status: 422 },
    );
  }
  const data = parsed.data;

  await saveSubscriber({
    email: data.email,
    name: data.name,
    source: data.source ?? null,
  });

  if (isResendConfigured()) {
    const welcome = newsletterWelcomeEmail({ name: data.name });
    await sendEmail({
      to: data.email,
      subject: welcome.subject,
      html: welcome.html,
      text: welcome.text,
    });
  } else {
    console.info("[newsletter] resend off — não enviado", {
      to: data.email,
      source: data.source,
    });
  }

  return NextResponse.json({ ok: true });
}
