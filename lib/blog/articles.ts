import type { Article, ArticleBlock, ArticleSummary, Pillar, PillarMeta } from "@/types/blog";

export const PILLARS: Record<Pillar, PillarMeta> = {
  "ai-applied": {
    slug: "ai-applied",
    label: "IA Aplicada a Operações",
    short: "IA Aplicada",
    description:
      "Como usar IA para resolver problemas reais de operação — sem hype.",
    className: "bg-amber-100 text-amber-900 border-amber-200",
  },
  "automation-stack": {
    slug: "automation-stack",
    label: "Automação com n8n e Stack Moderna",
    short: "Automação & n8n",
    description:
      "Frameworks, ferramentas e padrões para automatizar processos de verdade.",
    className: "bg-zinc-100 text-zinc-900 border-zinc-200",
  },
  "professional-operations": {
    slug: "professional-operations",
    label: "Profissionalização de Operações",
    short: "Profissionalização",
    description:
      "Como sair do amador e transformar operação em vantagem competitiva.",
    className: "bg-emerald-100 text-emerald-900 border-emerald-200",
  },
};

export const PILLAR_ORDER: Pillar[] = [
  "ai-applied",
  "automation-stack",
  "professional-operations",
];

export const mockArticles: ArticleSummary[] = [
  {
    id: "1",
    slug: "agente-ia-atendimento-clinicas",
    title: "Agente de IA no atendimento de clínicas: o que funciona e o que não funciona",
    excerpt:
      "3 padrões que separam clínicas que automatizam bem do amador disfarçado de IA.",
    pillar: "ai-applied",
    publishedAt: "2026-04-22",
    readingTime: 6,
    featured: true,
    metaTitle:
      "Agente de IA em clínicas: padrões que funcionam | Levi Lael",
    metaDescription:
      "Análise prática sobre o uso de agentes de IA em clínicas — onde dá retorno, onde não dá, e como evitar os erros mais comuns.",
  },
  {
    id: "2",
    slug: "n8n-vs-make-quando-usar",
    title: "n8n vs Make: quando usar cada um (sem religião)",
    excerpt:
      "Critério prático para escolher entre as duas plataformas, baseado em escala, custo e governança.",
    pillar: "automation-stack",
    publishedAt: "2026-04-15",
    readingTime: 5,
    featured: false,
  },
  {
    id: "3",
    slug: "operacao-amadora-sintomas",
    title: "Os 5 sintomas de uma operação amadora",
    excerpt:
      "Se você reconhece 3 ou mais, sua empresa está pagando o preço da operação manual — e a conta só aumenta.",
    pillar: "professional-operations",
    publishedAt: "2026-04-08",
    readingTime: 4,
    featured: false,
  },
  {
    id: "4",
    slug: "rag-vs-fine-tuning-pme",
    title: "RAG vs fine-tuning para PME: a resposta é quase sempre RAG",
    excerpt:
      "Por que empresas pequenas raramente precisam de fine-tuning, e como montar um RAG que custa <R$200/mês.",
    pillar: "ai-applied",
    publishedAt: "2026-03-30",
    readingTime: 7,
    featured: false,
  },
  {
    id: "5",
    slug: "stack-automacao-2026",
    title: "Stack mínimo de automação para empresas em 2026",
    excerpt:
      "Quais ferramentas escolher quando você está montando do zero — e quais evitar.",
    pillar: "automation-stack",
    publishedAt: "2026-03-22",
    readingTime: 8,
    featured: false,
  },
  {
    id: "6",
    slug: "automacao-erro-pular-mapeamento",
    title: "O erro que toda empresa comete antes de automatizar",
    excerpt:
      "Pular mapeamento e ir direto pra ferramenta. Resultado: caos automatizado.",
    pillar: "professional-operations",
    publishedAt: "2026-03-14",
    readingTime: 5,
    featured: false,
  },
];

