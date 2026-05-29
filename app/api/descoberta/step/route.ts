/**
 * POST /api/descoberta/step
 *
 * Um passo do loop de descoberta guiado por checklist. Stateless: recebe a dor +
 * tudo coletado, devolve OU o próximo lote de perguntas OU { complete:true } +
 * a pauta de confirmação técnica.
 *
 * Nunca trava o lead: a completude e as perguntas são determinísticas (checklist);
 * a IA só frase. Se a IA não estiver configurada ou o IP estourar o rate limit,
 * devolve o passo com os prompts-piso (phrase:false). O fluxo sempre avança.
 */
import { NextResponse } from "next/server";
import { discoveryStepRequestSchema } from "@/types/forms";
import { discoveryStep } from "@/lib/descoberta/engine";

export const runtime = "nodejs";

// Rate limit best-effort por instância. O loop chama várias vezes por sessão,
// então o teto é mais folgado que o de um endpoint one-shot.
const hits = new Map<string, number[]>();
const WINDOW_MS = 5 * 60_000;
const MAX_HITS = 40;

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

  const parsed = discoveryStepRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  // Rate limit → segue determinístico (sem fraseado de IA), nunca trava o lead.
  const phrase = !rateLimited(clientIp(request));

  try {
    const step = await discoveryStep(parsed.data, { phrase });
    return NextResponse.json(step);
  } catch (err) {
    console.error(
      "[descoberta/step] inesperado — tentando passo determinístico",
      err instanceof Error ? err.message : err,
    );
    // Backstop: a parte determinística não deveria lançar; se lançou, tenta de
    // novo sem IA antes de desistir.
    try {
      const step = await discoveryStep(parsed.data, { phrase: false });
      return NextResponse.json(step);
    } catch {
      return NextResponse.json(
        { error: "Não consegui montar a próxima pergunta agora." },
        { status: 500 },
      );
    }
  }
}
