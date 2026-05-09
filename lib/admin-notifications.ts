/**
 * Notificações internas pro fluxo editorial. Fire-and-forget — falha aqui
 * não trava nada do pipeline.
 */
import { sendEmail, isResendConfigured } from "@/lib/resend";
import { editorialReadyEmail } from "@/lib/email-templates";
import { siteConfig } from "@/lib/site";

type EditorialReadyArgs = {
  pipelineId: string;
  channel: "blog" | "newsletter" | "x";
  topic: string;
  durationMs: number;
  costBRL: number;
  tokens: number;
};

export async function sendEditorialReadyEmail(
  args: EditorialReadyArgs,
): Promise<void> {
  try {
    if (!isResendConfigured()) {
      console.info("[admin-notifications] resend off — skip notify", {
        id: args.pipelineId,
      });
      return;
    }
    const tpl = editorialReadyEmail(args);
    await sendEmail({
      to: siteConfig.email.internal,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });
  } catch (err) {
    console.warn("[admin-notifications] editorial-ready failed (silent)", {
      id: args.pipelineId,
      err: err instanceof Error ? err.message : err,
    });
  }
}
