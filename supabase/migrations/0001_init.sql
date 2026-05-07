-- =============================================================================
-- 0001_init.sql — schema inicial Levi Lael
-- Cria tabelas, índices e RLS para os formulários públicos do site.
-- Aplique com `supabase db push` ou via SQL editor.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- diagnoses
-- ---------------------------------------------------------------------------
create table if not exists diagnoses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  name text not null,
  email text not null,
  whatsapp text,
  company text,
  q1_company_type text,
  q2_industry text,
  q3_pain_areas jsonb,
  q4_tech_maturity text,
  q5_hours_weekly text,
  q6_automation_history text,
  q7_main_goal text,
  ai_analysis jsonb,
  status text not null default 'processing'
    check (status in ('processing', 'completed', 'failed')),
  lead_score integer
);

create index if not exists idx_diagnoses_email on diagnoses (email);
create index if not exists idx_diagnoses_created_at on diagnoses (created_at desc);

-- ---------------------------------------------------------------------------
-- email_sequences (para automações de follow-up)
-- ---------------------------------------------------------------------------
create table if not exists email_sequences (
  id uuid primary key default gen_random_uuid(),
  diagnosis_id uuid references diagnoses(id) on delete cascade,
  email_number integer not null,
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'sent', 'failed', 'cancelled'))
);

create index if not exists idx_email_seq_scheduled on email_sequences (scheduled_at)
  where status = 'scheduled';

-- ---------------------------------------------------------------------------
-- public_examples (curados manualmente)
-- ---------------------------------------------------------------------------
create table if not exists public_examples (
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

create index if not exists idx_public_examples_published_slug
  on public_examples (slug) where published = true;

-- ---------------------------------------------------------------------------
-- subscribers (newsletter)
-- ---------------------------------------------------------------------------
create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  subscribed_at timestamptz default now() not null,
  unsubscribed_at timestamptz,
  source text,
  tags jsonb default '[]'::jsonb not null
);

create index if not exists idx_subscribers_email on subscribers (lower(email));

-- ---------------------------------------------------------------------------
-- contacts (formulário /contact)
-- ---------------------------------------------------------------------------
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  subject text,
  message text not null,
  created_at timestamptz default now() not null,
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'closed', 'spam'))
);

create index if not exists idx_contacts_status on contacts (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table diagnoses enable row level security;
alter table email_sequences enable row level security;
alter table public_examples enable row level security;
alter table subscribers enable row level security;
alter table contacts enable row level security;

-- public.anon can INSERT into diagnoses, subscribers, contacts
drop policy if exists "anon insert diagnoses" on diagnoses;
create policy "anon insert diagnoses" on diagnoses
  for insert to anon
  with check (true);

drop policy if exists "anon insert subscribers" on subscribers;
create policy "anon insert subscribers" on subscribers
  for insert to anon
  with check (true);

drop policy if exists "anon insert contacts" on contacts;
create policy "anon insert contacts" on contacts
  for insert to anon
  with check (true);

-- public.anon can SELECT published examples
drop policy if exists "anon read published examples" on public_examples;
create policy "anon read published examples" on public_examples
  for select to anon
  using (published = true);

-- All other access requires service_role (default RLS bypass)
