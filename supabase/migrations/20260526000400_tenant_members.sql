-- Tenant membership: a user's role within a tenant. A user can be in many
-- tenants (e.g., agency staff who manage multiple client tenants).
-- See docs/V4-DATA-MODEL.md §4.1 and §3.

create type public.tenant_role as enum (
  'candidate',        -- talent (sales reps applying)
  'client_member',    -- recruiter inside a hiring company
  'client_admin',     -- top-level admin of a hiring company tenant
  'agency_member',    -- recruiter inside an agency
  'agency_admin',     -- top-level admin of an agency
  'platform_admin',   -- RemoteRep staff (cross-tenant access)
  'platform_support'  -- RemoteRep support staff (limited cross-tenant access)
);

create type public.membership_status as enum (
  'active',
  'invited',
  'removed'
);

create table public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.tenant_role not null,
  status public.membership_status not null default 'active',
  invited_by uuid references public.users(id) on delete set null,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id, role)
);

create index tenant_members_user_idx on public.tenant_members(user_id);
create index tenant_members_tenant_idx on public.tenant_members(tenant_id);
create index tenant_members_role_idx on public.tenant_members(role);

create trigger tenant_members_set_updated_at
  before update on public.tenant_members
  for each row execute function public.set_updated_at();

-- Helper: returns active tenant IDs for the authenticated user.
-- Used by RLS policies on tenant-scoped tables (tenants, events, etc.).
-- SECURITY DEFINER bypasses RLS on tenant_members to avoid recursion.
create or replace function public.user_tenant_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id
  from public.tenant_members
  where user_id = auth.uid()
  and status = 'active';
$$;

-- Helper: true if the authenticated user has platform_admin role anywhere.
-- Also SECURITY DEFINER to avoid recursion.
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenant_members
    where user_id = auth.uid()
    and role = 'platform_admin'
    and status = 'active'
  );
$$;

comment on function public.user_tenant_ids() is
  'Returns active tenant IDs for the authenticated user. Use in RLS policies for tenant-scoped tables.';
comment on function public.is_platform_admin() is
  'True if the authenticated user has platform_admin role in any tenant.';

-- RLS for tenant_members itself
alter table public.tenant_members enable row level security;

-- Users see their own memberships.
create policy tenant_members_select_self on public.tenant_members
  for select using (auth.uid() = user_id);

-- Platform admins see all memberships.
create policy tenant_members_select_platform_admin on public.tenant_members
  for select using (public.is_platform_admin());

-- Backfill the tenants SELECT policy (couldn't add in earlier migration
-- because tenant_members didn't exist yet).
create policy tenants_select_member on public.tenants
  for select using (
    id in (select public.user_tenant_ids())
  );

create policy tenants_select_platform_admin on public.tenants
  for select using (public.is_platform_admin());

comment on table public.tenant_members is
  'User<->tenant membership with role. Mechanism for both multi-tenancy and RBAC.';
