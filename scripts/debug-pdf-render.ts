import { writeFileSync } from "node:fs";
import { renderDiagnosisPdf } from "@/lib/pdf/diagnosis-report";
import type { DiagnosisAnalysis } from "@/types/diagnosis";

const analysis: DiagnosisAnalysis = {
  diagnostico_resumido:
    "Sua operação tem 3 gargalos óbvios em atendimento de leads e cobrança. O custo do tempo perdido hoje é maior do que o investimento pra automatizar.",
  tres_oportunidades: [
    {
      titulo: "Automação de qualificação de leads no WhatsApp",
      descricao:
        "Hoje você atende manualmente todo lead que chega — incluindo os fora do perfil. Um bot de triagem libera 8-12h/sem.",
      impacto_estimado: "8-12h/sem economizadas",
      complexidade: "média",
      ferramentas_sugeridas: ["Evolution API", "n8n", "Claude API"],
      prazo_implementacao: "1-2 semanas",
    },
    {
      titulo: "Conciliação automática de boletos pagos",
      descricao:
        "Você reconcilia recebimentos manualmente — erros comuns e atraso na baixa. Webhook do banco + script de match resolve.",
      impacto_estimado: "4-6h/sem economizadas",
      complexidade: "baixa",
      ferramentas_sugeridas: ["Webhook Inter/Asaas", "Supabase"],
      prazo_implementacao: "1 semana",
    },
    {
      titulo: "Geração de propostas via template + IA",
      descricao:
        "Cada proposta hoje leva 1h+. Template editor com IA pré-preenchida cai pra 10 min.",
      impacto_estimado: "5h/sem economizadas",
      complexidade: "média",
      ferramentas_sugeridas: ["Notion API", "Claude API"],
      prazo_implementacao: "2 semanas",
    },
  ],
  quick_win: {
    titulo: "Bot de triagem básico no WhatsApp em 5 dias",
    passo_a_passo: [
      "Mapear 3 perguntas de qualificação obrigatórias",
      "Configurar Evolution API no servidor",
      "Conectar n8n com fluxo condicional",
      "Testar com 10 leads reais por 2 dias",
      "Ajustar copy e ligar pra produção",
    ],
    ferramentas_necessarias: ["Evolution API", "n8n", "VPS Hetzner"],
  },
  estimativa_roi: {
    horas_recuperaveis_mes: "60-80h",
    valor_estimado_mensal: "R$ 4.500 - R$ 6.500",
    tempo_payback: "1-2 meses",
    disclaimer:
      "Estimativa baseada em hora-equivalente de R$ 75. Varia com o custo real da sua operação.",
    metodologia: "Hora-equivalente × volume de tarefas × economia esperada",
  },
  proximo_passo_recomendado: {
    abordagem: "consultoria_pontual",
    justificativa:
      "Você tem stack mas não tem tempo. Uma sprint de 2 semanas entrega o quick win + a fundação pros outros dois.",
  },
  alerta_estrategico:
    "Concorrentes diretos já usam IA pra qualificação. Cada mês sem automação = leads que vão pra eles primeiro.",
};

async function main() {
  const buf = await renderDiagnosisPdf({
    name: "Maria Silva",
    analysis,
    generatedAt: new Date(),
    reportUrl: "https://levilael.com.br/diagnosis/result/test-abc123",
  });
  const path = "/tmp/diagnosis-test.pdf";
  writeFileSync(path, buf);
  console.log(`OK — ${buf.length} bytes → ${path}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
