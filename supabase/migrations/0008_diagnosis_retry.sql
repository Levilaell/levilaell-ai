-- =============================================================================
-- 0008_diagnosis_retry.sql — coluna retry_count pra suportar retry manual
-- =============================================================================
-- Contexto: 18/mai/2026 o submit virou assíncrono (status=processing →
-- after() roda Anthropic + PDF + email). Quando a IA falha após retries
-- internos, o lead vê uma página de failed state com botão "Tentar
-- novamente". Pra rate-limitar esse botão (1 tentativa só), precisamos
-- contar quantas vezes esse diagnosis_id já foi reprocessado.
--
-- Idempotente: ADD COLUMN IF NOT EXISTS, default 0 NOT NULL.
-- Aplicar via Supabase Dashboard → SQL Editor.
-- =============================================================================

alter table diagnoses
  add column if not exists retry_count integer not null default 0;

comment on column diagnoses.retry_count is
  'Quantas vezes o lead solicitou retry manual via /api/diagnosis/[id]/retry. Máx 1 (UI bloqueia além disso).';
