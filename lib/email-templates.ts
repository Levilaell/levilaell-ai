import type { DiagnosisAnalysis, RecommendedApproach } from "@/types/diagnosis";
import { getCalcomRedirectUrl, getCalcomUrl } from "@/lib/calcom";
import { siteConfig } from "@/lib/site";

const baseStyles = `
<style>
  body { background-color: #fafafa; color: #18181b; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; margin: 0; padding: 0; }
  .container { max-width: 640px; margin: 0 auto; padding: 32px 24px; }
  .card { background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e4e4e7; }
  h1 { font-size: 22px; font-weight: 600; color: #18181b; margin: 0 0 16px; line-height: 1.3; }
  h2 { font-size: 18px; font-weight: 600; color: #18181b; margin: 24px 0 12px; }
  h3 { font-size: 16px; font-weight: 600; color: #18181b; margin: 20px 0 8px; }
  p { line-height: 1.6; margin: 0 0 12px; color: #27272a; }
  ul, ol { padding-left: 20px; margin: 0 0 16px; }
  li { line-height: 1.6; margin-bottom: 6px; }
  .badge { display: inline-block; font-size: 12px; padding: 4px 10px; border-radius: 999px; background: #f4f4f5; color: #52525b; margin-bottom: 8px; }
  .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin-top: 24px; }
  .cta { background: #f59e0b; color: #18181b; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-weight: 600; display: inline-block; margin-top: 16px; }
  .cta-light { background: #ffffff; color: #18181b; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-weight: 600; display: inline-block; margin-top: 16px; border: 1px solid #e4e4e7; }
  .meta { color: #71717a; font-size: 13px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e4e4e7; }
  .footer { color: #a1a1aa; font-size: 12px; margin-top: 24px; text-align: center; }
  .footer a { color: #52525b; text-decoration: underline; }
  .disclaimer { font-style: italic; color: #71717a; font-size: 12px; margin-top: 6px; }
</style>
`;

