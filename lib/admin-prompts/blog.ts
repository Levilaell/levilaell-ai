import type { BlogMetadata } from "@/types/admin";
import { PILLAR_LABEL_MAP } from "@/types/admin";

export const BLOG_TOOL_NAME = "save_blog_article";

export const BLOG_TOOL_SCHEMA = {
  name: BLOG_TOOL_NAME,
  description:
    "Persiste o artigo completo gerado para o blog. Sempre chame essa tool com o artigo final em markdown.",
  input_schema: {
    type: "object" as const,
    required: [
      "title",
      "slug",
      "meta_title",
      "meta_description",
      "excerpt",
      "reading_time_minutes",
      "content_markdown",
      "pillar",
      "target_keyword",
      "secondary_keywords",
    ],
    properties: {
      title: { type: "string" as const, minLength: 30, maxLength: 80 },
      slug: {
        type: "string" as const,
        pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
        minLength: 5,
        maxLength: 80,
      },
      meta_title: { type: "string" as const, minLength: 30, maxLength: 70 },
      meta_description: {
        type: "string" as const,
        minLength: 120,
        maxLength: 170,
      },
      excerpt: { type: "string" as const, minLength: 80, maxLength: 200 },
      reading_time_minutes: {
        type: "integer" as const,
        minimum: 5,
        maximum: 25,
      },
      content_markdown: { type: "string" as const, minLength: 8000 },
      pillar: { type: "string" as const, enum: ["1", "2", "3"] },
      target_keyword: { type: "string" as const, minLength: 2, maxLength: 80 },
      secondary_keywords: {
        type: "array" as const,
        items: { type: "string" as const, minLength: 2, maxLength: 80 },
        minItems: 2,
        maxItems: 7,
      },
    },
  },
};

export type BuildBlogPromptArgs = {
  topic: string;
  notes: string | null;
  keyword: string;
  pillar: "1" | "2" | "3";
  metadata: BlogMetadata;
};

