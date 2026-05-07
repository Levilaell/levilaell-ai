/**
 * One-Click Unsubscribe — RFC 8058.
 *
 * O header `List-Unsubscribe-Post: List-Unsubscribe=One-Click` promete pro
 * Gmail/Yahoo/Outlook que essa URL aceita POST sem confirmação UI. Os bots
 * de inbox usam isso pra processar unsubscribe sem sair do client.
 *
 * Também aceita GET pra compatibilidade (alguns clientes legacy mandam GET
 * direto neste endpoint), mas o caminho UI completo é `/unsubscribe/[token]`.
 */
import { NextResponse } from "next/server";
import {
  cancelEmailSequence,
  getSupabaseService,
  isSupabaseConfigured,
} from "@/lib/supabase";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

type Params = { params: Promise<{ token: string }> };

export const runtime = "nodejs";

async function processToken(token: string): Promise<{ ok: boolean; reason?: string }> {
  const diagnosisId = verifyUnsubscribeToken(token);
  if (!diagnosisId) return { ok: false, reason: "invalid_token" };
  if (!isSupabaseConfigured()) return { ok: true };

  try {
    await cancelEmailSequence(diagnosisId);
  } catch (err) {
    console.error(
      "[unsubscribe-api] cancel failed",
      err instanceof Error ? err.message : err,
    );
    return { ok: false, reason: "cancel_failed" };
  }

  const supabase = getSupabaseService();
  if (supabase) {
    const { data: diag } = await supabase
      .from("diagnoses")
      .select("email")
      .eq("id", diagnosisId)
      .maybeSingle();
    if (diag?.email) {
      await supabase
        .from("subscribers")
        .update({ unsubscribed_at: new Date().toISOString() })
        .eq("email", diag.email.toLowerCase());
    }
  }
  return { ok: true };
}

export async function POST(_request: Request, { params }: Params) {
  const { token } = await params;
  const result = await processToken(token);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, reason: result.reason },
      { status: result.reason === "invalid_token" ? 400 : 500 },
    );
  }
  // 204 sem body — RFC 8058: response esperada pra one-click
  return new NextResponse(null, { status: 204 });
}

// GET por compatibilidade — redireciona pra UI page.
export async function GET(_request: Request, { params }: Params) {
  const { token } = await params;
  return NextResponse.redirect(
    new URL(`/unsubscribe/${token}`, process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    { status: 302 },
  );
}
