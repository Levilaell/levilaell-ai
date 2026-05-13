-- =============================================================================
-- 0006_diagnosis_attribution.sql — UTMs + landing_page + referrer em diagnoses
-- =============================================================================
-- Sintoma original: UTMs chegavam em tracking_events (evento lp_viewed) mas
-- se perdiam no fluxo LP → /diagnosis → POST /api/diagnosis/submit. Atribuição
-- de campanha/keyword/anúncio ficava impossível sem JOIN frágil em sessão.
--
-- Solução: persistir UTMs first-touch no client (localStorage, TTL 30d) e
-- enviar no submit pra gravar inline em diagnoses.
--
-- Idempotente: ADD COLUMN/CREATE INDEX IF NOT EXISTS.
-- =============================================================================

alter table diagnoses
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists utm_term text,
  add column if not exists landing_page text,
  add column if not exists referrer text;

create index if not exists idx_diagnoses_utm_campaign
  on diagnoses (utm_campaign);
create index if not exists idx_diagnoses_utm_source
  on diagnoses (utm_source);
