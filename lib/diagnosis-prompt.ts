import type { DiagnosisAnswers } from "@/types/diagnosis";
import {
  COMPANY_TYPES,
  INDUSTRIES,
  PAIN_AREAS,
  TECH_MATURITY,
  HOURS_WEEKLY,
  AUTOMATION_HISTORY,
  MAIN_GOALS,
} from "@/lib/diagnosis-questions";

function labelFromOptions<T extends { value: string; label: string }>(
  options: readonly T[],
  value: string,
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

export function describeAnswers(answers: DiagnosisAnswers): {
  company: string;
  industry: string;
  pains: string;
  maturity: string;
  hours: string;
  history: string;
  goal: string;
} {
  return {
    company: labelFromOptions(COMPANY_TYPES, answers.q1_company_type),
    industry:
      answers.q2_industry === "other" && answers.q2_industry_other
        ? answers.q2_industry_other
        : labelFromOptions(INDUSTRIES, answers.q2_industry),
    pains: answers.q3_pain_areas
      .map((p) => labelFromOptions(PAIN_AREAS, p))
      .join("; "),
    maturity: labelFromOptions(TECH_MATURITY, answers.q4_tech_maturity),
    hours: labelFromOptions(HOURS_WEEKLY, answers.q5_hours_weekly),
    history: labelFromOptions(AUTOMATION_HISTORY, answers.q6_automation_history),
    goal: labelFromOptions(MAIN_GOALS, answers.q7_main_goal),
  };
}

export function buildDiagnosisPrompt(answers: DiagnosisAnswers): string {
  const d = describeAnswers(answers);

  return `Você é um consultor sênior em automação de operações e IA, com 10+ anos de experiência ajudando empresas brasileiras a profissionalizarem sua operação.

CONTEXTO:
Uma pessoa acabou de fazer um diagnóstico no site de Levi Lael (engenheiro de operações com IA). Você deve gerar uma análise personalizada baseada nas respostas dela.

RESPOSTAS DO DIAGNÓSTICO:
- Tipo de empresa: ${d.company}
- Setor: ${d.industry}
- Áreas de maior consumo de tempo: ${d.pains}
- Maturidade tecnológica: ${d.maturity}
- Horas/semana em tarefas automatizáveis: ${d.hours}
- Histórico com automação: ${d.history}
- Objetivo principal: ${d.goal}

INSTRUÇÕES:
Gere uma análise estruturada nos campos abaixo. Seja específico, técnico mas acessível, e SEMPRE conecte sua análise ao SETOR e ao OBJETIVO declarado.

NUNCA seja genérico. Se a pessoa é de uma clínica, fale como consultor de clínicas. Se é de e-commerce, fale como consultor de e-commerce.

Retorne EXCLUSIVAMENTE um JSON válido no seguinte formato:

{
  "diagnostico_resumido": "1-2 frases que capturam a situação atual com empatia e precisão",
  "tres_oportunidades": [
    {
      "titulo": "string",
      "descricao": "2-3 frases descrevendo a oportunidade específica para o setor/contexto",
      "impacto_estimado": "string (ex: 'até 12h/semana recuperadas')",
      "complexidade": "baixa | média | alta",
      "ferramentas_sugeridas": ["array de ferramentas específicas"]
    }
  ],
  "quick_win": {
    "titulo": "Algo que a pessoa pode implementar em 1 semana, mesmo sem contratar ninguém",
    "passo_a_passo": ["array de 3-5 passos"]
  },
  "estimativa_roi": {
    "horas_recuperaveis_mes": "número estimado",
    "valor_estimado_mensal": "estimativa em R$ baseada em hora/funcionário média do setor",
    "tempo_payback": "string (ex: '2-4 meses')"
  },
  "proximo_passo_recomendado": {
    "abordagem": "diy | consultoria_pontual | parceria_continua",
    "justificativa": "1-2 frases explicando por que essa é a melhor abordagem para o caso específico"
  },
  "alerta_estrategico": "1 alerta importante que a pessoa precisa ouvir mesmo que não goste — algo contrarian que mostre profundidade de análise"
}

REGRAS:
1. NÃO seja vendedor. Seja consultor.
2. Se o caso não justifica automação ainda, fale isso.
3. Use português brasileiro técnico-didático.
4. Não use jargão sem explicar.
5. O "alerta_estrategico" é fundamental: é o que faz a análise parecer GENUÍNA, não automatizada.
6. Sempre retorne 3 oportunidades exatas, em ordem de prioridade.`;
}
