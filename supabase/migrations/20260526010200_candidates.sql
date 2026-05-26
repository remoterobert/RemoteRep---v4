-- Candidate (sales rep) profile + experience + goals + files + specialties.
-- v3 stored all of these as nested fields on the user row; v4 normalizes.
-- Talent is GLOBAL (not tenant-scoped) so anyone can find candidates.

-- ===========================================================
-- Profile (public-facing snapshot)
-- ===========================================================
create table public.candidate_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  headline text,
  about text,
  photo_url text,
  video_url text,
  visibility public.visibility not null default 'hidden',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index candidate_profiles_visibility_idx on public.candidate_profiles(visibility);

create trigger candidate_profiles_set_updated_at
  before update on public.candidate_profiles
  for each row execute function public.set_updated_at();

alter table public.candidate_profiles enable row level security;

-- Public can SELECT public profiles only (used for browsing).
create policy candidate_profiles_select_public on public.candidate_profiles
  for select using (visibility = 'public');

-- The candidate can always see and modify their own profile.
create policy candidate_profiles_select_own on public.candidate_profiles
  for select using (auth.uid() = user_id);

create policy candidate_profiles_insert_own on public.candidate_profiles
  for insert with check (auth.uid() = user_id);

create policy candidate_profiles_update_own on public.candidate_profiles
  for update using (auth.uid() = user_id);

create policy candidate_profiles_delete_own on public.candidate_profiles
  for delete using (auth.uid() = user_id);

-- Platform admins can see all candidate profiles.
create policy candidate_profiles_select_platform_admin on public.candidate_profiles
  for select using (public.is_platform_admin());

-- ===========================================================
-- Experience (v3 stored ONE experience block; v4 allows MANY past jobs)
-- ===========================================================
create table public.candidate_experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  company text,
  title text,
  start_date date,
  end_date date,
  description text,

  -- Per-role detail (matches v3 schema)
  education public.education_level,
  years_of_experience int,
  industries text[],                         -- references industries.slug
  sales_roles public.sales_role[],
  sales_types public.sales_type[],
  decision_makers public.decision_maker[],
  sales_environments public.sales_environment[],
  sales_cycles public.sales_cycle[],
  deal_amounts public.deal_amount[],
  sales_volumes public.sales_volume[],
  lead_types public.lead_type[],
  technologies public.technology[],

  display_order int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index candidate_experiences_user_idx on public.candidate_experiences(user_id);

create trigger candidate_experiences_set_updated_at
  before update on public.candidate_experiences
  for each row execute function public.set_updated_at();

alter table public.candidate_experiences enable row level security;

create policy candidate_experiences_select_via_profile on public.candidate_experiences
  for select using (
    exists (
      select 1 from public.candidate_profiles cp
      where cp.user_id = candidate_experiences.user_id
        and cp.visibility = 'public'
    )
    or auth.uid() = user_id
    or public.is_platform_admin()
  );

create policy candidate_experiences_write_own on public.candidate_experiences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ===========================================================
-- Goals (what the candidate wants in their next role)
-- ===========================================================
create table public.candidate_goals (
  user_id uuid primary key references public.users(id) on delete cascade,
  company_age_max int check (company_age_max is null or company_age_max between 0 and 100),
  company_headcount_max int check (company_headcount_max is null or company_headcount_max between 0 and 100000),
  industries text[],                            -- references industries.slug
  sales_roles public.sales_role[],
  commitment public.commitment_type[],
  benefits public.benefit[],
  compensation_types public.compensation_type[],
  minimum_compensation numeric,                 -- v3 was a single number
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger candidate_goals_set_updated_at
  before update on public.candidate_goals
  for each row execute function public.set_updated_at();

alter table public.candidate_goals enable row level security;

create policy candidate_goals_select_own on public.candidate_goals
  for select using (auth.uid() = user_id or public.is_platform_admin());

create policy candidate_goals_write_own on public.candidate_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ===========================================================
-- Specialties (which sales roles a candidate is qualified for)
-- Used by Phase 1d onboarding ("I'm a Closer", "I'm an SDR", etc.)
-- ===========================================================
create table public.candidate_specialties (
  user_id uuid not null references public.users(id) on delete cascade,
  sales_role public.sales_role not null,
  added_at timestamptz not null default now(),
  primary key (user_id, sales_role)
);

create index candidate_specialties_role_idx on public.candidate_specialties(sales_role);

alter table public.candidate_specialties enable row level security;

-- Specialties are visible if the candidate's profile is public, OR to the candidate themselves.
create policy candidate_specialties_select on public.candidate_specialties
  for select using (
    exists (
      select 1 from public.candidate_profiles cp
      where cp.user_id = candidate_specialties.user_id
        and cp.visibility = 'public'
    )
    or auth.uid() = user_id
    or public.is_platform_admin()
  );

create policy candidate_specialties_write_own on public.candidate_specialties
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ===========================================================
-- Files (resume, profile photo, etc.) — metadata only; bytes in R2
-- ===========================================================
create table public.candidate_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  kind public.file_kind not null,
  r2_key text not null,                         -- key in Cloudflare R2 bucket
  original_filename text,
  size_bytes int,
  mime_type text,
  uploaded_at timestamptz not null default now()
);

create index candidate_files_user_idx on public.candidate_files(user_id, kind);

alter table public.candidate_files enable row level security;

create policy candidate_files_select_own on public.candidate_files
  for select using (auth.uid() = user_id or public.is_platform_admin());

create policy candidate_files_write_own on public.candidate_files
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

comment on table public.candidate_profiles is
  'Public-facing candidate (sales rep) profile. Global, not tenant-scoped.';
