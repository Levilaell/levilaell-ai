/**
 * Email 2 (D+2) é personalizado via Anthropic Claude. Aprofunda a Oportunidade
 * #1 do diagnóstico do lead. Custo médio por lead: ~R$ 0,05.
 *
 * Resultado é cacheado em email_sequences.body_html / body_subject — o cron
 * só regenera se o cache estiver vazio.
 *
 * V2 contábil: o contexto usa carteira (q1_size), ERP (q2_erp) e perfil de
 * cliente (q3_client_profile). Pra leads legados (pre-2026-05-18), o cron
 * passa string vazia nas chaves V2 e nós caímos num fallback genérico no
 * prompt.
 */
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { ANTHROPIC_MODEL } from "@/lib/anthropic";
import {
  emailShell,
  escapeHtml,
  firstName,
} from "@/lib/email-templates";
import type {
  Opportunity,
  OpportunityV2,
} from "@/types/diagnosis";
import {
  CARTEIRA_SIZES,
  ERPS,
  CLIENT_PROFILES,
} from "@/lib/diagnosis-questions";

const MAX_TOKENS = 1_200;
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 1_000;

const aiResponseSchema = z.object({
  subject: z.string().min(1).max(120),
  body_html: z.string().min(40),
  body_text: z.string().min(20),
});

type AiResponse = z.infer<typeof aiResponseSchema>;

const TOOL = {
  name: "save_follow_up_email",
  description:
    "Persiste o e-mail de follow-up D+2 personalizado pro lead. Sempre chame essa tool com a versão final.",
  input_schema: {
    type: "object" as const,
    required: ["subject", "body_html", "body_text"],
    properties: {
      subject: {
        type: "string",
        description:
          "Subject curto e específico (não 'novidades' ou similar). Máx ~80 chars.",
      },
      body_html: {
        type: "string",
        description:
          "HTML simples, sem CSS inline. Apenas <p>, <strong>, <a href>, <ul>/<li>. Sem <html>/<body>/<style> — esses são adicionados pelo wrapper.",
      },
      body_text: {
        type: "string",
        description: "Versão texto puro do mesmo conteúdo, sem HTML.",
      },
    },
  },
};

