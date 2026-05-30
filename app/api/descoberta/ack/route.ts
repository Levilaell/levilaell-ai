/**
 * POST /api/descoberta/ack
 *
 * Resposta a uma pergunta aberta → reação curta da IA, em streaming (Haiku).
 * Devolve text/plain com os deltas. O cliente lê o stream e revela token a
 * token. Se a IA não estiver configurada → 204 (cliente cai pro ack canned).
 * Erro no meio do stream → fecha silenciosamente (cliente segue sem ack).
 */
import { discoveryAckRequestSchema } from "@/types/forms";
import { isDescobertaAiConfigured, streamAckDeltas } from "@/lib/descoberta/ai";
import { rateLimited, clientIp } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }

  const parsed = discoveryAckRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response("Dados inválidos", { status: 422 });
  }

  // Abuso de custo (endpoint Haiku pago): degrada pro ack canned (204), não trava.
  if (rateLimited("ack", clientIp(request), { max: 30 })) {
    return new Response(null, { status: 204 });
  }

  if (!isDescobertaAiConfigured()) {
    return new Response(null, { status: 204 });
  }

  const encoder = new TextEncoder();
  const input = parsed.data;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of streamAckDeltas(input)) {
          controller.enqueue(encoder.encode(delta));
        }
      } catch (err) {
        console.error(
          "[descoberta/ack] stream erro",
          err instanceof Error ? err.message : err,
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      // desliga buffering de proxy (nginx/vercel) pra o stream fluir
      "X-Accel-Buffering": "no",
    },
  });
}
