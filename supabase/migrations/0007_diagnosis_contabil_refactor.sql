-- =============================================================================
-- 0007_diagnosis_contabil_refactor.sql — refator de diagnóstico pra nicho contábil
-- =============================================================================
-- Contexto: 16/mai/2026 o público mudou de "qualquer empresa" pra "escritório
-- contábil". O formulário foi de 9 → 7 perguntas; o lead score, o prompt da IA
-- e a estrutura de ai_analysis também mudaram.
--
-- Esta migration:
--   1) Torna nullable as colunas legacy que eram NOT NULL (registros novos não
--      preenchem mais q2_business_model, q4_tech_maturity, q7_main_goal,
--      q9_budget — os outros são REUSADOS com semântica nova; ver tabela
--      abaixo).
--   2) Adiciona q2_erp + q3_client_profile (perguntas novas que não tinham
--      contraparte na v1).
--   3) Comenta colunas legacy / reusadas pra documentar o débito técnico.
--   4) Cria índices em q2_erp + q3_client_profile pra análise por carteira.
--
-- Mapping form (v2 contábil) → coluna do banco:
--   form.q1_size            → diagnoses.q1_size            (texto reuso)
--   form.q2_erp             → diagnoses.q2_erp             (coluna nova)
--   form.q3_client_profile  → diagnoses.q3_client_profile  (coluna nova)
--   form.q4_pain_areas      → diagnoses.q3_pain_areas      (jsonb REUSO)
--   form.q5_hours_weekly    → diagnoses.q5_hours_weekly    (texto REUSO)
--   form.q6_automation_history → diagnoses.q6_automation_history (texto REUSO)
--   form.q7_timeline        → diagnoses.q8_timeline        (texto REUSO)
--
-- Colunas NULL pra registros novos:
--   q2_business_model, q2_business_model_other, q4_tech_maturity,
--   q7_main_goal, q9_budget, q10_revenue, q10_employees
--
-- Idempotente: ADD COLUMN/CREATE INDEX IF NOT EXISTS + DROP NOT NULL.
-- Aplicar via Supabase Dashboard → SQL Editor (sem CLI configurada).
-- =============================================================================

alter table diagnoses
  alter column q2_business_model drop not null,
  alter column q4_tech_maturity drop not null,
  alter column q7_main_goal drop not null,
  alter column q9_budget drop not null;

alter table diagnoses
  add column if not exists q2_erp text,
  add column if not exists q3_client_profile text;

comment on column diagnoses.q1_size is
  'V2 contábil (>=2026-05-18): faixa de carteira de clientes. v1: porte da empresa.';
comment on column diagnoses.q2_business_model is
  'LEGACY (<2026-05-18). NULL em registros novos; semântica substituída por q2_erp.';
comment on column diagnoses.q2_business_model_other is
  'LEGACY (<2026-05-18). NULL em registros novos.';
comment on column diagnoses.q3_pain_areas is
  'V2 contábil: áreas onde o escritório perde tempo (triagem, NF, conciliação…). v1: dores genéricas. Reuso de coluna jsonb.';
comment on column diagnoses.q4_tech_maturity is
  'LEGACY (<2026-05-18). NULL em registros novos; sem contraparte direta na v2.';
comment on column diagnoses.q5_hours_weekly is
  'V2 contábil: faixa de horas/semana em tarefas manuais. v1: mesma semântica, valores enum diferentes.';
comment on column diagnoses.q6_automation_history is
  'V2 contábil: histórico de tentativas de automação (saas_falhou, freelancer_fragil…). v1: mesma semântica, enums diferentes.';
comment on column diagnoses.q7_main_goal is
  'LEGACY (<2026-05-18). NULL em registros novos; sem contraparte direta na v2.';
comment on column diagnoses.q8_timeline is
  'V2 contábil: urgência (para_ontem, proximo_mes, tres_meses, sem_urgencia). v1: enum diferente. Reuso de coluna.';
comment on column diagnoses.q9_budget is
  'LEGACY (<2026-05-18). NULL em registros novos; orçamento saiu do formulário.';
comment on column diagnoses.q10_revenue is
  'LEGACY (<2026-05-18). NULL em registros novos.';
comment on column diagnoses.q10_employees is
  'LEGACY (<2026-05-18). NULL em registros novos.';
comment on column diagnoses.q2_erp is
  'V2 contábil (>=2026-05-18): ERP principal do escritório (dominio, onvio, alterdata, sage, contmatic, mastermaq, outro_planilha).';
comment on column diagnoses.q3_client_profile is
  'V2 contábil (>=2026-05-18): perfil de cliente predominante (mei, simples, presumido, real, misto).';

create index if not exists idx_diagnoses_q2_erp on diagnoses (q2_erp);
create index if not exists idx_diagnoses_q3_client_profile
  on diagnoses (q3_client_profile);
