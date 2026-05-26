-- Tenants are the top-level entity that owns business data.
-- Multi-tenancy isolation is enforced via RLS once tenant_members exists.
-- See docs/V4-DATA-MODEL.md §4.1.

create type public.tenant_type as enum (
  'client_company',  -- a hiring company
  'agency',          -- a recruiting agency (manages multiple client engagements)
  'solo_talent',     -- individual talent ("tenant of one"; per 2026-05-25 decision)
  'platform'         -- RemoteRep itself (admin/staff tenant)
);

create type public.tenant_status as enum (
  'active',
  'suspended',
  'deleted'
);

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9-]{1,64}$'),
  name text not null,
  type public.tenant_type not null,
  status public.tenant_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tenants_status_idx on public.tenants(status);
create index tenants_type_idx on public.tenants(type);

create trigger tenants_set_updated_at
  before update on public.tenants
  for each row execute function public.set_updated_at();

-- RLS enabled with no SELECT policies here — that comes in the
-- tenant_members migration once the membership table exists.
-- Writes happen via service role from API routes.
alter table public.tenants enable row level security;

comment on table public.tenants is
  'Top-level organizations. Every piece of business data ultimately belongs to a tenant.';
