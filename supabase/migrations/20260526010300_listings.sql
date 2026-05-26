-- Job listings posted by client tenants (hiring companies).
-- v3 stored applications nested inside the listing row; v4 splits applications into its own table.

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  created_by_user_id uuid not null references public.users(id),
  title text not null check (char_length(title) between 10 and 80),
  description text not null check (char_length(description) between 100 and 5000),
  instructions text check (char_length(instructions) between 100 and 5000),
  calendar_link text,
  status public.listing_status not null default 'draft',
  visibility public.visibility not null default 'hidden',
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_tenant_idx on public.listings(tenant_id);
create index listings_status_idx on public.listings(status, published_at desc);
create index listings_visibility_idx on public.listings(visibility);

create trigger listings_set_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

alter table public.listings enable row level security;

-- Published, public listings visible to anyone.
create policy listings_select_published on public.listings
  for select using (status = 'published' and visibility = 'public');

-- Tenant members can see all their tenant's listings (any status).
create policy listings_select_tenant_member on public.listings
  for select using (tenant_id in (select public.user_tenant_ids()));

-- Platform admins see everything.
create policy listings_select_platform_admin on public.listings
  for select using (public.is_platform_admin());

-- Writes go through service role / API routes (no policy granted).

-- ===========================================================
-- Listing details (compensation, commitment, role)
-- ===========================================================
create table public.listing_details (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  sales_role public.sales_role not null,
  commitment public.commitment_type,
  benefits public.benefit[],
  compensation_type public.compensation_type,
  minimum_compensation numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger listing_details_set_updated_at
  before update on public.listing_details
  for each row execute function public.set_updated_at();

alter table public.listing_details enable row level security;

-- Listing details follow the visibility of the parent listing.
create policy listing_details_select_via_listing on public.listing_details
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = listing_details.listing_id
        and (
          (l.status = 'published' and l.visibility = 'public')
          or l.tenant_id in (select public.user_tenant_ids())
          or public.is_platform_admin()
        )
    )
  );

-- ===========================================================
-- Listing requirements (filterable criteria for candidates)
-- ===========================================================
create table public.listing_requirements (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  education public.education_level[],
  years_of_experience_min int,
  industries text[],                              -- references industries.slug
  sales_roles public.sales_role[],
  sales_types public.sales_type[],
  decision_makers public.decision_maker[],
  sales_environments public.sales_environment[],
  sales_cycles public.sales_cycle[],
  deal_amounts public.deal_amount[],
  sales_volumes public.sales_volume[],
  lead_types public.lead_type[],
  technologies public.technology[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger listing_requirements_set_updated_at
  before update on public.listing_requirements
  for each row execute function public.set_updated_at();

alter table public.listing_requirements enable row level security;

create policy listing_requirements_select_via_listing on public.listing_requirements
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = listing_requirements.listing_id
        and (
          (l.status = 'published' and l.visibility = 'public')
          or l.tenant_id in (select public.user_tenant_ids())
          or public.is_platform_admin()
        )
    )
  );

-- ===========================================================
-- Hiring intents (what role a tenant is currently hiring for)
-- Used by Phase 1d onboarding: "We're hiring for Closers" → recorded here.
-- Multiple intents per tenant are allowed (e.g., hiring SDR + AE simultaneously).
-- ===========================================================
create table public.tenant_hiring_intents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sales_role public.sales_role not null,
  status text not null default 'active' check (status in ('active', 'paused', 'filled')),
  created_by_user_id uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, sales_role, status) -- avoid duplicate active intents
);

create index tenant_hiring_intents_tenant_idx on public.tenant_hiring_intents(tenant_id);
create index tenant_hiring_intents_role_idx on public.tenant_hiring_intents(sales_role) where status = 'active';

create trigger tenant_hiring_intents_set_updated_at
  before update on public.tenant_hiring_intents
  for each row execute function public.set_updated_at();

alter table public.tenant_hiring_intents enable row level security;

create policy tenant_hiring_intents_select_member on public.tenant_hiring_intents
  for select using (
    tenant_id in (select public.user_tenant_ids())
    or public.is_platform_admin()
  );

comment on table public.listings is
  'Job listings posted by client tenants. Applications live in their own table; payments in listing_payments.';
comment on table public.tenant_hiring_intents is
  'What sales roles a tenant is actively hiring for. Captured during onboarding (Phase 1d).';
