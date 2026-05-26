-- Postgres functions called by Phase 1d onboarding server actions.
-- SECURITY DEFINER so the authenticated client can create tenants + memberships
-- without needing INSERT policies on those tables. Each function validates the
-- caller is authenticated and not already onboarded into a conflicting state.

-- ===========================================================
-- Hiring company onboarding
-- Creates a client_company tenant, adds the caller as client_admin,
-- records a hiring intent, and (optionally) sets the user's name.
-- ===========================================================
create or replace function public.complete_hiring_onboarding(
  p_first_name text,
  p_last_name text,
  p_company_name text,
  p_hiring_for public.sales_role
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_tenant_id uuid;
  v_slug text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Refuse if user is already a member of any tenant.
  if exists (select 1 from public.tenant_members where user_id = v_user_id) then
    raise exception 'User already has a tenant membership';
  end if;

  -- Set the user's name.
  update public.users
  set first_name = trim(p_first_name),
      last_name = trim(p_last_name),
      display_name = trim(p_first_name) || ' ' || trim(p_last_name)
  where id = v_user_id;

  -- Generate a URL-safe unique slug from the company name.
  v_slug := lower(regexp_replace(p_company_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := regexp_replace(v_slug, '^-+|-+$', '', 'g');
  if v_slug = '' then
    v_slug := 'tenant';
  end if;
  -- Append short suffix to keep unique.
  v_slug := substring(v_slug, 1, 50) || '-' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 6);

  insert into public.tenants (slug, name, type, status)
  values (v_slug, p_company_name, 'client_company', 'active')
  returning id into v_tenant_id;

  insert into public.tenant_members (tenant_id, user_id, role, status)
  values (v_tenant_id, v_user_id, 'client_admin', 'active');

  insert into public.tenant_hiring_intents (tenant_id, sales_role, created_by_user_id)
  values (v_tenant_id, p_hiring_for, v_user_id)
  on conflict do nothing;

  return v_tenant_id;
end;
$$;

comment on function public.complete_hiring_onboarding is
  'Phase 1d hiring onboarding: creates client_company tenant + client_admin membership + hiring intent. Returns tenant id.';

-- ===========================================================
-- Candidate (sales rep) onboarding
-- Creates a solo_talent "tenant of one", adds candidate role,
-- creates candidate_profile, records specialties.
-- ===========================================================
create or replace function public.complete_candidate_onboarding(
  p_first_name text,
  p_last_name text,
  p_specialty_roles public.sales_role[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_tenant_id uuid;
  v_slug text;
  v_role public.sales_role;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from public.tenant_members where user_id = v_user_id) then
    raise exception 'User already has a tenant membership';
  end if;

  if array_length(p_specialty_roles, 1) is null or array_length(p_specialty_roles, 1) = 0 then
    raise exception 'At least one sales role must be selected';
  end if;

  -- Set name on the user record.
  update public.users
  set first_name = trim(p_first_name),
      last_name = trim(p_last_name),
      display_name = trim(p_first_name) || ' ' || trim(p_last_name)
  where id = v_user_id;

  -- Slug from name plus a short suffix.
  v_slug := lower(regexp_replace(trim(p_first_name) || '-' || trim(p_last_name), '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := regexp_replace(v_slug, '^-+|-+$', '', 'g');
  if v_slug = '' then
    v_slug := 'candidate';
  end if;
  v_slug := substring(v_slug, 1, 50) || '-' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 6);

  insert into public.tenants (slug, name, type, status)
  values (v_slug, trim(p_first_name) || ' ' || trim(p_last_name), 'solo_talent', 'active')
  returning id into v_tenant_id;

  insert into public.tenant_members (tenant_id, user_id, role, status)
  values (v_tenant_id, v_user_id, 'candidate', 'active');

  -- Create candidate_profile (starts hidden; user can flip to public from settings).
  insert into public.candidate_profiles (user_id, visibility, onboarding_completed_at)
  values (v_user_id, 'hidden', now())
  on conflict (user_id) do nothing;

  -- Record specialties.
  foreach v_role in array p_specialty_roles loop
    insert into public.candidate_specialties (user_id, sales_role)
    values (v_user_id, v_role)
    on conflict do nothing;
  end loop;

  return v_tenant_id;
end;
$$;

comment on function public.complete_candidate_onboarding is
  'Phase 1d candidate onboarding: creates solo_talent tenant + candidate membership + profile + specialties.';

-- Allow authenticated users to call these functions.
grant execute on function public.complete_hiring_onboarding(text, text, text, public.sales_role) to authenticated;
grant execute on function public.complete_candidate_onboarding(text, text, public.sales_role[]) to authenticated;