export function emailShell(content: string, footerExtra: string = ""): string {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${baseStyles}</head><body><div class="container">${content}<div class="footer">© ${new Date().getFullYear()} ${siteConfig.name} — <a href="${siteConfig.url}">${siteConfig.domain}</a><br><a href="${siteConfig.social.linkedin}">LinkedIn</a> · <a href="${siteConfig.social.github}">GitHub</a>${footerExtra}</div></div></body></html>`;
}

// Alias interno mantém referências antigas funcionando.
const shell = emailShell;

const approachLabels: Record<RecommendedApproach, string> = {
  diy: "Faça você mesmo",
  consultoria_pontual: "Consultoria pontual",
  parceria_continua: "Parceria contínua",
  ainda_nao_e_hora: "Automação ainda não é prioridade",
};

const timelineBadges: Record<string, string> = {
  this_week: "🔥 Urgente",
  next_month: "⚡ Próximo mês",
  "3_to_6_months": "📅 Médio prazo",
  no_urgency: "🌱 Exploratório",
};

const timelineContexts: Record<string, string> = {
  this_week: "Você marcou esse projeto como urgente. Aqui está seu plano:",
  next_month: "Você marcou esse projeto pra rodar no próximo mês:",
  "3_to_6_months": "Você marcou esse projeto pros próximos 3-6 meses:",
  no_urgency: "Você marcou esse projeto como exploratório:",
};

type EmailCtaCopy = { intro: string; button: string };

const emailCtaByApproach: Record<RecommendedApproach, EmailCtaCopy> = {
  diy: {
    intro:
      "Se travar na implementação, te explico o caminho mais curto numa call de 30 min. Sem pitch.",
    button: "Tirar dúvidas em uma call",
  },
  ainda_nao_e_hora: {
    intro:
      "Mesmo se automação não é prioridade agora, a gente pode mapear quando vai ser. Sem pitch.",
    button: "Agendar 20 min",
  },
  consultoria_pontual: {
    intro:
      "Quer aprofundar esse plano com apoio especializado? Agenda uma call de 30 min sem compromisso.",
    button: "Agendar call gratuita",
  },
  parceria_continua: {
    intro:
      "Se faz sentido trabalhar contínuo, a gente alinha escopo, ritmo e custo numa call.",
    button: "Agendar call estratégica",
  },
};

/** Pega só o primeiro nome — "Levi Lael Coelho Silva" → "Levi". */
export function firstName(full: string): string {
  return (full || "").trim().split(/\s+/)[0] || "";
}

// ---------------------------------------------------------------------------
// Diagnosis report (entregue imediatamente após o submit)
// ---------------------------------------------------------------------------
export function diagnosisReportEmail(args: {
  name: string;
  diagnosisId: string;
  analysis: DiagnosisAnalysis;
  timeline?: string;
}): { subject: string; html: string; text: string } {
  const { name, diagnosisId, analysis, timeline } = args;
  const reportUrl = `${siteConfig.url}/diagnosis/result/${diagnosisId}`;

  const opportunitiesHtml = analysis.tres_oportunidades
    .map(
      (op, i) => `
        <h3>${i + 1}. ${escapeHtml(op.titulo)}</h3>
        <p>${escapeHtml(op.descricao)}</p>
        <p><strong>Impacto:</strong> ${escapeHtml(op.impacto_estimado)}<br>
        <strong>Complexidade:</strong> ${escapeHtml(op.complexidade)}<br>
        <strong>Prazo de implementação:</strong> ${escapeHtml(op.prazo_implementacao)}<br>
        <strong>Ferramentas sugeridas:</strong> ${op.ferramentas_sugeridas.map(escapeHtml).join(", ")}</p>
      `,
    )
    .join("");

  const stepsHtml = analysis.quick_win.passo_a_passo
    .map((s) => `<li>${escapeHtml(s.replace(/^\s*\d+\.\s*/, ""))}</li>`)
    .join("");

  const fName = firstName(name);
  const timelineHeader =
    timeline && timelineContexts[timeline] && timelineBadges[timeline]
      ? `<p style="color:#52525b; font-size:14px; margin-bottom:16px"><strong>${timelineBadges[timeline]}</strong> · ${escapeHtml(timelineContexts[timeline])}</p>`
      : "";

  const disclaimerHtml = analysis.estimativa_roi.disclaimer
    ? `<p class="disclaimer">${escapeHtml(analysis.estimativa_roi.disclaimer)}</p>`
    : "";

  const ctaCopy =
    emailCtaByApproach[analysis.proximo_passo_recomendado.abordagem];
  const calcomBase = getCalcomUrl();
  const schedulingHref = calcomBase
    ? getCalcomRedirectUrl(diagnosisId)
    : `mailto:${siteConfig.email.contact}?subject=${encodeURIComponent(`Diagnóstico — ${name}`)}`;
  const ctaBlockHtml = `
    <p style="margin-top: 24px">${escapeHtml(ctaCopy.intro)}</p>
    <p style="margin-top: 8px"><a class="cta" href="${schedulingHref}">${escapeHtml(ctaCopy.button)}</a></p>
  `;

  const html = shell(`
    <div class="card">
      ${timelineHeader}
      <h1>Olá, ${escapeHtml(fName)}. Seu relatório está aqui.</h1>
      <p>${escapeHtml(analysis.diagnostico_resumido)}</p>

      <h2>Top 3 oportunidades</h2>
      ${opportunitiesHtml}

      <h2>Quick win (1 semana)</h2>
      <p><strong>${escapeHtml(analysis.quick_win.titulo)}</strong></p>
      <ol>${stepsHtml}</ol>
      ${analysis.quick_win.ferramentas_necessarias.length > 0
        ? `<p><strong>Ferramentas:</strong> ${analysis.quick_win.ferramentas_necessarias.map(escapeHtml).join(", ")}</p>`
        : ""}

      <h2>Estimativa de retorno</h2>
      <p>
        Horas recuperáveis/mês: <strong>${escapeHtml(String(analysis.estimativa_roi.horas_recuperaveis_mes))}</strong><br>
        Valor estimado/mês: <strong>${escapeHtml(analysis.estimativa_roi.valor_estimado_mensal)}</strong><br>
        Payback: <strong>${escapeHtml(analysis.estimativa_roi.tempo_payback)}</strong>
      </p>
      ${disclaimerHtml}

      <h2>Próximo passo recomendado</h2>
      <p><strong>Abordagem:</strong> ${escapeHtml(approachLabels[analysis.proximo_passo_recomendado.abordagem])}</p>
      <p>${escapeHtml(analysis.proximo_passo_recomendado.justificativa)}</p>

      <div class="alert">
        <strong>Alerta estratégico</strong>
        <p style="margin-top: 8px">${escapeHtml(analysis.alerta_estrategico)}</p>
      </div>

      ${ctaBlockHtml}

      <p style="margin-top: 16px"><a class="cta-light" href="${reportUrl}">Ver relatório completo online</a></p>

      <div class="meta">
        Ou responde este e-mail — leio todos.<br>
        — Levi Lael
      </div>
    </div>
  `);

  const text = `Olá, ${fName}.\n\n${analysis.diagnostico_resumido}\n\n${ctaCopy.intro}\nAgendar: ${schedulingHref}\n\nVer relatório online: ${reportUrl}\n\n— Levi Lael`;
  return {
    subject: `Seu diagnóstico de operação está pronto, ${fName}`,
    html,
    text,
  };
}

// ---------------------------------------------------------------------------
// Newsletter welcome (immediate after subscribe)
// ---------------------------------------------------------------------------
export function newsletterWelcomeEmail(args: { name: string }): {
  subject: string;
  html: string;
  text: string;
} {
  const fName = firstName(args.name);
  // TODO(levi): Replace with real PDF URL once uploaded to Supabase Storage
  const downloadUrl = `${siteConfig.url}/lead-magnets/mapa-operacao-inteligente.pdf`;

  const html = shell(`
    <div class="card">
      <h1>Bem-vindo, ${escapeHtml(fName)}.</h1>
      <p>Você acabou de assinar a newsletter de quem leva operação a sério. Toda terça, um insight prático sobre IA, automação e profissionalização.</p>
      <h2>🎁 Seu Mapa de Operação Inteligente</h2>
      <p>Conforme prometido, segue o framework em PDF que uso com clientes para mapear oportunidades de automação:</p>
      <p><a class="cta" href="${downloadUrl}">Baixar o Mapa (PDF)</a></p>
      <div class="meta">— Levi Lael</div>
    </div>
  `);

  const text = `Bem-vindo, ${fName}.\n\nDownload do Mapa: ${downloadUrl}\n\n— Levi Lael`;
  return {
    subject: "Bem-vindo. Seu Mapa de Operação Inteligente está aqui.",
    html,
    text,
  };
}

// ---------------------------------------------------------------------------
// Contact confirmation (immediate after form submission)
// ---------------------------------------------------------------------------
export function contactConfirmationEmail(args: { name: string }): {
  subject: string;
  html: string;
  text: string;
} {
  const fName = firstName(args.name);
  const html = shell(`
    <div class="card">
      <h1>Recebi sua mensagem, ${escapeHtml(fName)}.</h1>
      <p>Respondo em até 24-48h em dia útil. Se for urgente, me chama no e-mail direto: <a href="mailto:${siteConfig.email.contact}">${siteConfig.email.contact}</a>.</p>
      <div class="meta">— Levi Lael</div>
    </div>
  `);

  const text = `Recebi sua mensagem, ${fName}. Respondo em 24-48h.\n\n— Levi Lael`;
  return { subject: `Recebi sua mensagem, ${fName}`, html, text };
}

// ---------------------------------------------------------------------------
// Internal notifications
// ---------------------------------------------------------------------------
export function internalDiagnosisEmail(args: {
  diagnosisId: string;
  name: string;
  email: string;
  whatsapp: string | null;
  company: string | null;
  leadScore: number | null;
  analysis: DiagnosisAnalysis;
  contextLabels: {
    size: string;
    businessModel: string;
    timeline: string;
    budget: string;
    revenue: string;
  };
}): { subject: string; html: string; text: string } {
  const { diagnosisId, name, email, whatsapp, company, leadScore, analysis, contextLabels } = args;
  const reportUrl = `${siteConfig.url}/diagnosis/result/${diagnosisId}`;
  const op1 = analysis.tres_oportunidades[0];
  const subject = `🎯 Novo diagnóstico: ${name}${company ? ` (${company})` : ""}${leadScore !== null ? ` · score ${leadScore}` : ""}`;

  const html = shell(`
    <div class="card">
      <span class="badge">Novo diagnóstico completo</span>
      <h1>${escapeHtml(name)} ${leadScore !== null ? `· lead score ${leadScore}` : ""}</h1>
      <p>${escapeHtml(analysis.diagnostico_resumido)}</p>

      <h2>Lead</h2>
      <p>
        E-mail: <a href="mailto:${email}">${escapeHtml(email)}</a><br>
        ${whatsapp ? `WhatsApp: ${escapeHtml(whatsapp)}<br>` : ""}
        ${company ? `Empresa: ${escapeHtml(company)}<br>` : ""}
      </p>

      <h2>Contexto</h2>
      <p>
        Tamanho: ${escapeHtml(contextLabels.size)}<br>
        Modelo: ${escapeHtml(contextLabels.businessModel)}<br>
        Urgência: ${escapeHtml(contextLabels.timeline)}<br>
        Budget: ${escapeHtml(contextLabels.budget)}<br>
        Faturamento: ${escapeHtml(contextLabels.revenue)}
      </p>

      <h2>Oportunidade #1</h2>
      <p><strong>${escapeHtml(op1.titulo)}</strong> — ${escapeHtml(op1.impacto_estimado)} (${escapeHtml(op1.complexidade)})</p>

      <h2>ROI estimado</h2>
      <p>
        ${escapeHtml(analysis.estimativa_roi.valor_estimado_mensal)} · payback ${escapeHtml(analysis.estimativa_roi.tempo_payback)}
      </p>

      <h2>Recomendação</h2>
      <p><strong>${escapeHtml(approachLabels[analysis.proximo_passo_recomendado.abordagem])}</strong></p>
      <p>${escapeHtml(analysis.proximo_passo_recomendado.justificativa)}</p>

      <p style="margin-top: 24px"><a class="cta" href="${reportUrl}">Abrir relatório completo</a></p>
    </div>
  `);

  const text = `Novo diagnóstico: ${name} (${email})\nScore: ${leadScore ?? "-"}\nAbordagem: ${analysis.proximo_passo_recomendado.abordagem}\nLink: ${reportUrl}`;
  return { subject, html, text };
}

export function internalContactEmail(args: {
  name: string;
  email: string;
  company: string | null;
  subject: string | null;
  serviceInterest: string | null;
  message: string;
}): { subject: string; html: string; text: string } {
  const { name, email, company, subject, serviceInterest, message } = args;
  const subjectLine = `📬 Novo contato: ${subject ?? "—"}`;

  const html = shell(`
    <div class="card">
      <span class="badge">Contato recebido</span>
      <h1>${escapeHtml(name)}</h1>
      <p>
        E-mail: <a href="mailto:${email}">${escapeHtml(email)}</a><br>
        ${company ? `Empresa: ${escapeHtml(company)}<br>` : ""}
        Assunto: ${escapeHtml(subject ?? "—")}<br>
        ${serviceInterest ? `Interesse: ${escapeHtml(serviceInterest)}<br>` : ""}
      </p>
      <h2>Mensagem</h2>
      <p style="white-space: pre-wrap">${escapeHtml(message)}</p>
    </div>
  `);

  const text = `Contato de ${name} (${email}):\n\n${message}`;
  return { subject: subjectLine, html, text };
}

// ---------------------------------------------------------------------------
// Editorial — IA terminou geração, conteúdo aguarda revisão.
// Roda fire-and-forget no fim de runX/runBlog. Reusa o shell padrão.
// ---------------------------------------------------------------------------
export function editorialReadyEmail(args: {
  pipelineId: string;
  channel: "blog" | "newsletter" | "x";
  topic: string;
  durationMs: number;
  costBRL: number;
  tokens: number;
}): { subject: string; html: string; text: string } {
  const { pipelineId, channel, topic, durationMs, costBRL, tokens } = args;
  const channelLabel =
    channel === "blog"
      ? "Blog"
      : channel === "x"
        ? "X (Twitter)"
        : "Newsletter";
  const reviewUrl = `${siteConfig.url}/admin?id=${pipelineId}`;
  const seconds = (durationMs / 1000).toFixed(1).replace(".", ",");
  const cost = costBRL.toFixed(4).replace(".", ",");

  const subject = `🎯 Conteúdo pronto pra revisão: ${topic}`;
  const html = shell(`
    <div class="card">
      <span class="badge">${escapeHtml(channelLabel)}</span>
      <h1>IA terminou de gerar.</h1>
      <p>${escapeHtml(topic)}</p>
      <p>
        Tempo: <strong>${seconds}s</strong><br>
        Custo: <strong>R$ ${cost}</strong><br>
        Tokens: <strong>${tokens.toLocaleString("pt-BR")}</strong>
      </p>
      <p style="margin-top: 24px"><a class="cta" href="${reviewUrl}">Revisar e aprovar</a></p>
    </div>
  `);
  const text = `IA terminou de gerar — ${channelLabel}: ${topic}\nTempo: ${seconds}s · R$ ${cost} · ${tokens} tokens\nRevisar: ${reviewUrl}`;
  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Helpers (export pra ser reutilizado pelos templates de follow-up sequence)
// ---------------------------------------------------------------------------
export function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
