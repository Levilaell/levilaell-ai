import { NextResponse } from "next/server";
import { z } from "zod";
import { newsletterSchema } from "@/types/forms";
import { getSupabaseService, isSupabaseConfigured } from "@/lib/supabase";
import { sendEmail, isResendConfigured } from "@/lib/resend";
import {
  newsletterWelcomeEmail,
  internalNotificationEmail,
} from "@/lib/email-templates";
import { siteConfig } from "@/lib/site";

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
    const supabase = getSupabaseService();
    if (supabase) {
      const { error } = await supabase
        .from("subscribers")
        .upsert(
          {
            email: data.email,
            name: data.name,
            source: data.source ?? null,
          },
          { onConflict: "email" },
        );
      if (error) {
        console.error("[newsletter] supabase upsert error:", error);
      }
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

    const internal = internalNotificationEmail({
      kind: "newsletter",
      payload: {
        name: data.name,
        email: data.email,
        source: data.source ?? "unknown",
      },
    });
    await sendEmail({
      to: siteConfig.email.internal,
      subject: internal.subject,
      html: internal.html,
      text: internal.text,
    });
  } else {
    console.info("[newsletter] stubbed delivery", {
      to: data.email,
      source: data.source,
    });
  }

  return NextResponse.json({ ok: true });
}
