import { NextResponse } from "next/server";
import { z } from "zod";
import { newsletterSchema } from "@/types/forms";
import { isSupabaseConfigured, saveSubscriber } from "@/lib/supabase";
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

  if (isSupabaseConfigured()) {
    try {
      await saveSubscriber({
        email: data.email,
        name: data.name,
        source: data.source ?? null,
      });
    } catch (err) {
      console.error(
        "[DB_ERROR] newsletter subscribe failed",
        err instanceof Error ? err.message : err,
      );
      return NextResponse.json(
        {
          error:
            "Não consegui registrar sua inscrição agora. Tenta de novo em alguns segundos.",
        },
        { status: 503 },
      );
    }
  }

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
