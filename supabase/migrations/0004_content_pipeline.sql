-- =============================================================================
-- 0004_content_pipeline.sql — editorial pipeline (admin-only)
-- =============================================================================
-- Tabelas pra gerenciar criação de conteúdo IA → revisão humana → publicação
-- nos 3 canais (blog, newsletter, x). Acesso só via service role; nenhuma
-- policy pública.
--
-- Idempotente: usa CREATE TABLE IF NOT EXISTS + DROP POLICY IF EXISTS.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- content_pipeline — fila + estado de cada item de conteúdo
-- ---------------------------------------------------------------------------
create table if not exists content_pipeline (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  -- Topic definition
  channel text not null
    check (channel in ('blog', 'newsletter', 'x')),
  topic text not null,
  pillar text,
  keyword text,
  notes text,
  metadata jsonb default '{}'::jsonb not null,

  -- Pipeline state
  status text not null default 'queued'
    check (status in (
      'queued',
      'generating',
      'generated',
      'approved',
      'publishing',
      'published',
      'rejected',
      'failed'
    )),

  -- Content
  generated_content jsonb,
  edited_content jsonb,

  -- Tracking
  generated_at timestamptz,
  approved_at timestamptz,
  published_at timestamptz,

  -- Publishing artifacts
  notion_page_id text,
  resend_batch_id text,
  newsletter_recipients_count integer,

  -- Cost tracking
  tokens_used integer not null default 0,
  cost_estimate_brl numeric(10,4) not null default 0,

  -- Error tracking
  error_message text
);

create index if not exists idx_content_pipeline_status on content_pipeline (status);
create index if not exists idx_content_pipeline_channel on content_pipeline (channel);
create index if not exists idx_content_pipeline_created on content_pipeline (created_at desc);

-- updated_at trigger
create or replace function set_content_pipeline_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_content_pipeline_updated_at on content_pipeline;
create trigger trg_content_pipeline_updated_at
  before update on content_pipeline
  for each row execute function set_content_pipeline_updated_at();

-- ---------------------------------------------------------------------------
-- newsletter_sends — log per-recipient pra auditoria de envios
-- ---------------------------------------------------------------------------
create table if not exists newsletter_sends (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid references content_pipeline(id) on delete cascade,
  subscriber_id uuid references subscribers(id) on delete set null,
  sent_at timestamptz default now() not null,
  status text not null default 'sent'
    check (status in ('sent', 'failed')),
  error_message text
);

create index if not exists idx_newsletter_sends_pipeline on newsletter_sends (pipeline_id);
create index if not exists idx_newsletter_sends_subscriber on newsletter_sends (subscriber_id);

-- ---------------------------------------------------------------------------
-- RLS — sem policies públicas; service_role bypassa por padrão
-- ---------------------------------------------------------------------------
alter table content_pipeline enable row level security;
alter table newsletter_sends enable row level security;
