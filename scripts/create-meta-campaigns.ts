/**
 * Cria a campanha do funil diagnóstico na Meta Ads via Marketing API.
 *
 * Estrutura (decisão de marketing pra budget baixo de founder):
 *   1 campanha (OUTCOME_LEADS) → 1 conjunto (público que já converteu) →
 *   2 anúncios (criativo 4 → /sinais-automatizar, criativo 6 → /arrumar-ou-analisar).
 * Um conjunto só com 2 anúncios deixa a Meta otimizar a entrega entre os
 * criativos sem partir o orçamento/aprendizado — melhor pra comparar criativo
 * a CPL baixo do que 2 conjuntos (ABO) que dividem o aprendizado.
 *
 * SEGURANÇA:
 *   - DRY-RUN por padrão: só imprime o que criaria. Passe CONFIRM=1 pra criar.
 *   - Cria TUDO em PAUSED — você revisa no Ads Manager e ativa na mão. Nunca
 *     sobe gasto sozinho.
 *   - RESUMÍVEL: reusa campanha/conjunto/anúncio que já existem (por nome) e cria
 *     só o que falta. Pode rodar de novo sem duplicar.
 *
 * PRÉ-REQUISITO: o APP Meta do token precisa estar em modo PÚBLICO/Live (não
 * Development), senão a criação do creative falha (subcode 1885183). Vira em
 * developers.facebook.com → seu app → toggle "Em desenvolvimento" → Live
 * (pode pedir URL de política de privacidade — tem em /privacy).
 *
 * Uso:
 *   # 1) dry-run (não cria nada, só mostra o plano):
 *   META_ACCESS_TOKEN=xxx META_AD_ACCOUNT_ID=act_xxx META_PAGE_ID=xxx \
 *     META_PIXEL_ID=xxx pnpm tsx scripts/create-meta-campaigns.ts
 *   # 2) criar de verdade (tudo PAUSED):
 *   CONFIRM=1 META_ACCESS_TOKEN=xxx META_AD_ACCOUNT_ID=act_xxx META_PAGE_ID=xxx \
 *     META_PIXEL_ID=xxx pnpm tsx scripts/create-meta-campaigns.ts
 *
 * Token precisa de escopo ads_management (o mesmo do analyze-meta-campaigns.ts
 * basta se tiver gestão, não só leitura).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const API_VERSION = "v20.0";
const BASE = `https://graph.facebook.com/${API_VERSION}`;

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID; // act_xxx
const PAGE_ID = process.env.META_PAGE_ID; // página do Facebook que veicula
const PIXEL_ID = process.env.META_PIXEL_ID;
const CONFIRM = process.env.CONFIRM === "1";

if (!ACCESS_TOKEN || !AD_ACCOUNT_ID || !PAGE_ID) {
  console.error(
    "Faltam env vars. Rode:\n  META_ACCESS_TOKEN=... META_AD_ACCOUNT_ID=act_... META_PAGE_ID=... META_PIXEL_ID=... pnpm tsx scripts/create-meta-campaigns.ts\n(adicione CONFIRM=1 pra criar de verdade; sem isso é dry-run)",
  );
  process.exit(1);
}

// dd/mm pro nome no teu padrão [dd/mm][leads][accountants]
const now = new Date();
const dd = String(now.getDate()).padStart(2, "0");
const mm = String(now.getMonth() + 1).padStart(2, "0");

const CONFIG = {
  siteUrl: process.env.SITE_URL ?? "https://levilael.com.br",
  campaignName: process.env.CAMPAIGN_NAME ?? `[${dd}/${mm}][leads][accountants-diag]`,
  // R$/dia no conjunto. Meta espera centavos.
  dailyBudgetBRL: Number(process.env.DAILY_BUDGET_BRL ?? 30),
  // OFFSITE_CONVERSIONS otimiza pro evento Lead (diagnóstico dispara Lead warm).
  // Em volume baixo (<~50 leads/semana) considere LANDING_PAGE_VIEWS no começo
  // pra sair do aprendizado, e troque pra conversão quando tiver volume.
  optimizationGoal: process.env.OPTIMIZATION_GOAL ?? "OFFSITE_CONVERSIONS",
  ctaType: "LEARN_MORE",
  ads: [
    {
      key: "criativo-4-checklist",
      adName: "criativo-4 _ checklist 5 sinais",
      image: "04 _ checklist 5 sinais.png",
      lpPath: "/sinais-automatizar",
      message:
        "Sua equipe organiza documento mais do que analisa? Cliente pergunta o que já mandou? Se 3 dos 5 sinais batem, o trabalho manual já está custando caro. Faça o diagnóstico gratuito em 2 minutos e veja onde dá pra automatizar primeiro.",
      headline: "5 sinais de que tá na hora de automatizar",
      description: "Diagnóstico gratuito em 2 min · sem ligação de vendedor",
    },
    {
      key: "criativo-6-socio",
      adName: "criativo-6 _ arrumar vs analisar",
      image: "06 _ pergunta _ CTA-first.png",
      lpPath: "/arrumar-ou-analisar",
      message:
        "Sócio: quanto da sua equipe está arrumando documento — e quanto está analisando? Se você não sabe responder, já é a resposta. Descubra o número com um diagnóstico gratuito de 2 minutos.",
      headline: "Sua equipe está arrumando ou analisando?",
      description: "Diagnóstico gratuito em 2 min · sem ligação de vendedor",
    },
  ],
  // Público de fallback (BR + contabilidade). O script tenta CLONAR a segmentação
  // do teu conjunto que já converteu (campanha [..][leads][accountants]); se não
  // achar, usa este. AJUSTE pra bater com o que você já validou.
  targetingFallback: {
    geo_locations: { countries: ["BR"] },
    age_min: 25,
    age_max: 64,
    flexible_spec: [
      {
        interests: [
          { id: "6003332747621", name: "Accounting" },
          { id: "6003225065782", name: "Small business" },
        ],
      },
    ],
    publisher_platforms: ["facebook", "instagram"],
  } as Record<string, unknown>,
} as const;

// -----------------------------------------------------------------------------
// HTTP helpers
// -----------------------------------------------------------------------------
type GraphError = { error?: { message: string; type: string; code: number } };

async function get<T>(path: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams({ ...params, access_token: ACCESS_TOKEN! });
  const res = await fetch(`${BASE}${path}?${qs.toString()}`);
  const json = (await res.json()) as T & GraphError;
  if (json.error) {
    throw new Error(`GET ${path}: ${JSON.stringify(json.error)}`);
  }
  return json;
}

async function post<T>(path: string, params: Record<string, string>): Promise<T> {
  const body = new URLSearchParams({ ...params, access_token: ACCESS_TOKEN! });
  const res = await fetch(`${BASE}${path}`, { method: "POST", body });
  const json = (await res.json()) as T & GraphError;
  if (json.error) {
    throw new Error(`POST ${path}: ${JSON.stringify(json.error)}`);
  }
  return json;
}

// -----------------------------------------------------------------------------
// Passos
// -----------------------------------------------------------------------------
/** Acha um objeto por nome numa edge (campaigns/adsets/ads). Resumível: reusa o
 *  que já existe em vez de duplicar (chave da idempotência do re-run). */
