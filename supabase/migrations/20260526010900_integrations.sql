-- External integrations: GoHighLevel state + generic encrypted credentials.

-- ===========================================================
-- GoHighLevel state per user.
-- v3 has TWO GHL pipelines (talent + client) referenced by env-var keys.
-- This table tracks each user's opportunity ID and current tag set.
-- ===========================================================
create type public.ghl_pipeline as enum ('talent', 'client');

create table public.ghl_user_state (
  user_id uuid not null references public.users(id) on delete cascade,
  pipeline public.ghl_pipeline not null,
  opportunity_id text,
  contact_id text,
  tags text[] not null default '{}',
  last_synced_at timestamptz,
  sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, pipeline)
);

create index ghl_user_state_opportunity_idx on public.ghl_user_state(opportunity_id) where opportunity_id is not null;

create trigger ghl_user_state_set_updated_at
  before update on public.ghl_user_state
  for each row execute function public.set_updated_at();

alter table public.ghl_user_state enable row level security;

-- Users can see their own GHL state. Platform admins see all.
create policy ghl_user_state_select_own on public.ghl_user_state
  for select using (auth.uid() = user_id or public.is_platform_admin());

-- Writes happen via service role from API routes that sync with GHL.

-- ===========================================================
-- Generic encrypted credentials store for per-tenant integrations
-- (future: ATS, calendar, payroll OAuth tokens).
-- Uses Supabase Vault for column encryption (added in a later phase
-- when we actually wire up an integration; the table exists now so
-- the data model is ready).
-- ===========================================================
create table public.integration_credentials (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider text not null,                       -- e.g., 'greenhouse', 'google_calendar'
  credentials_encrypted text,                   -- vault-encrypted in Phase 2+
  metadata jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, provider)
);

create index integration_credentials_tenant_idx on public.integration_credentials(tenant_id);

create trigger integration_credentials_set_updated_at
  before update on public.integration_credentials
  for each row execute function public.set_updated_at();

alter table public.integration_credentials enable row level security;

-- Tenant members can see metadata (NOT the credentials themselves — that
-- requires service role + column decryption via the Vault helper).
create policy integration_credentials_select_member on public.integration_credentials
  for select using (
    tenant_id in (select public.user_tenant_ids())
    or public.is_platform_admin()
  );

comment on table public.ghl_user_state is
  'Per-user GoHighLevel sync state. v3 has two pipelines (talent + client); v4 preserves both.';
comment on table public.integration_credentials is
  'Encrypted credentials for per-tenant integrations (ATS, calendars, payroll). Populated when integrations are wired up.';
