-- Company profile for hiring tenants — mirror of candidate_profiles
-- but keyed by tenant (a company has one shared profile).

create table public.client_profiles (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  about text,
  logo_url text,
  website_url text,
  industry_slug text,
  headcount int check (headcount is null or headcount between 0 and 1000000),
  founded_year int check (founded_year is null or founded_year between 1800 and 2100),
  hiring_pitch text,
  visibility public.visibility not null default 'public',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger client_profiles_set_updated_at
  before update on public.client_profiles
  for each row execute function public.set_updated_at();

alter table public.client_profiles enable row level security;

-- Public company profiles are visible to any authenticated user
-- (candidates browsing companies, other clients viewing peers).
create policy client_profiles_select_public on public.client_profiles
  for select using (
    visibility = 'public' and auth.uid() is not null
  );

-- Members of the tenant can always see + write their own profile.
create policy client_profiles_select_member on public.client_profiles
  for select using (
    tenant_id in (select public.user_tenant_ids())
  );

create policy client_profiles_insert_member on public.client_profiles
  for insert with check (
    tenant_id in (
      select tm.tenant_id from public.tenant_members tm
      where tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in ('client_admin', 'agency_admin')
    )
  );

create policy client_profiles_update_member on public.client_profiles
  for update using (
    tenant_id in (
      select tm.tenant_id from public.tenant_members tm
      where tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in ('client_admin', 'agency_admin')
    )
  );

-- Platform admin bypass
create policy client_profiles_select_platform_admin on public.client_profiles
  for select using (public.is_platform_admin());

comment on table public.client_profiles is
  'Hiring tenant (client_company / agency) profile. Keyed by tenant. Public data (about, headcount, industry) shown to candidates browsing companies.';
