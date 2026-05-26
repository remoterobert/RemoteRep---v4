-- Application records (talent ↔ listing relationship) + bookmarks.
-- v3 stored applications nested inside the listing row; v4 normalizes.

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  candidate_user_id uuid not null references public.users(id) on delete cascade,
  status public.application_status not null,
  rating public.application_rating,
  message text,                         -- talent's optional cover message
  internal_notes text,                  -- tenant-only notes
  applied_at timestamptz,
  last_status_change_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, candidate_user_id)
);

create index applications_tenant_idx on public.applications(tenant_id);
create index applications_listing_idx on public.applications(listing_id, status);
create index applications_candidate_idx on public.applications(candidate_user_id, status);

create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

alter table public.applications enable row level security;

-- Tenant members see all applications for their tenant.
create policy applications_select_tenant_member on public.applications
  for select using (tenant_id in (select public.user_tenant_ids()));

-- The candidate sees their own applications (across all tenants).
create policy applications_select_own on public.applications
  for select using (auth.uid() = candidate_user_id);

-- Platform admins see everything.
create policy applications_select_platform_admin on public.applications
  for select using (public.is_platform_admin());

-- Writes go through service role / API routes.

-- ===========================================================
-- Bookmarks: unified save-for-later for talent, listings, tenants.
-- v3 had separate per-type bookmark fields; v4 unifies.
-- ===========================================================
create type public.bookmark_target as enum ('listing', 'candidate', 'tenant');

create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete cascade,  -- nullable: candidate bookmarks aren't tenant-scoped
  target_type public.bookmark_target not null,
  target_id uuid not null,
  note text,
  created_at timestamptz not null default now(),
  unique (owner_user_id, tenant_id, target_type, target_id)
);

create index bookmarks_owner_idx on public.bookmarks(owner_user_id, target_type);
create index bookmarks_target_idx on public.bookmarks(target_type, target_id);

alter table public.bookmarks enable row level security;

-- A user can only see their own bookmarks.
create policy bookmarks_select_own on public.bookmarks
  for select using (auth.uid() = owner_user_id);

create policy bookmarks_write_own on public.bookmarks
  for all using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);

comment on table public.applications is
  'Talent application to a listing. Replaces v3''s nested-array storage on listings.';
comment on table public.bookmarks is
  'Unified save-for-later. Owner can bookmark listings, candidates, or other tenants.';