export const mockArticleBlocks: Record<string, ArticleBlock[]> = {
  "agente-ia-atendimento-clinicas": [
    {
      type: "paragraph",
      text: "Toda semana entra uma clínica querendo automatizar atendimento com IA. E toda semana eu pergunto a mesma coisa: 'O que você quer resolver, exatamente?'",
    },
    {
      type: "paragraph",
      text: "A resposta quase nunca é específica. É vaga, do tipo 'reduzir o trabalho da recepcionista' ou 'responder mais rápido'. E é aí que mora o problema. Agente de IA bom não é genérico — é cirúrgico.",
    },
    {
      type: "heading",
      level: 2,
      text: "Os 3 padrões que funcionam",
    },
    {
      type: "list",
      ordered: true,
      items: [
        "Triagem inicial: o agente coleta sintomas, urgência e plano de saúde antes do humano entrar.",
        "Reagendamento automatizado: paciente cancela ou remarca pelo WhatsApp, sem fila no telefone.",
        "Confirmação ativa de consultas: 24h antes, o agente confirma presença e libera horário se houver desistência.",
      ],
    },
    {
      type: "callout",
      tone: "info",
      text: "Padrão comum: nenhum desses tenta substituir o atendimento humano. Eles eliminam fricção em momentos específicos do fluxo.",
    },
    {
      type: "heading",
      level: 2,
      text: "O que não funciona",
    },
    {
      type: "paragraph",
      text: "Agente de IA tentando 'conversar' com paciente sobre tratamento. Não importa o quão bom seja o prompt — paciente quer falar com humano sobre saúde. IA aqui só atrasa o fluxo e gera retrabalho.",
    },
    {
      type: "quote",
      text: "Automação não é sobre ter IA em todo lugar. É sobre eliminar fricção onde a fricção custa caro — e deixar humanos onde a humanidade importa.",
    },
  ],
  "n8n-vs-make-quando-usar": [
    {
      type: "paragraph",
      text: "Pergunta clássica: n8n ou Make? A resposta correta começa com outra pergunta — quanto vai escalar? E quem vai dar manutenção?",
    },
    {
      type: "heading",
      level: 2,
      text: "Critério rápido",
    },
    {
      type: "list",
      items: [
        "Stack < 5 automações + sem dev no time → Make.",
        "Stack > 10 automações + dev no time + governança importa → n8n self-hosted.",
        "Volume alto (>100k execuções/mês) → n8n self-hosted, sem dúvida.",
      ],
    },
    {
      type: "code",
      language: "bash",
      code: "# n8n self-hosted via docker (uma linha)\ndocker run -p 5678:5678 docker.n8n.io/n8nio/n8n",
    },
  ],
  "operacao-amadora-sintomas": [
    {
      type: "paragraph",
      text: "Operação amadora não é falta de competência da equipe — é falta de sistema. Aqui estão os 5 sintomas que aparecem em quase toda empresa que cresceu rápido sem profissionalizar processos.",
    },
    {
      type: "heading",
      level: 2,
      text: "1. Decisões dependem da memória de uma pessoa",
    },
    {
      type: "paragraph",
      text: "Se 'só fulano sabe' como faz X, você tem um single point of failure. Documentação não existe, processo só vive na cabeça de alguém. Quando essa pessoa sai (ou tira férias), a operação para.",
    },
    {
      type: "heading",
      level: 2,
      text: "2. Planilhas como fonte da verdade",
    },
    {
      type: "paragraph",
      text: "Planilha é ótima para começar. Vira problema quando 4 pessoas editam ao mesmo tempo, quando regras de negócio viram fórmulas malucas, quando a planilha precisa virar planilha-mãe e planilha-filha.",
    },
    {
      type: "callout",
      tone: "warning",
      text: "Sintoma terminal: a planilha já tem mais de 8 abas e ninguém sabe explicar todas.",
    },
  ],
  "rag-vs-fine-tuning-pme": [
    {
      type: "paragraph",
      text: "Empresas pequenas escutam 'fine-tuning' em conferência e acham que precisam. Quase sempre não precisam — e RAG resolve melhor, mais barato e mais rápido.",
    },
  ],
  "stack-automacao-2026": [
    {
      type: "paragraph",
      text: "Stack que recomendo pra quem está montando operação automatizada do zero em 2026, com critério de custo e manutenção.",
    },
  ],
  "automacao-erro-pular-mapeamento": [
    {
      type: "paragraph",
      text: "1 semana de mapeamento manual antes de qualquer ferramenta poupa 3 meses de retrabalho. Aqui está o framework que uso com clientes.",
    },
  ],
};

export function articleToFullArticle(summary: ArticleSummary): Article {
  return {
    ...summary,
    blocks: mockArticleBlocks[summary.slug] ?? [],
  };
}
