/**
 * POST /api/descoberta/plan
 *
 * Q0 (a necessidade) → ack + perguntas sob medida (Haiku).
 *
 * Nunca devolve erro pro cliente: se a IA falhar, não estiver configurada, ou
 * o IP estourar o rate limit, devolve o conjunto de perguntas estático
 * (FALLBACK_QUESTIONS). O lead nunca trava no fluxo.
 */
import { NextResponse } from "next/server";
import { discoveryPlanRequestSchema } from "@/types/forms";
import { isDescobertaAiConfigured, planQuestions } from "@/lib/descoberta/ai";
import { FALLBACK_QUESTIONS } from "@/lib/descoberta/slots";

export const runtime = "nodejs";

const FALLBACK_ACK =
  "Boa. Deixa eu entender melhor teu cenário pra montar algo que faça sentido — é rápido.";

// Rate limit best-effort (por instância serverless). Haiku é barato; isso só
// segura burst de abuso de um mesmo IP. Não é garantia global.
const hits = new Map<string, number[]>();
const WINDOW_MS = 5 * 60_000;
const MAX_HITS = 10;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > MAX_HITS;
}

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = discoveryPlanRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const fallback = NextResponse.json({
    ack: FALLBACK_ACK,
    questions: FALLBACK_QUESTIONS,
    fallback: true,
  });

  if (rateLimited(clientIp(request))) {
    console.warn("[descoberta/plan] rate limit — devolvendo fallback");
    return fallback;
  }
  if (!isDescobertaAiConfigured()) {
    return fallback;
  }

  try {
    const plan = await planQuestions({
      need: parsed.data.need,
      name: parsed.data.name || undefined,
    });
    return NextResponse.json({ ...plan, fallback: false });
  } catch (err) {
    console.error(
      "[descoberta/plan] falhou, usando fallback",
      err instanceof Error ? err.message : err,
    );
    return fallback;
  }
}
