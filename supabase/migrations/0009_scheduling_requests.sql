-- =============================================================================
-- 0009_scheduling_requests.sql — tabela pra capturar pedidos de agendamento
-- =============================================================================
-- Contexto: 18/mai/2026 substituímos o link direto pro Cal.com por um form
-- simples (nome, whatsapp, email, site opcional, urgência). O lead envia o
-- form → notificação dispara no Telegram → comercial chama no WhatsApp pra
-- combinar a reunião. Captura controlada > esperar o lead lembrar de voltar.
--
-- Idempotente: CREATE IF NOT EXISTS + IF NOT EXISTS nos índices.
-- Aplicar via Supabase Dashboard → SQL Editor.
-- =============================================================================

create extension if not exists "pgcrypto";

create table if not exists scheduling_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,

  -- Captura
  name text not null,
  email text not null,
  whatsapp text not null,
  site_url text,
  urgency text not null
    check (urgency in ('this_week', 'next_month', 'researching')),

  -- Origem (botão que disparou)
  source text,
  -- Referência cruzada quando o agendamento veio do fluxo de diagnóstico
  diagnosis_id uuid references diagnoses(id) on delete set null,

  -- Atribuição (capturada no client, mesmo padrão do diagnoses)
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  landing_page text,
  referrer text,

  -- Operacional
  notified_at timestamptz,
  contacted_at timestamptz,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'scheduled', 'won', 'lost'))
);

create index if not exists idx_scheduling_requests_created_at
  on scheduling_requests (created_at desc);
create index if not exists idx_scheduling_requests_status
  on scheduling_requests (status, created_at desc);
create index if not exists idx_scheduling_requests_email
  on scheduling_requests (lower(email));

-- RLS — anon só insere (mesmo padrão de contacts/diagnoses).
alter table scheduling_requests enable row level security;

drop policy if exists "anon insert scheduling_requests" on scheduling_requests;
create policy "anon insert scheduling_requests" on scheduling_requests
  for insert to anon with check (true);

comment on table scheduling_requests is
  'Pedidos de agendamento via form do site. Comercial faz follow-up por WhatsApp.';
comment on column scheduling_requests.urgency is
  'this_week | next_month | researching — campo de qualificação rápida do lead.';
comment on column scheduling_requests.source is
  'Origem do clique (header, home_hero, contact_page, diagnosis_result, etc).';
