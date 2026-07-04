-- Fix RLS so the public /listings/[id] and /profiles/[id] pages actually
-- render for anyone (auth'd or not).
--
-- The bug: on the listing page we do `tenants!inner(...)` to grab the
-- company name for the sidebar. tenants.select was gated on being a
-- member, so any non-member (candidate, non-logged-in visitor) got the
-- tenant row filtered out, the !inner join dropped the whole listing
-- row, and the page 404'd via notFound().
--
-- Same class of bug on client_profiles (auth-required) and users
-- (self-only) — needed to make profile pages render for non-owners.

-- =====================================================================
-- tenants: readable if tenant owns any published+public listing
-- =====================================================================
drop policy if exists tenants_select_via_public_listing on public.tenants;
create policy tenants_select_via_public_listing on public.tenants
  for select using (
    exists (
      select 1 from public.listings l
      where l.tenant_id = tenants.id
        and l.status = 'published'
        and l.visibility = 'public'
    )
  );

-- Also readable if a candidate profile inside this tenant is public
-- (candidates are members of a solo_talent tenant).
drop policy if exists tenants_select_via_public_candidate on public.tenants;
create policy tenants_select_via_public_candidate on public.tenants
  for select using (
    exists (
      select 1
      from public.tenant_members tm
      join public.candidate_profiles cp on cp.user_id = tm.user_id
      where tm.tenant_id = tenants.id
        and cp.visibility = 'public'
    )
  );

-- =====================================================================
-- client_profiles: drop the auth-required gate; visibility=public means
-- anyone. Preserves member + admin policies untouched.
-- =====================================================================
drop policy if exists client_profiles_select_public on public.client_profiles;
create policy client_profiles_select_public on public.client_profiles
  for select using (visibility = 'public');

-- =====================================================================
-- users: readable if the user has a public candidate profile. Needed
-- for the profile page's first/last name lookup — otherwise anonymous
-- and hiring-side viewers get null.
-- =====================================================================
drop policy if exists users_select_via_public_candidate on public.users;
create policy users_select_via_public_candidate on public.users
  for select using (
    exists (
      select 1 from public.candidate_profiles cp
      where cp.user_id = users.id
        and cp.visibility = 'public'
    )
  );

-- Also let signed-in users read the first/last name of anyone in the
-- same chat with them (already true de facto via the chats join, but
-- explicit for hiring-side viewing invited candidates).
drop policy if exists users_select_via_shared_application on public.users;
create policy users_select_via_shared_application on public.users
  for select using (
    exists (
      select 1 from public.applications a
      where a.candidate_user_id = users.id
        and a.tenant_id in (select public.user_tenant_ids())
    )
  );
