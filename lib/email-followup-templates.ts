/**
 * Templates fixos pros e-mails 3, 4, 5 e 6 da sequência de nurturing.
 *
 * Email 1 vai inline no submit (lib/email-templates.ts:diagnosisReportEmail).
 * Email 2 é gerado via IA (lib/email-followup-ai.ts).
 * Email 6 inclui link real de unsubscribe.
 */
import {
  emailShell,
  escapeHtml,
  firstName,
} from "@/lib/email-templates";
import { siteConfig } from "@/lib/site";

export type FollowUpContext = {
  diagnosisId: string;
  name: string;
  opportunityTitle: string;
  /** URL pra página /agendar?d=<id> — substituiu o link do Cal.com em 2026-05-18. */
  schedulingUrl: string;
  unsubscribeUrl: string;
};

export type FollowUpEmail = {
  subject: string;
  html: string;
  text: string;
};

const ctaButton = (label: string, href: string) =>
  `<p style="margin-top:24px"><a class="cta" href="${href}">${escapeHtml(label)}</a></p>`;

const footerUnsub = (unsubUrl: string) =>
  `<br><a href="${unsubUrl}" style="font-size:11px; color:#a1a1aa">Cancelar futuros e-mails</a>`;

// ---------------------------------------------------------------------------
// Email 3 — D+5 — framework "construir vs comprar"
// ---------------------------------------------------------------------------
export function followUpEmail3(ctx: FollowUpContext): FollowUpEmail {
  const f = firstName(ctx.name);
  const subject = `${f}, como decidir entre construir vs comprar automação`;

  const html = emailShell(
    `
    <div class="card">
      <p>Oi, ${escapeHtml(f)}.</p>
      <p>Toda vez que ajudamos alguém a pensar em automação, a primeira pergunta é: <strong>"compro pronto ou mando construir?"</strong></p>
      <p>Não tem resposta universal. Mas tem framework.</p>

      <h3>Compra pronto se:</h3>
      <ul>
        <li>O processo é genérico (vendido em todo lugar = baixo diferencial).</li>
        <li>Você não tem time técnico interno.</li>
        <li>Volume é alto e estável (vai usar muito sempre).</li>
      </ul>

      <h3>Constrói sob medida se:</h3>
      <ul>
        <li>Processo é específico do seu negócio.</li>
        <li>Stack atual exige integração customizada.</li>
        <li>Diferencial competitivo está justamente na automação.</li>
      </ul>

      <p>Na maioria dos casos: começa comprando pronto, migra pra custom quando dor específica aparece.</p>
      <p>Se quiser pensar isso pra sua operação especificamente, deixa seu contato que te chamo no WhatsApp.</p>
      ${ctaButton("Quero conversar", ctx.schedulingUrl)}

      <div class="meta">— Levi Lael</div>
    </div>
  `,
    footerUnsub(ctx.unsubscribeUrl),
  );

  const text = `Oi, ${f}.

Toda vez que ajudamos alguém a pensar em automação, a primeira pergunta é: "compro pronto ou mando construir?"

COMPRA pronto se:
- O processo é genérico (vendido em todo lugar)
- Você não tem time técnico interno
- Volume é alto e estável

CONSTRÓI sob medida se:
- Processo é específico do seu negócio
- Stack atual exige integração customizada
- Diferencial competitivo está na automação

Na maioria dos casos: começa comprando, migra pra custom quando dor específica aparece.

Quero conversar: ${ctx.schedulingUrl}

— Levi Lael
Cancelar futuros: ${ctx.unsubscribeUrl}`;

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Email 4 — D+8 — convite explícito pra conversa (referencia oportunidade #1)
// ---------------------------------------------------------------------------
export function followUpEmail4(ctx: FollowUpContext): FollowUpEmail {
  const f = firstName(ctx.name);
  const subject = `${f}, vamos destravar ${ctx.opportunityTitle}?`;

  const html = emailShell(
    `
    <div class="card">
      <p>Oi, ${escapeHtml(f)}.</p>
      <p>Já se passaram 8 dias desde que você completou o diagnóstico. <strong>${escapeHtml(ctx.opportunityTitle)}</strong> apareceu como sua prioridade número um.</p>
      <p>Se você ainda quer destravar isso, deixa seu contato e te chamo no WhatsApp pra uma conversa rápida. Sem pitch, sem apresentação. Falamos sobre seu caso específico e te dou o caminho mais curto.</p>
      <ul>
        <li>Se for o caminho de DIY, te explico como fazer sozinho.</li>
        <li>Se eu puder ajudar, te falo como.</li>
        <li>Se não for o momento, te falo isso também.</li>
      </ul>
      ${ctaButton("Quero conversar", ctx.schedulingUrl)}
      <div class="meta">— Levi Lael</div>
    </div>
  `,
    footerUnsub(ctx.unsubscribeUrl),
  );

  const text = `Oi, ${f}.

Já se passaram 8 dias desde o diagnóstico. ${ctx.opportunityTitle} apareceu como sua prioridade #1.

Se ainda quer destravar isso, deixa seu contato e te chamo no WhatsApp pra uma conversa rápida. Sem pitch, sem apresentação.

- Se for DIY, te explico como fazer sozinho.
- Se eu puder ajudar, te falo como.
- Se não for o momento, te falo isso também.

Quero conversar: ${ctx.schedulingUrl}

— Levi Lael
Cancelar futuros: ${ctx.unsubscribeUrl}`;

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Email 5 — D+12 — última chance + bônus (lead magnet)
// ---------------------------------------------------------------------------
export function followUpEmail5(ctx: FollowUpContext): FollowUpEmail {
  const f = firstName(ctx.name);
  const subject = `${f}, último toque + um bônus`;
  const newsletterUrl = `${siteConfig.url}/newsletter`;

  const html = emailShell(
    `
    <div class="card">
      <p>Oi, ${escapeHtml(f)}.</p>
      <p>Esse é o penúltimo email que você recebe sobre seu diagnóstico. Antes da sequência terminar, queremos deixar um bônus:</p>
      <h2>🎁 Mapa de Operação Inteligente</h2>
      <p>Framework em PDF de 12 páginas que usamos com clientes pra identificar oportunidades de automação. Gratuito, é só baixar.</p>
      <p><a class="cta" href="${newsletterUrl}">Pegar o Mapa</a></p>
      <p>Se em algum momento fizer sentido trocar uma ideia, <a href="${ctx.schedulingUrl}">deixa seu contato aqui</a> e te chamo no WhatsApp. Sem pressa.</p>
      <div class="meta">— Levi Lael</div>
    </div>
  `,
    footerUnsub(ctx.unsubscribeUrl),
  );

  const text = `Oi, ${f}.

Esse é o penúltimo email que você recebe sobre seu diagnóstico. Antes da sequência terminar, queremos deixar um bônus:

🎁 Mapa de Operação Inteligente — framework em PDF de 12 páginas que usamos com clientes pra identificar oportunidades de automação.

Pegar: ${newsletterUrl}

Se em algum momento fizer sentido trocar uma ideia, deixa seu contato e te chamo no WhatsApp:
${ctx.schedulingUrl}

— Levi Lael
Cancelar futuros: ${ctx.unsubscribeUrl}`;

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Email 6 — D+20 — list cleanup
// ---------------------------------------------------------------------------
export function followUpEmail6(ctx: FollowUpContext): FollowUpEmail {
  const f = firstName(ctx.name);
  const subject = `${f}, encerramos por aqui?`;

  const html = emailShell(
    `
    <div class="card">
      <p>Oi, ${escapeHtml(f)}.</p>
      <p>Tem 20 dias que você fez o diagnóstico. Esse é o último email automático que você recebe sobre isso.</p>
      <p>Se ainda tem alguma dúvida ou quer trocar uma ideia, <a href="${ctx.schedulingUrl}">deixa seu contato aqui</a> que te chamo no WhatsApp, ou simplesmente responde esse email.</p>
      <p>Se a operação está rodando bem e isso já se resolveu, ótimo — ficamos felizes.</p>
      <p style="margin-top:32px"><a href="${ctx.unsubscribeUrl}" style="color:#52525b; text-decoration:underline">Cancelar futuros emails</a></p>
      <div class="meta">— Levi Lael</div>
    </div>
  `,
  );

  const text = `Oi, ${f}.

Tem 20 dias que você fez o diagnóstico. Esse é o último email automático que você recebe sobre isso.

Se ainda tem alguma dúvida ou quer trocar uma ideia, deixa seu contato aqui que te chamo no WhatsApp:
${ctx.schedulingUrl}

Ou só responde esse email.

Se a operação está rodando bem e isso já se resolveu, ótimo — ficamos felizes.

Cancelar futuros: ${ctx.unsubscribeUrl}

— Levi Lael`;

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Dispatch helper — mapeia número do email pro template
// ---------------------------------------------------------------------------
export function followUpFixedTemplate(
  emailNumber: number,
  ctx: FollowUpContext,
): FollowUpEmail | null {
  switch (emailNumber) {
    case 3:
      return followUpEmail3(ctx);
    case 4:
      return followUpEmail4(ctx);
    case 5:
      return followUpEmail5(ctx);
    case 6:
      return followUpEmail6(ctx);
    default:
      return null;
  }
}
