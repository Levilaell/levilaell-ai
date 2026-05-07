-- =============================================================================
-- 0002_v2_fixup.sql — corrige schema parcialmente aplicado
-- =============================================================================
-- Diagnóstico do estado encontrado em 2026-05-07:
--   • diagnoses existe mas com schema v1 (sem q1_size, q8_timeline, etc).
--   • tracking_events NÃO existe.
--   • contacts OK, mas falta service_interest.
--   • email_sequences OK, mas faltam body_html / body_subject.
--   • subscribers e public_examples já estão OK.
--
-- Estratégia:
--   1) diagnoses está vazia (confirmado via debug script) — DROP + CREATE limpo.
--      email_sequences referencia diagnoses; CASCADE remove referências (se
--      houver — provavelmente também vazia).
--   2) tracking_events: CREATE.
--   3) Demais: ALTER ADD COLUMN IF NOT EXISTS (idempotente).
--   4) Policies: DROP IF EXISTS + CREATE (idempotente).
--
-- Roda em qualquer estado: pode ser executada N vezes em sequência sem efeito
-- colateral.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1) diagnoses — drop + create com schema v2
-- ---------------------------------------------------------------------------
drop table if exists diagnoses cascade;

create table diagnoses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,

  name text not null,
  email text not null,
  whatsapp text,
  company text,

  q1_size text not null,
  q2_business_model text not null,
  q2_business_model_other text,
  q3_pain_areas jsonb not null,
  q4_tech_maturity text not null,
  q5_hours_weekly text not null,
  q6_automation_history text not null,
  q7_main_goal text not null,
  q8_timeline text not null,
  q9_budget text not null,

  q10_revenue text,
  q10_employees integer,

  ai_analysis jsonb,
  status text not null default 'processing'
    check (status in ('processing', 'completed', 'failed')),
  error_message text,
  lead_score integer
);

create index if not exists idx_diagnoses_email on diagnoses (lower(email));
create index if not exists idx_diagnoses_created_at on diagnoses (created_at desc);
create index if not exists idx_diagnoses_status on diagnoses (status);

alter table diagnoses enable row level security;

drop policy if exists "anon insert diagnoses" on diagnoses;
create policy "anon insert diagnoses" on diagnoses
  for insert to anon with check (true);

-- ---------------------------------------------------------------------------
-- 2) email_sequences — recria limpo (FK pra diagnoses) + colunas v2
-- ---------------------------------------------------------------------------
drop table if exists email_sequences cascade;

create table email_sequences (
  id uuid primary key default gen_random_uuid(),
  diagnosis_id uuid references diagnoses(id) on delete cascade,
  email_number integer not null,
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'sent', 'failed', 'cancelled')),
  error_message text,
  body_html text,
  body_subject text
);

create index if not exists idx_email_sequences_scheduled
  on email_sequences (scheduled_at)
  where status = 'scheduled';
create index if not exists idx_email_sequences_diagnosis
  on email_sequences (diagnosis_id);

alter table email_sequences enable row level security;

-- ---------------------------------------------------------------------------
-- 3) tracking_events — criar do zero
-- ---------------------------------------------------------------------------
create table if not exists tracking_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  event_data jsonb,
  session_id text,
  user_agent text,
  referrer text,
  page_path text,
  created_at timestamptz default now() not null
);

create index if not exists idx_tracking_events_created_at
  on tracking_events (created_at desc);
create index if not exists idx_tracking_events_type
  on tracking_events (event_type, created_at desc);
create index if not exists idx_tracking_events_session
  on tracking_events (session_id) where session_id is not null;

alter table tracking_events enable row level security;

drop policy if exists "anon insert tracking_events" on tracking_events;
create policy "anon insert tracking_events" on tracking_events
  for insert to anon with check (true);

-- ---------------------------------------------------------------------------
-- 4) contacts — adicionar service_interest se ausente
-- ---------------------------------------------------------------------------
alter table contacts add column if not exists service_interest text;

-- Garante a policy mesmo se já existia (idempotente)
alter table contacts enable row level security;
drop policy if exists "anon insert contacts" on contacts;
create policy "anon insert contacts" on contacts
  for insert to anon with check (true);

-- ---------------------------------------------------------------------------
-- 5) subscribers — apenas garante a policy
-- ---------------------------------------------------------------------------
alter table subscribers enable row level security;
drop policy if exists "anon insert subscribers" on subscribers;
create policy "anon insert subscribers" on subscribers
  for insert to anon with check (true);

-- ---------------------------------------------------------------------------
-- 6) public_examples — apenas garante a policy de leitura pública
-- ---------------------------------------------------------------------------
alter table public_examples enable row level security;
drop policy if exists "anon read published examples" on public_examples;
create policy "anon read published examples" on public_examples
  for select to anon using (published = true);
