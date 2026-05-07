-- =============================================================================
-- 0001_init.sql — schema v2 (Levi Lael)
-- =============================================================================
-- Como rodar:
--   Opção A) Supabase Dashboard → SQL Editor → cole este arquivo → Run
--   Opção B) supabase CLI: `supabase db push` (se o projeto estiver linkado)
--
-- IMPORTANTE: este script é DESTRUTIVO. Faz DROP nas tabelas antes de criar.
-- Use apenas em ambiente vazio (greenfield) ou com dados descartáveis.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- DROP em ordem inversa de dependência (FKs)
-- ---------------------------------------------------------------------------
drop table if exists tracking_events cascade;
drop table if exists email_sequences cascade;
drop table if exists public_examples cascade;
drop table if exists subscribers cascade;
drop table if exists contacts cascade;
drop table if exists diagnoses cascade;

-- ---------------------------------------------------------------------------
-- diagnoses (10 perguntas v2)
-- ---------------------------------------------------------------------------
create table diagnoses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,

  -- Lead capture
  name text not null,
  email text not null,
  whatsapp text,
  company text,

  -- Required questions
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

  -- Optional quantitative data
  q10_revenue text,
  q10_employees integer,

  -- AI analysis result
  ai_analysis jsonb,
  status text not null default 'processing'
    check (status in ('processing', 'completed', 'failed')),
  error_message text,

  -- Lead scoring (calculated from answers)
  lead_score integer
);

create index idx_diagnoses_email on diagnoses (lower(email));
create index idx_diagnoses_created_at on diagnoses (created_at desc);
create index idx_diagnoses_status on diagnoses (status);

-- ---------------------------------------------------------------------------
-- email_sequences
-- ---------------------------------------------------------------------------
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

create index idx_email_sequences_scheduled
  on email_sequences (scheduled_at)
  where status = 'scheduled';

create index idx_email_sequences_diagnosis on email_sequences (diagnosis_id);

-- ---------------------------------------------------------------------------
-- public_examples (curados manualmente)
-- ---------------------------------------------------------------------------
create table public_examples (
  id uuid primary key default gen_random_uuid(),
  diagnosis_id uuid references diagnoses(id) on delete set null,
  slug text unique not null,
  title text not null,
  meta_description text,
  content jsonb not null,
  published boolean not null default false,
  views integer not null default 0,
  created_at timestamptz default now() not null
);

create index idx_public_examples_published_slug
  on public_examples (slug) where published = true;

-- ---------------------------------------------------------------------------
-- subscribers (newsletter)
-- ---------------------------------------------------------------------------
create table subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  subscribed_at timestamptz default now() not null,
  unsubscribed_at timestamptz,
  source text,
  tags jsonb default '[]'::jsonb not null
);

create index idx_subscribers_email on subscribers (lower(email));

-- ---------------------------------------------------------------------------
-- contacts (formulário /contact)
-- ---------------------------------------------------------------------------
create table contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  service_interest text,
  subject text,
  message text not null,
  created_at timestamptz default now() not null,
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'closed', 'spam'))
);

create index idx_contacts_status on contacts (status, created_at desc);

-- ---------------------------------------------------------------------------
-- tracking_events
-- ---------------------------------------------------------------------------
create table tracking_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  event_data jsonb,
  session_id text,
  user_agent text,
  referrer text,
  page_path text,
  created_at timestamptz default now() not null
);

create index idx_tracking_events_created_at on tracking_events (created_at desc);
create index idx_tracking_events_type on tracking_events (event_type, created_at desc);
create index idx_tracking_events_session on tracking_events (session_id) where session_id is not null;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table diagnoses enable row level security;
alter table email_sequences enable row level security;
alter table public_examples enable row level security;
alter table subscribers enable row level security;
alter table contacts enable row level security;
alter table tracking_events enable row level security;

-- Public can INSERT into the entry-point tables
create policy "anon insert diagnoses" on diagnoses
  for insert to anon with check (true);

create policy "anon insert subscribers" on subscribers
  for insert to anon with check (true);

create policy "anon insert contacts" on contacts
  for insert to anon with check (true);

create policy "anon insert tracking_events" on tracking_events
  for insert to anon with check (true);

-- Public can SELECT only published examples
create policy "anon read published examples" on public_examples
  for select to anon using (published = true);

-- Tudo o mais (UPDATE, DELETE, SELECT noutros tables) requer service_role,
-- que bypass RLS por padrão.
