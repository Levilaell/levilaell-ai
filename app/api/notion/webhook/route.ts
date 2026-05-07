import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.NOTION_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook não configurado." },
      { status: 503 },
    );
  }

  const provided =
    request.headers.get("x-webhook-secret") ??
    new URL(request.url).searchParams.get("secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: { slug?: string; pillar?: string } = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine — we revalidate the hub
  }

  revalidatePath("/blog");
  if (body.pillar) {
    revalidatePath(`/blog/category/${body.pillar}`);
  }
  if (body.slug) {
    revalidatePath(`/blog/${body.slug}`);
  }

  return NextResponse.json({ ok: true, revalidated: body });
}