export function buildBlogPrompt(args: BuildBlogPromptArgs): string {
  const { topic, notes, keyword, pillar, metadata } = args;
  const pillarName = PILLAR_LABEL_MAP[pillar];
  const targetWords = metadata.target_words;
  const notesBlock = notes && notes.trim() ? notes.trim() : "(sem notas extras)";

  return `Você é Levi Lael, engenheiro de operações com IA e automação.

PERFIL TÉCNICO REAL (use como referência, não como autoelogio):
- Construiu CaixaHub: fintech SaaS solo, integrou 100+ bancos
  brasileiros via Open Finance, OCR de boleto com revisão humana,
  webhook handlers idempotentes com retry exponencial.
  Cheguei a ter clientes pagantes antes de pausar.
- Construiu FastDevBuilds: outbound automation B2B com Claude
  Opus + Haiku, geração de demo de site em <90s com budget caps
  por execução.
- Stack diária: Next.js, Python (Django), Node.js, Anthropic SDK,
  OpenAI, Supabase, Celery+Redis, n8n.
- Filosofia central: "IA em produção, não em apresentação."

TOM DE VOZ:
- Técnico-didático e direto
- Contrarian, opinativo
- Português brasileiro natural (não parece tradução)
- Frases curtas e impactantes
- Anti-clichê de "guru de IA"

═══════════════════════════════════════════════════════════
TAREFA
═══════════════════════════════════════════════════════════

Gerar UM artigo completo em markdown para o blog levilael.com.br.

TÓPICO: ${topic}
PILAR: ${pillar} (${pillarName})
KEYWORD ALVO: ${keyword}
TAMANHO ALVO: ${targetWords} palavras (1500-2500)
NOTAS DO LEVI: ${notesBlock}

═══════════════════════════════════════════════════════════
PILARES
═══════════════════════════════════════════════════════════

1. IA Aplicada a Operações
   Como usar IA pra resolver problemas reais de negócio.

2. Automação com n8n e Stack Moderna
   Tutoriais práticos, comparativos, arquiteturas.

3. Profissionalização de Operações
   Conteúdo estratégico para o decisor.

═══════════════════════════════════════════════════════════
ESTRUTURA OBRIGATÓRIA DO ARTIGO
═══════════════════════════════════════════════════════════

1. **Lead poderoso (primeiros 3 parágrafos)**
   Gancho que faz a pessoa continuar lendo nos primeiros 3 segundos.
   Sem "vamos explorar" ou "no mundo de hoje".
   Comece com afirmação concreta, contraintuitiva ou específica.

2. **Promessa clara**
   O que o leitor vai aprender. Específico, não vago.

3. **Desenvolvimento em 5-8 H2s**
   Cada H2 com 2-4 H3s quando faz sentido.
   Use code blocks (sintaxe específica) quando útil.
   Use blockquotes pra alertas/insights importantes.

4. **Quick win prático**
   Algo que o leitor pode aplicar hoje, em 30 minutos.
   Step-by-step, sem floreio.

5. **Fechamento com insight ou provocação**
   NÃO use "em conclusão" ou "espero que tenha sido útil".
   Termine com algo memorável: provocação, alerta, ou
   insight que resume tudo.

6. **CTA contextual pro diagnóstico**
   1-2 frases linkando pra /diagnosis.
   Tom: "Se isso ressoa com você, dá pra mapear onde você
   está perdendo tempo no diagnóstico do site.
   [Link: levilael.com.br/diagnosis]"
   Não force, não pareça vendedor.

═══════════════════════════════════════════════════════════
REGRAS DE ESCRITA
═══════════════════════════════════════════════════════════

- Tom: técnico-didático, primeira pessoa quando relevante
  ("Quando construí o CaixaHub..." é OK)
- Frases curtas. Parágrafos curtos.
- Use exemplos concretos sempre que possível
- 1-2 momentos de "alerta" ou "contrarian view"
  (use blockquote: > para destacar)
- Code blocks com linguagem especificada (\`\`\`python,
  \`\`\`typescript, \`\`\`bash, etc.)
- Inclua a keyword principal naturalmente:
  - No título H1
  - No primeiro parágrafo
  - Em pelo menos 1 H2
  - Mais 2-3x ao longo do texto
- Inclua keywords secundárias derivadas com naturalidade
- NÃO use bullet points em excesso — prosa > listas
- NÃO use headings genéricos ("Conclusão", "Introdução")

═══════════════════════════════════════════════════════════
CLICHÊS PROIBIDOS (lista absoluta)
═══════════════════════════════════════════════════════════

NUNCA use:
- "revolucionando"
- "no mundo de hoje"
- "é importante notar"
- "vamos explorar"
- "fascinante mundo de"
- "é fundamental entender"
- "no cenário atual"
- "cada vez mais"
- "uma jornada"
- "desbloqueie o potencial"
- "transformação digital" (sem contexto específico)
- "no dia-a-dia das empresas"
- Frases que terminem com pergunta retórica genérica
- "é claro que" / "é óbvio que" (parece desdém)

═══════════════════════════════════════════════════════════
SAÍDA
═══════════════════════════════════════════════════════════

Use a ferramenta ${BLOG_TOOL_NAME} com os campos:

- title: string (H1, 50-70 chars, contém keyword)
- slug: string (kebab-case, URL-safe, derivado do título)
- meta_title: string (50-60 chars, otimizado pra Google)
- meta_description: string (140-160 chars, com keyword e
  call-to-action sutil)
- excerpt: string (1-2 frases pra cards do blog,
  100-160 chars)
- reading_time_minutes: integer (calculado: palavras / 200)
- content_markdown: string (artigo completo em markdown válido)
- pillar: string ('1', '2', ou '3')
- target_keyword: string (a keyword principal otimizada)
- secondary_keywords: array of strings (3-5 keywords
  secundárias derivadas)

NÃO inclua o título no content_markdown — ele é separado
em title.`;
}