function labelFromOptions<T extends { value: string; label: string }>(
  options: readonly T[],
  value: string,
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

export type FollowUp2Context = {
  diagnosisId: string;
  name: string;
  // V2 contábil — pode vir vazio pra registros legados; nesse caso o prompt
  // cai em "perfil não informado".
  q1_size: string;
  q2_erp: string;
  q3_client_profile: string;
  opportunity1: OpportunityV2 | Opportunity;
  calcomUrl: string;
  unsubscribeUrl: string;
};

export type FollowUp2Email = {
  subject: string;
  html: string;
  text: string;
};

export function isFollowUpAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function generateFollowUpEmail2(
  ctx: FollowUp2Context,
): Promise<FollowUp2Email> {
  const ai = isFollowUpAiConfigured()
    ? await callClaudeWithRetry(buildPrompt(ctx))
    : mockFollowUpResponse(ctx);

  // Wrap o body_html no shell padrão; appendar o link de unsubscribe.
  const f = firstName(ctx.name);
  const fallbackUnsub = `<p style="margin-top:32px"><a href="${ctx.unsubscribeUrl}" style="color:#a1a1aa; font-size:12px">Cancelar futuros e-mails</a></p>`;

  // Garantir que o HTML não contém <html>/<body> — proteção defensiva.
  let cleanHtml = ai.body_html
    .replace(/<\/?html[^>]*>/gi, "")
    .replace(/<\/?body[^>]*>/gi, "")
    .replace(/<\/?head[^>]*>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  // Se o IA não incluiu link pra Cal.com, adiciona um CTA antes do unsub.
  const calcomMentioned = cleanHtml.includes(ctx.calcomUrl);
  if (!calcomMentioned) {
    cleanHtml += `<p style="margin-top:24px"><a class="cta" href="${ctx.calcomUrl}">Agendar 30 min</a></p>`;
  }

  const html = emailShell(
    `<div class="card">${cleanHtml}<div class="meta">— Levi Lael</div>${fallbackUnsub}</div>`,
  );

  const textWithUnsub = ai.body_text.includes(ctx.unsubscribeUrl)
    ? ai.body_text
    : `${ai.body_text}\n\nCancelar futuros: ${ctx.unsubscribeUrl}`;
  const textFinal = textWithUnsub.includes(ctx.calcomUrl)
    ? textWithUnsub
    : `${textWithUnsub}\n\nAgendar: ${ctx.calcomUrl}`;

  return {
    subject: ai.subject,
    html,
    text: `Oi, ${f}.\n\n${textFinal}\n\n— Levi Lael`,
  };
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------
function buildPrompt(ctx: FollowUp2Context): string {
  const carteiraLabel = ctx.q1_size
    ? labelFromOptions(CARTEIRA_SIZES, ctx.q1_size)
    : "(não informado)";
  const erpLabel = ctx.q2_erp
    ? labelFromOptions(ERPS, ctx.q2_erp)
    : "(não informado)";
  const perfilLabel = ctx.q3_client_profile
    ? labelFromOptions(CLIENT_PROFILES, ctx.q3_client_profile)
    : "(não informado)";

  return `Você está escrevendo o segundo e-mail de uma sequência de nurturing pra um lead que fez um diagnóstico no site da Levi Lael (engenharia de automação para escritórios contábeis). Esse e-mail vai 2 dias depois do diagnóstico.

CONTEXTO DO LEAD:
- Nome: ${ctx.name}
- Carteira: ${carteiraLabel}
- ERP principal: ${erpLabel}
- Perfil predominante de cliente: ${perfilLabel}

OPORTUNIDADE #1 DO DIAGNÓSTICO:
- Título: ${ctx.opportunity1.titulo}
- Descrição: ${ctx.opportunity1.descricao}

OBJETIVO DO EMAIL:
Aprofundar a Oportunidade #1 com 1 nuance que o relatório inicial não mencionou. Educar, não vender. Tom didático e contábil.

REGRAS:
1. Máximo 250 palavras no body
2. Subject curto e específico (não use "novidades", "atualização" ou similar)
3. Termina com convite suave pra agendar conversa no link ${ctx.calcomUrl}
4. NUNCA invente estatísticas, casos ou números
5. NÃO recomende ferramenta específica (n8n, Make, Zapier, ChatGPT). Foque no processo.
6. Linguagem ajustada pra contabilidade — pode usar terminologia técnica (SPED, DCTF, eSocial, fechamento) quando fizer sentido
7. Não use "querido(a)" ou abertura formal — comece com "Oi, [primeiro nome]."
8. Português brasileiro direto
9. NÃO mencione Levi Lael em terceira pessoa — você é a equipe Levi Lael escrevendo. Use "nós" / "construímos" / "alinhamos" — nunca primeira pessoa singular ("eu", "meu", "comigo")

FORMATO DO HTML:
- Use apenas <p>, <strong>, <em>, <a href>, <ul>/<li>
- Não inclua <html>, <body>, <head>, <style> — o wrapper já cuida
- Os links pra Cal.com devem usar o href "${ctx.calcomUrl}"

Chame a tool "save_follow_up_email" com subject, body_html e body_text.`;
}

// ---------------------------------------------------------------------------
// Claude call com retry
// ---------------------------------------------------------------------------
async function callClaudeWithRetry(prompt: string): Promise<AiResponse> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await client.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: MAX_TOKENS,
        tools: [TOOL],
        tool_choice: { type: "tool", name: TOOL.name },
        messages: [{ role: "user", content: prompt }],
      });

      const toolUse = response.content.find(
        (block): block is Extract<typeof block, { type: "tool_use" }> =>
          block.type === "tool_use",
      );
      if (!toolUse) throw new Error("Anthropic não retornou tool_use.");
      const parsed = aiResponseSchema.safeParse(toolUse.input);
      if (!parsed.success) {
        throw new Error(
          `Schema inválido: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
        );
      }
      console.info(
        `[anthropic:followup-2] ok · in=${response.usage.input_tokens} out=${response.usage.output_tokens}`,
      );
      return parsed.data;
    } catch (err) {
      lastError = err;
      const code = (err as { status?: number }).status;
      const retryable =
        !code || code === 429 || (code >= 500 && code < 600);
      if (attempt < MAX_ATTEMPTS && retryable) {
        const backoff = BASE_BACKOFF_MS * 2 ** (attempt - 1);
        console.warn(
          `[anthropic:followup-2] tentativa ${attempt}/${MAX_ATTEMPTS} falhou; retry em ${backoff}ms`,
          err instanceof Error ? err.message : err,
        );
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      break;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Anthropic followup-2 falhou.");
}

// ---------------------------------------------------------------------------
// Mock — usado quando ANTHROPIC_API_KEY ausente (dev local sem chave)
// ---------------------------------------------------------------------------
function mockFollowUpResponse(ctx: FollowUp2Context): AiResponse {
  const f = firstName(ctx.name);
  const op = ctx.opportunity1;
  const subject = `${f}, um detalhe sobre ${op.titulo} que vale relembrar`;
  const body_html = `<p>Oi, ${escapeHtml(f)}.</p>
<p>Dois dias atrás vocês terminaram o diagnóstico — e <strong>${escapeHtml(op.titulo)}</strong> apareceu como a maior oportunidade.</p>
<p>O relatório falou do <em>quê</em>. Hoje queremos falar de uma nuance do <em>como</em>: a maioria dos escritórios contábeis começa essa automação pela ponta errada — tenta automatizar o registro antes de padronizar a entrada. Resultado: a equipe ainda recebe arquivo solto por WhatsApp, e o "automatizador" trabalha em cima do caos. Antes de plugar qualquer coisa no ERP, vale mapear como os documentos chegam hoje e desenhar um único canal padrão de entrada — pra cada tipo de cliente. Esse passo, sozinho, normalmente derruba 30% do tempo de triagem.</p>
<p>Se quiserem revisar o plano com a gente (30 min, sem compromisso): <a href="${ctx.calcomUrl}">${ctx.calcomUrl}</a></p>`;
  const body_text = `Oi, ${f}.

Dois dias atrás vocês terminaram o diagnóstico — e ${op.titulo} apareceu como a maior oportunidade.

O relatório falou do quê. Hoje queremos falar de uma nuance do como: a maioria dos escritórios começa essa automação pela ponta errada — tenta automatizar o registro antes de padronizar a entrada. Antes de plugar no ERP, vale mapear como os documentos chegam hoje e desenhar um único canal padrão de entrada.

Agendar 30 min: ${ctx.calcomUrl}`;
  return { subject, body_html, body_text };
}
