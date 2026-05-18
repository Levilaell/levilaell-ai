/**
 * Análise pontual de campanha Meta Ads via Marketing API.
 *
 * Uso:
 *   META_ACCESS_TOKEN=xxx META_AD_ACCOUNT_ID=act_xxx META_PIXEL_ID=xxx \
 *     pnpm tsx scripts/analyze-meta-campaigns.ts
 *
 * Filtra a campanha "[15/05][leads][accountants]" (ou primeira ACTIVE se única),
 * extrai métricas em 3 níveis (campanha, conjuntos, anúncios), salva JSON raw
 * em scripts/debug/ e imprime relatório markdown no stdout.
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const API_VERSION = "v20.0";
const TARGET_CAMPAIGN_NAME = "[15/05][leads][accountants]";

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID;
const PIXEL_ID = process.env.META_PIXEL_ID;

if (!ACCESS_TOKEN || !AD_ACCOUNT_ID) {
  console.error(
    "Faltam env vars. Rode: META_ACCESS_TOKEN=... META_AD_ACCOUNT_ID=act_... pnpm tsx scripts/analyze-meta-campaigns.ts"
  );
  process.exit(1);
}

type Action = { action_type: string; value: string };
type CostPerAction = { action_type: string; value: string };

type Insight = {
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  reach?: string;
  frequency?: string;
  actions?: Action[];
  action_values?: Action[];
  cost_per_action_type?: CostPerAction[];
  date_start?: string;
  date_stop?: string;
  campaign_id?: string;
  adset_id?: string;
  ad_id?: string;
};

type Campaign = {
  id: string;
  name: string;
  status: string;
  objective?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  created_time?: string;
  start_time?: string;
  stop_time?: string;
};

type AdSet = {
  id: string;
  name: string;
  status: string;
  daily_budget?: string;
  optimization_goal?: string;
  targeting?: Record<string, unknown>;
};

type Ad = {
  id: string;
  name: string;
  status: string;
  adset_id?: string;
  creative?: { id: string };
};

type ApiResponse<T> = {
  data?: T[];
  paging?: { cursors?: { before: string; after: string }; next?: string };
  error?: { message: string; type: string; code: number };
};

const BASE = `https://graph.facebook.com/${API_VERSION}`;

async function fetchAll<T>(url: string): Promise<T[]> {
  const results: T[] = [];
  let nextUrl: string | undefined = url;
  while (nextUrl) {
    const res = await fetch(nextUrl);
    const json = (await res.json()) as ApiResponse<T>;
    if (json.error) {
      throw new Error(
        `Meta API error: ${json.error.message} (type=${json.error.type}, code=${json.error.code})\nURL: ${nextUrl}`
      );
    }
    if (json.data) results.push(...json.data);
    nextUrl = json.paging?.next;
  }
  return results;
}

function buildUrl(path: string, params: Record<string, string>): string {
  const qs = new URLSearchParams({ ...params, access_token: ACCESS_TOKEN! });
  return `${BASE}${path}?${qs.toString()}`;
}

const INSIGHT_FIELDS = [
  "campaign_id",
  "adset_id",
  "ad_id",
  "spend",
  "impressions",
  "clicks",
  "ctr",
  "cpc",
  "cpm",
  "reach",
  "frequency",
  "actions",
  "action_values",
  "cost_per_action_type",
].join(",");

function getActionValue(insight: Insight | undefined, actionType: string): number {
  if (!insight?.actions) return 0;
  const found = insight.actions.find((a) => a.action_type === actionType);
  return found ? parseFloat(found.value) : 0;
}

function getCostPerAction(insight: Insight | undefined, actionType: string): number {
  if (!insight?.cost_per_action_type) return 0;
  const found = insight.cost_per_action_type.find((a) => a.action_type === actionType);
  return found ? parseFloat(found.value) : 0;
}

function n(v: string | undefined, decimals = 2): string {
  if (v == null || v === "") return "—";
  const num = parseFloat(v);
  if (!Number.isFinite(num)) return "—";
  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function brl(v: string | number | undefined): string {
  if (v == null || v === "") return "—";
  const num = typeof v === "string" ? parseFloat(v) : v;
  if (!Number.isFinite(num) || num === 0) return "R$ 0,00";
  return `R$ ${num.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function pct(v: string | undefined): string {
  if (v == null || v === "") return "—";
  const num = parseFloat(v);
  if (!Number.isFinite(num)) return "—";
  return `${num.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

function int(v: string | undefined): string {
  if (v == null || v === "") return "—";
  const num = parseFloat(v);
  if (!Number.isFinite(num)) return "—";
  return Math.round(num).toLocaleString("pt-BR");
}

function safeDiv(a: number, b: number): number {
  if (!b) return 0;
  return a / b;
}

function daysBetween(iso: string | undefined): number {
  if (!iso) return 0;
  const start = new Date(iso).getTime();
  const now = Date.now();
  return Math.max(1, Math.ceil((now - start) / (1000 * 60 * 60 * 24)));
}

async function main() {
  // 1. Buscar campanhas da conta
  const campaigns = await fetchAll<Campaign>(
    buildUrl(`/${AD_ACCOUNT_ID}/campaigns`, {
      fields:
        "id,name,status,objective,daily_budget,lifetime_budget,created_time,start_time,stop_time",
      limit: "100",
    })
  );

  // Filtrar campanha alvo
  let target = campaigns.find((c) => c.name === TARGET_CAMPAIGN_NAME);
  if (!target) {
    // fallback: única ACTIVE
    const active = campaigns.filter((c) => c.status === "ACTIVE");
    if (active.length === 1) {
      target = active[0];
      console.error(
        `# Aviso: campanha alvo "${TARGET_CAMPAIGN_NAME}" não encontrada. Usando única ACTIVE: ${target.name}`
      );
    } else {
      console.error(`Campanhas encontradas:`);
      campaigns.forEach((c) => console.error(`  - ${c.name} (${c.status})`));
      throw new Error(
        `Campanha alvo "${TARGET_CAMPAIGN_NAME}" não encontrada e ${active.length} ACTIVE existem`
      );
    }
  }

  // 2. Em paralelo: insights nos 3 níveis + adsets + ads
  const [campaignInsightsArr, adsetInsightsArr, adInsightsArr, adsets, ads] =
    await Promise.all([
      fetchAll<Insight>(
        buildUrl(`/${target.id}/insights`, {
          fields: INSIGHT_FIELDS,
          date_preset: "maximum",
          level: "campaign",
        })
      ),
      fetchAll<Insight>(
        buildUrl(`/${target.id}/insights`, {
          fields: INSIGHT_FIELDS,
          date_preset: "maximum",
          level: "adset",
        })
      ),
      fetchAll<Insight>(
        buildUrl(`/${target.id}/insights`, {
          fields: INSIGHT_FIELDS,
          date_preset: "maximum",
          level: "ad",
        })
      ),
      fetchAll<AdSet>(
        buildUrl(`/${target.id}/adsets`, {
          fields: "id,name,status,daily_budget,targeting,optimization_goal",
          limit: "100",
        })
      ),
      fetchAll<Ad>(
        buildUrl(`/${target.id}/ads`, {
          fields: "id,name,status,adset_id,creative",
          limit: "100",
        })
      ),
    ]);

  const campaignInsight = campaignInsightsArr[0];
  const adsetInsightById = new Map(adsetInsightsArr.map((i) => [i.adset_id!, i]));
  const adInsightById = new Map(adInsightsArr.map((i) => [i.ad_id!, i]));

  // 3. Salvar JSON raw
  const debugDir = join(process.cwd(), "scripts", "debug");
  if (!existsSync(debugDir)) mkdirSync(debugDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const debugPath = join(debugDir, `meta-raw-${ts}.json`);
  writeFileSync(
    debugPath,
    JSON.stringify(
      {
        fetched_at: new Date().toISOString(),
        api_version: API_VERSION,
        ad_account_id: AD_ACCOUNT_ID,
        pixel_id: PIXEL_ID ?? null,
        campaign: target,
        all_campaigns_in_account: campaigns,
        campaign_insights: campaignInsightsArr,
        adset_insights: adsetInsightsArr,
        ad_insights: adInsightsArr,
        adsets,
        ads,
      },
      null,
      2
    )
  );

  // 4. Render markdown
  const out: string[] = [];
  const p = (s: string = "") => out.push(s);

  const campaignSpend = parseFloat(campaignInsight?.spend ?? "0");
  const campaignLeads = getActionValue(campaignInsight, "lead");
  // Detecta custom conversion de "call agendada" — Levi tem um custom event que
  // termina em "_calls" (ex: offsite_lead_add_20_s_calls). Cai pro lead se não achar.
  const callActionType = (() => {
    const candidates = (campaignInsight?.actions ?? []).map((a) => a.action_type);
    const customCall = candidates.find(
      (t) =>
        /(_call|schedule|agenda|booking)/i.test(t) &&
        !t.includes("page_engagement")
    );
    return customCall ?? "lead";
  })();
  const campaignSchedules = getActionValue(campaignInsight, callActionType);
  const dailyBudget = target.daily_budget
    ? parseFloat(target.daily_budget) / 100
    : undefined;
  const daysRunning = daysBetween(target.start_time ?? target.created_time);

  p("# 📊 Análise Meta Ads — Levi Lael");
  p(`*Período: desde início da campanha até agora (${new Date().toLocaleString("pt-BR")})*`);
  p("");
  p("## 🎯 Campanha");
  p(`- **Nome:** ${target.name}`);
  p(`- **ID:** ${target.id}`);
  p(`- **Status:** ${target.status}`);
  p(`- **Objetivo:** ${target.objective ?? "—"}`);
  p(
    `- **Budget:** ${
      dailyBudget != null ? `${brl(dailyBudget)}/dia` : target.lifetime_budget ? `${brl(parseFloat(target.lifetime_budget) / 100)} total` : "—"
    }`
  );
  p(`- **Início:** ${target.start_time ? new Date(target.start_time).toLocaleString("pt-BR") : "—"}`);
  p(`- **Dias rodando:** ${daysRunning}`);
  p("");
  p(`> ⚙️ **Evento usado como "call agendada":** \`${callActionType}\` ${
    callActionType === "lead" ? "(fallback — nenhum custom de call detectado)" : "(auto-detectado)"
  }`);
  p("");
  p("### Performance agregada");
  p("| Métrica | Valor |");
  p("|---------|-------|");
  p(`| Gasto | ${brl(campaignSpend)} |`);
  p(`| Impressões | ${int(campaignInsight?.impressions)} |`);
  p(`| Cliques | ${int(campaignInsight?.clicks)} |`);
  p(`| CTR | ${pct(campaignInsight?.ctr)} |`);
  p(`| CPC | ${brl(campaignInsight?.cpc)} |`);
  p(`| CPM | ${brl(campaignInsight?.cpm)} |`);
  p(`| Alcance | ${int(campaignInsight?.reach)} |`);
  p(`| Frequência | ${n(campaignInsight?.frequency)} |`);
  p(`| Leads (Pixel) | ${campaignLeads} |`);
  p(`| Schedule (calls) | ${campaignSchedules} |`);
  p(
    `| Landing page views | ${getActionValue(campaignInsight, "landing_page_view")} |`
  );
  p(`| Link clicks | ${getActionValue(campaignInsight, "link_click")} |`);
  p(`| Custo/Lead | ${brl(safeDiv(campaignSpend, campaignLeads))} |`);
  p(`| Custo/Call | ${brl(safeDiv(campaignSpend, campaignSchedules))} |`);
  p("");
  // Lista todos os action types pra Levi ver eventos customs e validar mapeamento
  p("<details><summary>Todos os eventos disparados (debug)</summary>");
  p("");
  p("| action_type | value |");
  p("|-------------|-------|");
  for (const a of campaignInsight?.actions ?? []) {
    p(`| \`${a.action_type}\` | ${a.value} |`);
  }
  p("");
  p("</details>");
  p("");

  // 5. Conjuntos
  p("## 🎯 Conjuntos (Ad Sets)");
  p("");
  // Ordenar por spend desc
  const adsetsByspend = [...adsets].sort((a, b) => {
    const sa = parseFloat(adsetInsightById.get(a.id)?.spend ?? "0");
    const sb = parseFloat(adsetInsightById.get(b.id)?.spend ?? "0");
    return sb - sa;
  });

  for (const adset of adsetsByspend) {
    const ins = adsetInsightById.get(adset.id);
    const spend = parseFloat(ins?.spend ?? "0");
    const leads = getActionValue(ins, "lead");
    const schedules = getActionValue(ins, callActionType);
    p(`### ${adset.name}`);
    p(`- **ID:** ${adset.id}`);
    p(`- **Status:** ${adset.status}`);
    p(`- **Optimization goal:** ${adset.optimization_goal ?? "—"}`);
    p(
      `- **Daily budget:** ${
        adset.daily_budget ? brl(parseFloat(adset.daily_budget) / 100) : "—"
      }`
    );
    p(`- **Gasto:** ${brl(spend)}`);
    p(`- **Impressões:** ${int(ins?.impressions)}`);
    p(`- **Cliques:** ${int(ins?.clicks)}`);
    p(`- **CTR:** ${pct(ins?.ctr)}`);
    p(`- **CPC:** ${brl(ins?.cpc)}`);
    p(`- **CPM:** ${brl(ins?.cpm)}`);
    p(`- **Alcance:** ${int(ins?.reach)}`);
    p(`- **Frequência:** ${n(ins?.frequency)}`);
    p(`- **Landing page views:** ${getActionValue(ins, "landing_page_view")}`);
    p(`- **Leads (Pixel):** ${leads}`);
    p(`- **Calls agendadas:** ${schedules}`);
    p(`- **Custo/Lead:** ${brl(safeDiv(spend, leads))}`);
    p(`- **Custo/Call:** ${brl(safeDiv(spend, schedules))}`);
    p("");
  }

  // 6. Anúncios — top performers (todos, ordenados por gasto)
  p("## 🎨 Anúncios (todos, ordenados por gasto)");
  p("");
  const adsetNameById = new Map(adsets.map((a) => [a.id, a.name]));
  const adsByspend = [...ads].sort((a, b) => {
    const sa = parseFloat(adInsightById.get(a.id)?.spend ?? "0");
    const sb = parseFloat(adInsightById.get(b.id)?.spend ?? "0");
    return sb - sa;
  });

  p(
    "| Anúncio | Conjunto | Status | Gasto | Impressões | CTR | CPM | Leads | Calls | CPL | CPCall |"
  );
  p(
    "|---------|----------|--------|-------|------------|-----|-----|-------|-------|-----|--------|"
  );
  for (const ad of adsByspend) {
    const ins = adInsightById.get(ad.id);
    const spend = parseFloat(ins?.spend ?? "0");
    const leads = getActionValue(ins, "lead");
    const schedules = getActionValue(ins, callActionType);
    const adsetName = ad.adset_id ? adsetNameById.get(ad.adset_id) ?? "—" : "—";
    p(
      `| ${ad.name} | ${adsetName} | ${ad.status} | ${brl(spend)} | ${int(
        ins?.impressions
      )} | ${pct(ins?.ctr)} | ${brl(ins?.cpm)} | ${leads} | ${schedules} | ${brl(
        safeDiv(spend, leads)
      )} | ${brl(safeDiv(spend, schedules))} |`
    );
  }
  p("");

  // 7. Sinais
  p("## 🚨 Sinais de alerta");
  p("");
  const alerts: string[] = [];

  // anúncios com gasto >R$10 e zero conversão (lead OU schedule)
  for (const ad of ads) {
    const ins = adInsightById.get(ad.id);
    const spend = parseFloat(ins?.spend ?? "0");
    const leads = getActionValue(ins, "lead");
    const schedules = getActionValue(ins, callActionType);
    if (spend > 10 && leads === 0 && schedules === 0) {
      alerts.push(
        `- 🔴 **Anúncio sem conversão:** "${ad.name}" gastou ${brl(spend)} sem leads/calls`
      );
    }
  }

  // conjuntos com CTR < 0.5%
  for (const adset of adsets) {
    const ins = adsetInsightById.get(adset.id);
    const ctr = parseFloat(ins?.ctr ?? "0");
    if (ctr > 0 && ctr < 0.5) {
      alerts.push(
        `- 🟡 **CTR baixo:** conjunto "${adset.name}" tem CTR de ${pct(ins?.ctr)}`
      );
    }
  }

  // conjuntos com frequência > 3
  for (const adset of adsets) {
    const ins = adsetInsightById.get(adset.id);
    const freq = parseFloat(ins?.frequency ?? "0");
    if (freq > 3) {
      alerts.push(
        `- 🟡 **Frequência alta:** conjunto "${adset.name}" com ${n(ins?.frequency)} (saturação)`
      );
    }
  }

  // anúncios com CPM muito acima da média do conjunto
  const adsetCpmMap = new Map<string, number>();
  for (const adset of adsets) {
    const ins = adsetInsightById.get(adset.id);
    const cpm = parseFloat(ins?.cpm ?? "0");
    if (cpm > 0) adsetCpmMap.set(adset.id, cpm);
  }
  for (const ad of ads) {
    if (!ad.adset_id) continue;
    const ins = adInsightById.get(ad.id);
    const adCpm = parseFloat(ins?.cpm ?? "0");
    const adsetCpm = adsetCpmMap.get(ad.adset_id) ?? 0;
    if (adCpm > 0 && adsetCpm > 0 && adCpm > adsetCpm * 1.5) {
      alerts.push(
        `- 🟡 **CPM alto:** anúncio "${ad.name}" com ${brl(adCpm)} vs média do conjunto ${brl(adsetCpm)}`
      );
    }
  }

  if (alerts.length === 0) {
    p("_Nenhum sinal de alerta detectado._");
  } else {
    alerts.forEach((a) => p(a));
  }
  p("");

  // 8. Sinais positivos
  p("## 🟢 Sinais positivos");
  p("");
  const positives: string[] = [];

  // anúncios com CPL < R$30
  for (const ad of ads) {
    const ins = adInsightById.get(ad.id);
    const spend = parseFloat(ins?.spend ?? "0");
    const leads = getActionValue(ins, "lead");
    if (leads > 0) {
      const cpl = spend / leads;
      if (cpl < 30) {
        positives.push(
          `- ✅ **CPL bom:** anúncio "${ad.name}" com ${brl(cpl)} por lead (${leads} leads)`
        );
      }
    }
  }

  // conjuntos com CTR > 1.5%
  for (const adset of adsets) {
    const ins = adsetInsightById.get(adset.id);
    const ctr = parseFloat(ins?.ctr ?? "0");
    if (ctr > 1.5) {
      positives.push(
        `- ✅ **CTR alto:** conjunto "${adset.name}" com ${pct(ins?.ctr)}`
      );
    }
  }

  // anúncios com taxa de conversão (leads/clicks) acima da média
  const avgConvRate = (() => {
    const totalLeads = getActionValue(campaignInsight, "lead");
    const totalClicks = parseFloat(campaignInsight?.clicks ?? "0");
    return safeDiv(totalLeads, totalClicks);
  })();
  for (const ad of ads) {
    const ins = adInsightById.get(ad.id);
    const clicks = parseFloat(ins?.clicks ?? "0");
    const leads = getActionValue(ins, "lead");
    if (clicks > 10 && leads > 0) {
      const rate = leads / clicks;
      if (rate > avgConvRate * 1.5 && avgConvRate > 0) {
        positives.push(
          `- ✅ **Conversão alta:** "${ad.name}" converte ${(rate * 100).toFixed(
            1
          )}% (vs média ${(avgConvRate * 100).toFixed(1)}%)`
        );
      }
    }
  }

  if (positives.length === 0) {
    p("_Nenhum sinal positivo claro ainda — campanha jovem._");
  } else {
    positives.forEach((s) => p(s));
  }
  p("");

  // 9. Resumo executivo
  p("## 📐 Resumo executivo");
  p("");
  if (campaignSchedules >= 4) {
    p(
      `- **4+ calls agendadas em ${daysRunning}d com ${brl(campaignSpend)} gastos** → custo/call de ${brl(
        safeDiv(campaignSpend, campaignSchedules)
      )}. ${
        safeDiv(campaignSpend, campaignSchedules) < 50
          ? "Excelente, deixa correr."
          : safeDiv(campaignSpend, campaignSchedules) < 100
          ? "Razoável, monitorar."
          : "Caro, revisar criativos/segmentação."
      }`
    );
  }
  p(
    `- **Volume ainda baixo** (${daysRunning}d): decisões granulares por anúncio têm baixa significância estatística. Foco em sinais de conjunto.`
  );
  p(`- **Debug JSON salvo em:** \`${debugPath.replace(process.cwd() + "/", "")}\``);
  p("");

  console.log(out.join("\n"));
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
