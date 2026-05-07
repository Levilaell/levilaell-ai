import type { DiagnosisAnalysis } from "@/types/diagnosis";
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
  .meta { color: #71717a; font-size: 13px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e4e4e7; }
  .footer { color: #a1a1aa; font-size: 12px; margin-top: 24px; text-align: center; }
</style>
`;

function shell(content: string): string {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${baseStyles}</head><body><div class="container">${content}<div class="footer">© ${new Date().getFullYear()} ${siteConfig.name} — ${siteConfig.domain}</div></div></body></html>`;
}

export function diagnosisReportEmail(args: {
  name: string;
  diagnosisId: string;
  analysis: DiagnosisAnalysis;
}): { subject: string; html: string; text: string } {
  const { name, diagnosisId, analysis } = args;
  const reportUrl = `${siteConfig.url}/diagnosis/result/${diagnosisId}`;

  const opportunitiesHtml = analysis.tres_oportunidades
    .map(
      (op, i) => `
        <h3>${i + 1}. ${escapeHtml(op.titulo)}</h3>
        <p>${escapeHtml(op.descricao)}</p>
        <p><strong>Impacto:</strong> ${escapeHtml(op.impacto_estimado)} · <strong>Complexidade:</strong> ${escapeHtml(op.complexidade)}</p>
        <p><strong>Ferramentas:</strong> ${op.ferramentas_sugeridas.map(escapeHtml).join(", ")}</p>
      `,
    )
    .join("");

  const stepsHtml = analysis.quick_win.passo_a_passo
    .map((s) => `<li>${escapeHtml(s)}</li>`)
    .join("");

  const html = shell(`
    <div class="card">
      <span class="badge">Diagnóstico de Operação com IA</span>
      <h1>Olá, ${escapeHtml(name)}. Seu relatório está aqui.</h1>
      <p>${escapeHtml(analysis.diagnostico_resumido)}</p>

      <h2>Top 3 oportunidades</h2>
      ${opportunitiesHtml}

      <h2>Quick win (1 semana)</h2>
      <p><strong>${escapeHtml(analysis.quick_win.titulo)}</strong></p>
      <ol>${stepsHtml}</ol>

      <h2>Estimativa de retorno</h2>
      <p>
        Horas recuperáveis/mês: <strong>${escapeHtml(String(analysis.estimativa_roi.horas_recuperaveis_mes))}</strong><br>
        Valor estimado/mês: <strong>${escapeHtml(analysis.estimativa_roi.valor_estimado_mensal)}</strong><br>
        Payback: <strong>${escapeHtml(analysis.estimativa_roi.tempo_payback)}</strong>
      </p>

      <h2>Próximo passo recomendado</h2>
      <p><strong>Abordagem:</strong> ${escapeHtml(analysis.proximo_passo_recomendado.abordagem)}</p>
      <p>${escapeHtml(analysis.proximo_passo_recomendado.justificativa)}</p>

      <div class="alert">
        <strong>Alerta estratégico</strong>
        <p style="margin-top: 8px">${escapeHtml(analysis.alerta_estrategico)}</p>
      </div>

      <p style="margin-top: 24px"><a class="cta" href="${reportUrl}">Ver relatório completo</a></p>

      <div class="meta">
        Quer aprofundar esse plano? Responda este e-mail ou agende uma call de 30min.<br>
        — Levi Lael
      </div>
    </div>
  `);

  const text = `Olá, ${name}.\n\n${analysis.diagnostico_resumido}\n\nVer relatório: ${reportUrl}\n\n— Levi Lael`;
  return {
    subject: `Seu diagnóstico de operação está pronto, ${name}`,
    html,
    text,
  };
}

export function newsletterWelcomeEmail(args: { name: string }): {
  subject: string;
  html: string;
  text: string;
} {
  const { name } = args;
  const downloadUrl = `${siteConfig.url}/lead-magnets/mapa-operacao-inteligente.pdf`;

  const html = shell(`
    <div class="card">
      <h1>Bem-vindo, ${escapeHtml(name)}.</h1>
      <p>Você acabou de assinar a newsletter de quem leva operação a sério. Toda terça, um insight prático sobre IA, automação e profissionalização.</p>
      <h2>🎁 Seu Mapa de Operação Inteligente</h2>
      <p>Conforme prometido, segue o framework em PDF que uso com clientes para mapear oportunidades de automação:</p>
      <p><a class="cta" href="${downloadUrl}">Baixar o Mapa (PDF)</a></p>
      <div class="meta">— Levi Lael</div>
    </div>
  `);

  const text = `Bem-vindo, ${name}.\n\nDownload do Mapa: ${downloadUrl}\n\n— Levi Lael`;
  return {
    subject: "Bem-vindo. Seu Mapa de Operação Inteligente está aqui.",
    html,
    text,
  };
}

export function contactConfirmationEmail(args: { name: string }): {
  subject: string;
  html: string;
  text: string;
} {
  const { name } = args;
  const html = shell(`
    <div class="card">
      <h1>Recebi sua mensagem, ${escapeHtml(name)}.</h1>
      <p>Respondo em até 24-48h em dia útil. Se for urgente, me chama no e-mail direto: <a href="mailto:${siteConfig.email.contact}">${siteConfig.email.contact}</a>.</p>
      <div class="meta">— Levi Lael</div>
    </div>
  `);

  const text = `Recebi sua mensagem, ${name}. Respondo em 24-48h.\n\n— Levi Lael`;
  return { subject: `Recebi sua mensagem, ${name}`, html, text };
}

export function internalNotificationEmail(args: {
  kind: "diagnosis" | "contact" | "newsletter";
  payload: Record<string, unknown>;
}): { subject: string; html: string; text: string } {
  const { kind, payload } = args;
  const subjects = {
    diagnosis: "📋 Novo diagnóstico completado",
    contact: "📨 Novo contato recebido",
    newsletter: "📰 Novo assinante da newsletter",
  } as const;

  const rows = Object.entries(payload)
    .map(
      ([k, v]) =>
        `<tr><td style="padding: 6px 12px; border-bottom: 1px solid #e4e4e7; color:#71717a; font-size:13px"><strong>${escapeHtml(k)}</strong></td><td style="padding: 6px 12px; border-bottom: 1px solid #e4e4e7; font-size:13px">${escapeHtml(formatValue(v))}</td></tr>`,
    )
    .join("");

  const html = shell(`
    <div class="card">
      <h1>${subjects[kind]}</h1>
      <table style="width:100%; border-collapse: collapse; margin-top: 12px">${rows}</table>
    </div>
  `);

  const text = Object.entries(payload)
    .map(([k, v]) => `${k}: ${formatValue(v)}`)
    .join("\n");

  return { subject: subjects[kind], html, text };
}

function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
