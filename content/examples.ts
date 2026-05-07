import type { DiagnosisAnalysis } from "@/types/diagnosis";

export type DiagnosisExample = {
  slug: string;
  title: string;
  metaDescription: string;
  leadProfile: string;
  publishedAt: string;
  analysis: DiagnosisAnalysis;
};

export const examples: DiagnosisExample[] = [
  {
    slug: "clinicas-pequenas-saude",
    title: "Diagnóstico anonimizado: clínica de saúde com 2 unidades e 18 funcionários",
    metaDescription:
      "Exemplo real anonimizado de diagnóstico para clínica em crescimento. Top 3 oportunidades, quick win e ROI estimado.",
    leadProfile:
      "Clínica multidisciplinar em São Paulo, 2 unidades, 18 funcionários. Faturamento estável mas com gargalo em recepção e remarcação.",
    publishedAt: "2026-04-10",
    analysis: {
      diagnostico_resumido:
        "Operação típica de clínica em crescimento: a recepção virou o gargalo de quase tudo — confirmações, remarcações, triagem inicial — e cada nova unidade aberta multiplica o problema sem multiplicar a receita proporcional.",
      tres_oportunidades: [
        {
          titulo: "Confirmação ativa automatizada de consultas",
          descricao:
            "Bot no WhatsApp confirma a consulta 24h antes. Quem cancela libera horário automaticamente, e o sistema oferece o slot pra fila de espera. Reduz no-show de 25% para <8% em clínicas similares.",
          impacto_estimado: "redução de 60% no no-show + 8h/semana economizadas",
          complexidade: "média",
          ferramentas_sugeridas: [
            "WhatsApp Business API",
            "n8n",
            "Google Calendar API",
          ],
        },
        {
          titulo: "Triagem inicial via chatbot",
          descricao:
            "Antes de cair no humano, o paciente passa por um fluxo curto que coleta sintomas, urgência e convênio. Atendente recebe a ficha pré-preenchida — corta 70% do tempo médio de atendimento.",
          impacto_estimado: "12h/semana de recepcionista",
          complexidade: "média",
          ferramentas_sugeridas: ["Claude", "WhatsApp Business API", "Supabase"],
        },
        {
          titulo: "Dashboard unificado de ocupação",
          descricao:
            "Visão em tempo real de ocupação por unidade, profissional e especialidade. Identifica horários ociosos pra ofertar pacotes e horários sobrecarregados pra rebalancear agenda.",
          impacto_estimado: "5-8% de aumento na receita por melhor utilização",
          complexidade: "baixa",
          ferramentas_sugeridas: ["Metabase", "Supabase", "n8n"],
        },
      ],
      quick_win: {
        titulo: "Mensagem automatizada de boas-vindas + lembrete (1 semana)",
        passo_a_passo: [
          "Identificar o canal principal (provavelmente WhatsApp da clínica).",
          "Mapear as 5 perguntas mais comuns na recepção.",
          "Configurar respostas automáticas iniciais com WhatsApp Business.",
          "Adicionar lembrete automático 24h antes da consulta.",
          "Medir taxa de redução de chamadas evitáveis nas próximas 2 semanas.",
        ],
      },
      estimativa_roi: {
        horas_recuperaveis_mes: 80,
        valor_estimado_mensal: "R$ 8.000 a R$ 14.000",
        tempo_payback: "2 a 3 meses",
      },
      proximo_passo_recomendado: {
        abordagem: "consultoria_pontual",
        justificativa:
          "Vocês têm processo claro e equipe capaz, mas falta camada técnica para construir as integrações. 4-6 semanas de implementação resolve o gargalo principal e deixa o time autônomo.",
      },
      alerta_estrategico:
        "Cuidado para não automatizar a recepção de forma fria. Saúde é serviço relacional — IA mal calibrada vai transferir ineficiência para insatisfação. Cada fluxo precisa de fallback humano em <30s.",
    },
  },
  {
    slug: "agencias-marketing-em-crescimento",
    title: "Diagnóstico anonimizado: agência de marketing com 12 pessoas",
    metaDescription:
      "Exemplo real anonimizado de diagnóstico para agência de marketing em crescimento. Onde automatizar antes de contratar mais.",
    leadProfile:
      "Agência de performance com 12 pessoas, 25 clientes ativos. Crescimento de 40% no último ano, equipe vivendo apagando incêndio.",
    publishedAt: "2026-04-03",
    analysis: {
      diagnostico_resumido:
        "Agência clássica em ponto de inflexão: cresceu rápido, processos não acompanharam, e cada novo cliente custa mais energia que o anterior. Sem automação, a próxima contratação é uma pessoa — quando deveria ser um sistema.",
      tres_oportunidades: [
        {
          titulo: "Geração automatizada de relatórios para clientes",
          descricao:
            "Hoje o time gasta 15-20h/semana compilando relatórios. Automação puxa dados de Meta Ads, Google Ads e GA4, formata em template padronizado e envia automaticamente toda segunda.",
          impacto_estimado: "20h/semana recuperadas",
          complexidade: "média",
          ferramentas_sugeridas: ["n8n", "Google Sheets API", "Looker Studio"],
        },
        {
          titulo: "Onboarding automatizado de novo cliente",
          descricao:
            "Da assinatura do contrato até o primeiro post: 47 passos manuais hoje. Automação reduz pra ~5 pontos de atenção humana e elimina 3 dias do tempo médio de ramp-up.",
          impacto_estimado: "redução de 60% no tempo de onboarding",
          complexidade: "média",
          ferramentas_sugeridas: ["n8n", "Notion API", "Slack API"],
        },
        {
          titulo: "Aprovação de criativos por IA + humano",
          descricao:
            "Pre-screening de criativos com IA verificando consistência de marca, política de plataformas e copy. Humano só revisa o que passou. Acelera ciclo de aprovação interno em 3-4x.",
          impacto_estimado: "10h/semana de coordenadores",
          complexidade: "alta",
          ferramentas_sugeridas: ["Claude Vision", "n8n", "Custom workflow"],
        },
      ],
      quick_win: {
        titulo: "Template + automação básica de relatório semanal (1 semana)",
        passo_a_passo: [
          "Padronizar 1 template de relatório que sirva para 80% dos clientes.",
          "Conectar Looker Studio a uma fonte de dados unificada.",
          "Criar 1 link único por cliente que sempre mostra dados atualizados.",
          "Substituir o relatório manual por esse link nas próximas 2 semanas.",
          "Iterar com feedback dos clientes antes de automatizar mais coisas.",
        ],
      },
      estimativa_roi: {
        horas_recuperaveis_mes: 120,
        valor_estimado_mensal: "R$ 12.000 a R$ 24.000",
        tempo_payback: "1 a 2 meses",
      },
      proximo_passo_recomendado: {
        abordagem: "parceria_continua",
        justificativa:
          "Volume e ritmo de mudança da agência justifica parceria contínua: cada cliente novo gera oportunidade de automação, e o setor muda rápido demais para projeto pontual sustentar valor a longo prazo.",
      },
      alerta_estrategico:
        "A tentação vai ser automatizar tudo de uma vez. Não. Comece pelo relatório (visível pro cliente, ROI claro) — o resto naturalmente segue. Big-bang em agência só atrasa entrega.",
    },
  },
  {
    slug: "ecommerces-faturando-100k-mes",
    title:
      "Diagnóstico anonimizado: e-commerce faturando R$ 100k/mês em produtos físicos",
    metaDescription:
      "Exemplo real anonimizado de diagnóstico para e-commerce de R$100k/mês. Onde automatizar para crescer sem dobrar a operação.",
    leadProfile:
      "E-commerce de moda feminina, R$ 100k/mês recorrentes, 6 pessoas no time. Operação 100% nacional, sem foco em internacional.",
    publishedAt: "2026-03-25",
    analysis: {
      diagnostico_resumido:
        "Operação madura no produto, amadora no back-office: vendas crescem mas o atendimento pós-venda, devoluções e gestão de estoque ainda dependem de planilhas manuais. É o momento exato pra profissionalizar antes do próximo salto.",
      tres_oportunidades: [
        {
          titulo: "Atendimento pós-venda com IA + humano",
          descricao:
            "Bot resolve 70% das dúvidas (status do pedido, prazo, troca, tamanho) e escala apenas casos sensíveis. Reduz tempo médio de resposta de 4h para <5min nas dúvidas operacionais.",
          impacto_estimado: "70% das tickets resolvidas sem humano",
          complexidade: "média",
          ferramentas_sugeridas: ["Claude", "n8n", "API da plataforma de e-commerce"],
        },
        {
          titulo: "Reposição inteligente de estoque",
          descricao:
            "Análise diária de venda + sazonalidade + lead time do fornecedor sugere o que repor e quando. Reduz tanto stock-out quanto capital travado em estoque parado.",
          impacto_estimado: "redução de 30% em capital travado",
          complexidade: "alta",
          ferramentas_sugeridas: [
            "Python + pandas",
            "Supabase",
            "Integração com ERP",
          ],
        },
        {
          titulo: "Recuperação automatizada de carrinho abandonado",
          descricao:
            "Sequência de 3 mensagens (e-mail + WhatsApp + retargeting) personalizada por categoria de produto e ticket. Recupera 8-12% do carrinho perdido — receita pura.",
          impacto_estimado: "10% de recuperação de carrinho",
          complexidade: "baixa",
          ferramentas_sugeridas: ["Klaviyo", "n8n", "WhatsApp Business API"],
        },
      ],
      quick_win: {
        titulo: "Sequência de e-mail automatizada de carrinho abandonado (1 semana)",
        passo_a_passo: [
          "Definir gatilho exato (carrinho abandonado >2h).",
          "Escrever 3 e-mails: o primeiro útil, o segundo emocional, o terceiro com incentivo.",
          "Configurar no Klaviyo (ou ferramenta equivalente).",
          "Ativar para 100% dos abandonos a partir da próxima semana.",
          "Medir conversão e iterar copy nas semanas seguintes.",
        ],
      },
      estimativa_roi: {
        horas_recuperaveis_mes: 60,
        valor_estimado_mensal: "R$ 6.000 a R$ 15.000 (operação) + 8-12% receita extra",
        tempo_payback: "1 mês",
      },
      proximo_passo_recomendado: {
        abordagem: "consultoria_pontual",
        justificativa:
          "Time tem domínio do produto e da operação manual. Falta camada de automação. 6-8 semanas de implementação cobrindo as 3 oportunidades já mudam o patamar da operação.",
      },
      alerta_estrategico:
        "Cuidado para não confundir 'automatizar atendimento' com 'cortar atendimento humano'. E-commerce de moda vive de relacionamento. IA bem feita aumenta a banda do humano — não substitui.",
    },
  },
];

export const examplesBySlug = Object.fromEntries(
  examples.map((e) => [e.slug, e]),
) as Record<string, DiagnosisExample>;
