-- =============================================================================
-- 0003_email_body_cache.sql — colunas de cache em email_sequences
-- =============================================================================
-- Cron de envio gera body_html (e subject) na primeira tentativa e cacheia
-- aqui. Re-tentativas reusam o cache em vez de re-gerar (custo de IA + chamada
-- determinística pra usuário).
--
-- Idempotente: ADD COLUMN IF NOT EXISTS. Pode rodar N vezes.
-- =============================================================================

alter table email_sequences add column if not exists body_html text;
alter table email_sequences add column if not exists body_subject text;
