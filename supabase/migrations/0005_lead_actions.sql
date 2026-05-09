-- =============================================================================
-- 0005_lead_actions.sql — colunas de ação de lead + métricas de pipeline
-- =============================================================================
-- diagnoses ganha contacted_at/qualified_at/lead_notes pra Levi tagear o status
-- de outreach manual no /admin/stats.
--
-- content_pipeline ganha generated_in_ms (tempo de geração medido) e
-- generation_count (incrementado a cada claimForGeneration). Sem isso a Section
-- D.2 do brief não consegue calcular "tempo médio" nem "taxa de regeneração".
--
-- Idempotente: ADD COLUMN IF NOT EXISTS. Pode rodar N vezes.
-- =============================================================================

alter table diagnoses
  add column if not exists contacted_at timestamptz,
  add column if not exists qualified_at timestamptz,
  add column if not exists lead_notes text;

-- generation_count: 1 = primeira geração; >=2 = foi regerado pelo menos uma vez.
-- Bumpado em claimForGeneration. Métrica derivada: regenerated / total > 0.
alter table content_pipeline
  add column if not exists generated_in_ms integer,
  add column if not exists generation_count integer not null default 0;

create index if not exists idx_diagnoses_lead_score
  on diagnoses (lead_score desc nulls last)
  where status = 'completed';
