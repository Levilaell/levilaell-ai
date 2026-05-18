/**
 * Cliente Telegram pra notificações internas (form de agendamento, alertas).
 * Silent-fail: nunca trava o request principal por falha de notificação.
 *
 * Setup:
 *   1. /BotFather → /newbot → pega TELEGRAM_BOT_TOKEN
 *   2. Cada destinatário manda /start pro bot, depois acessa
 *      https://api.telegram.org/bot<TOKEN>/getUpdates pra pegar chat_id
 *   3. TELEGRAM_CHAT_IDS = lista separada por vírgula (ex: "123456,7890")
 */

const TELEGRAM_API = "https://api.telegram.org";

export function isTelegramConfigured(): boolean {
  return Boolean(
    process.env.TELEGRAM_BOT_TOKEN?.trim() &&
      process.env.TELEGRAM_CHAT_IDS?.trim(),
  );
}

function getChatIds(): string[] {
  const raw = process.env.TELEGRAM_CHAT_IDS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

type SendMessageInput = {
  text: string;
  /** Use "MarkdownV2" (mais restritivo) ou "HTML". Default: HTML. */
  parseMode?: "HTML" | "MarkdownV2";
  /** Desabilita preview de link (útil pra mensagens curtas). Default: true. */
  disableWebPagePreview?: boolean;
};

type SendResult = {
  chatId: string;
  ok: boolean;
  error?: string;
};

/**
 * Manda a mesma mensagem pra todos os chat_ids em paralelo.
 * Retorna o resultado por destinatário (útil pra log/diagnóstico).
 * Nunca throws — caller decide se ignora ou loga.
 */
export async function notifyTelegram(
  input: SendMessageInput,
): Promise<SendResult[]> {
  if (!isTelegramConfigured()) {
    console.info("[telegram] off — não configurado", {
      text_preview: input.text.slice(0, 60),
    });
    return [];
  }

  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const chatIds = getChatIds();
  const parseMode = input.parseMode ?? "HTML";
  const disablePreview = input.disableWebPagePreview ?? true;

  const results = await Promise.all(
    chatIds.map(async (chatId): Promise<SendResult> => {
      try {
        const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: input.text,
            parse_mode: parseMode,
            disable_web_page_preview: disablePreview,
          }),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          console.error("[telegram] sendMessage failed", {
            chat_id: chatId,
            status: res.status,
            body: body.slice(0, 200),
          });
          return { chatId, ok: false, error: `${res.status} ${body}` };
        }
        return { chatId, ok: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[telegram] sendMessage threw", { chat_id: chatId, err: msg });
        return { chatId, ok: false, error: msg };
      }
    }),
  );

  const okCount = results.filter((r) => r.ok).length;
  console.info("[telegram] notify done", {
    total: results.length,
    ok: okCount,
    failed: results.length - okCount,
  });
  return results;
}

/**
 * Escape de caracteres reservados do HTML do Telegram.
 * Use sempre que inserir dados do usuário em mensagens HTML.
 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