async function findByName(edge: string, name: string): Promise<string | null> {
  const { data } = await get<{ data: { id: string; name: string }[] }>(edge, {
    fields: "id,name",
    limit: "200",
  });
  return data?.find((x) => x.name === name)?.id ?? null;
}

/** Tenta reusar a segmentação do conjunto que já converteu; senão, fallback. */
async function resolveTargeting(): Promise<Record<string, unknown>> {
  try {
    const { data: campaigns } = await get<{
      data: { id: string; name: string; status: string }[];
    }>(`/${AD_ACCOUNT_ID}/campaigns`, { fields: "id,name,status", limit: "200" });
    const proven = campaigns?.find((c) => /\[leads\]\[accountants\]/.test(c.name));
    if (!proven) return CONFIG.targetingFallback;
    const { data: adsets } = await get<{
      data: { id: string; targeting?: Record<string, unknown>; status: string }[];
    }>(`/${proven.id}/adsets`, { fields: "id,targeting,status", limit: "50" });
    const withTargeting = adsets?.find((a) => a.targeting);
    if (withTargeting?.targeting) {
      console.log(`  ↳ clonando segmentação do conjunto provado (campanha ${proven.name})`);
      return withTargeting.targeting;
    }
  } catch (err) {
    console.warn(
      `  ↳ não consegui clonar segmentação (${err instanceof Error ? err.message : err}); usando fallback`,
    );
  }
  return CONFIG.targetingFallback;
}

async function uploadImage(filename: string): Promise<string> {
  const bytes = readFileSync(join(process.cwd(), filename)).toString("base64");
  const json = await post<{ images: Record<string, { hash: string }> }>(
    `/${AD_ACCOUNT_ID}/adimages`,
    { bytes },
  );
  const first = Object.values(json.images)[0];
  if (!first?.hash) throw new Error(`upload de ${filename} não retornou hash`);
  return first.hash;
}

function lpUrl(lpPath: string, key: string): string {
  const qs = new URLSearchParams({
    utm_source: "meta",
    utm_medium: "paid",
    utm_campaign: CONFIG.campaignName,
    utm_content: key,
  });
  return `${CONFIG.siteUrl}${lpPath}?${qs.toString()}`;
}

