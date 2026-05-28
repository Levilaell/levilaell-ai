-- =============================================================================
-- 0010_descoberta_fields.sql — campos da descoberta conversacional
-- =============================================================================
-- Contexto: 28/mai/2026. O form de descoberta (/descoberta) substitui a call
-- de descoberta. Reusa scheduling_requests como destino do lead (mesmo
-- pipeline: persistência + Telegram + CAPI Lead + CRM). Guarda o transcript
-- (Q&A) e a extração estruturada da IA pra montar a proposta sem reabrir a
-- conversa. source='descoberta' identifica a origem (coluna já é texto livre).
--
-- Idempotente: ADD COLUMN IF NOT EXISTS. Aplicar via Supabase Dashboard → SQL.
-- =============================================================================

alter table scheduling_requests
  add column if not exists transcript jsonb,
  add column if not exists extracted jsonb;

comment on column scheduling_requests.transcript is
  'Descoberta: array de {key, question, answer} com as respostas do lead.';
comment on column scheduling_requests.extracted is
  'Descoberta: dados estruturados extraídos pela IA (resumo, dor, escopo, sistemas, prazo).';
