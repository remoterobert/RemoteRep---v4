-- Extend candidate_profiles to hold every profile-level field v3 had, and
-- create a Supabase Storage bucket + RLS for resume uploads.
--
-- Reason: MVP profile edit needs education/cycles/volumes/technologies at
-- the profile level (not per-experience) because the match-scoring engine
-- compares one profile summary against a listing's requirements. And
-- reps need somewhere to upload a resume.

-- =====================================================================
-- Extra profile-summary fields
-- =====================================================================
alter table public.candidate_profiles
  add column if not exists education public.education_level,
  add column if not exists sales_cycles public.sales_cycle[],
  add column if not exists sales_volumes public.sales_volume[],
  add column if not exists technologies public.technology[];

comment on column public.candidate_profiles.education is
  'Candidate''s highest attained level. Compared against listing_requirements.education (a list of acceptable levels).';
comment on column public.candidate_profiles.sales_cycles is
  'Sales-cycle lengths the candidate has worked. Match against listing requirement overlaps.';

-- =====================================================================
-- Storage bucket: resumes
-- Private bucket. Files stored under `{user_id}/{filename}` so RLS can
-- read the owner from the path.
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  false,
  5 * 1024 * 1024,
  array['application/pdf']
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ------------------- RLS policies on storage.objects -------------------

drop policy if exists "resumes_insert_own" on storage.objects;
create policy "resumes_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "resumes_update_own" on storage.objects;
create policy "resumes_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "resumes_delete_own" on storage.objects;
create policy "resumes_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner can always read their own resume.
drop policy if exists "resumes_select_own" on storage.objects;
create policy "resumes_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Hiring-side users can read any *public* candidate's resume.
-- (Private candidates' resumes stay hidden.)
drop policy if exists "resumes_select_hiring_side" on storage.objects;
create policy "resumes_select_hiring_side"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'resumes'
    and exists (
      select 1 from public.candidate_profiles cp
      where cp.user_id::text = (storage.foldername(name))[1]
        and cp.visibility = 'public'
    )
    and exists (
      select 1 from public.tenant_members tm
      where tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in (
          'client_admin', 'client_member',
          'agency_admin', 'agency_member'
        )
    )
  );

-- Platform admins can read any resume.
drop policy if exists "resumes_select_admin" on storage.objects;
create policy "resumes_select_admin"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'resumes'
    and public.is_platform_admin()
  );