async function main() {
  console.log(`${CONFIRM ? "🚀 CRIANDO (PAUSED)" : "🧪 DRY-RUN (nada será criado)"} — ${CONFIG.campaignName}`);
  console.log(`Conta: ${AD_ACCOUNT_ID} · Página: ${PAGE_ID} · Pixel: ${PIXEL_ID ?? "—"}`);
  console.log(`Budget: R$ ${CONFIG.dailyBudgetBRL}/dia · Otimização: ${CONFIG.optimizationGoal}`);
  console.log("");

  const targeting = await resolveTargeting();

  for (const ad of CONFIG.ads) {
    console.log(`• ${ad.adName}`);
    console.log(`    imagem: ${ad.image}`);
    console.log(`    destino: ${lpUrl(ad.lpPath, ad.key)}`);
    console.log(`    headline: ${ad.headline}`);
  }
  console.log("");
  console.log(`segmentação: ${JSON.stringify(targeting).slice(0, 200)}…`);
  console.log("");

  if (!CONFIRM) {
    console.log("Dry-run ok. Pra criar tudo (PAUSED): CONFIRM=1 ... pnpm tsx scripts/create-meta-campaigns.ts");
    return;
  }

  if (!PIXEL_ID && CONFIG.optimizationGoal === "OFFSITE_CONVERSIONS") {
    throw new Error("OFFSITE_CONVERSIONS exige META_PIXEL_ID. Configure o pixel ou use OPTIMIZATION_GOAL=LANDING_PAGE_VIEWS.");
  }

  const ADSET_NAME = "[conjunto] accountants · diagnóstico";

  // 1. Campanha (PAUSED) — reusa se já existe (re-run resumível)
  let campaignId = await findByName(`/${AD_ACCOUNT_ID}/campaigns`, CONFIG.campaignName);
  if (campaignId) {
    console.log(`↺ campanha já existe ${campaignId}`);
  } else {
    const c = await post<{ id: string }>(`/${AD_ACCOUNT_ID}/campaigns`, {
      name: CONFIG.campaignName,
      objective: "OUTCOME_LEADS",
      status: "PAUSED",
      special_ad_categories: JSON.stringify([]),
      // Orçamento é no conjunto (não CBO) → a conta exige declarar o sharing.
      // false = cada conjunto com seu orçamento (previsível com 1 conjunto).
      is_adset_budget_sharing_enabled: "false",
    });
    campaignId = c.id;
    console.log(`✓ campanha ${campaignId}`);
  }

  // 2. Conjunto (PAUSED) — reusa se já existe
  let adsetId = await findByName(`/${campaignId}/adsets`, ADSET_NAME);
  if (adsetId) {
    console.log(`↺ conjunto já existe ${adsetId}`);
  } else {
    const adsetParams: Record<string, string> = {
      name: ADSET_NAME,
      campaign_id: campaignId,
      status: "PAUSED",
      daily_budget: String(Math.round(CONFIG.dailyBudgetBRL * 100)),
      billing_event: "IMPRESSIONS",
      optimization_goal: CONFIG.optimizationGoal,
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      destination_type: "WEBSITE",
      targeting: JSON.stringify(targeting),
    };
    if (CONFIG.optimizationGoal === "OFFSITE_CONVERSIONS" && PIXEL_ID) {
      adsetParams.promoted_object = JSON.stringify({
        pixel_id: PIXEL_ID,
        custom_event_type: "LEAD",
      });
    }
    const a = await post<{ id: string }>(`/${AD_ACCOUNT_ID}/adsets`, adsetParams);
    adsetId = a.id;
    console.log(`✓ conjunto ${adsetId}`);
  }

  // 3. Por anúncio: pula se já existe; senão upload imagem → creative → ad (PAUSED)
  for (const ad of CONFIG.ads) {
    const existing = await findByName(`/${adsetId}/ads`, ad.adName);
    if (existing) {
      console.log(`↺ anúncio já existe (${ad.key}) ${existing}`);
      continue;
    }
    const link = lpUrl(ad.lpPath, ad.key);
    const imageHash = await uploadImage(ad.image);
    const creative = await post<{ id: string }>(`/${AD_ACCOUNT_ID}/adcreatives`, {
      name: `creative · ${ad.key}`,
      object_story_spec: JSON.stringify({
        page_id: PAGE_ID,
        link_data: {
          image_hash: imageHash,
          link,
          message: ad.message,
          name: ad.headline,
          description: ad.description,
          call_to_action: { type: CONFIG.ctaType, value: { link } },
        },
      }),
    });
    const created = await post<{ id: string }>(`/${AD_ACCOUNT_ID}/ads`, {
      name: ad.adName,
      adset_id: adsetId,
      status: "PAUSED",
      creative: JSON.stringify({ creative_id: creative.id }),
    });
    console.log(`✓ anúncio ${created.id} (${ad.key})`);
  }

  console.log("");
  console.log("Pronto (tudo PAUSED). Revise no Ads Manager (criativo, público, budget) e ATIVE na mão.");
}

main().catch((err) => {
  console.error("Erro:", err instanceof Error ? err.message : err);
  process.exit(1);
});
