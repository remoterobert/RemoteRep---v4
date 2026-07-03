-- One-time seed: create the RemoteRep platform tenant (if missing) and
-- grant robert@remoterep.com the platform_admin role in it.
--
-- Idempotent: safe to re-run. Silently skips if the target user doesn't
-- exist yet (e.g., in a fresh environment where nobody has signed up).
--
-- When we add staging/dev environments later, this migration should be
-- moved out of the main migrations set (or gated by an env variable).

do $$
declare
  v_user_id uuid;
  v_platform_tenant_id uuid;
begin
  -- Find target user by email
  select id into v_user_id
  from auth.users
  where email = 'robert@remoterep.com'
  limit 1;

  if v_user_id is null then
    raise notice 'User robert@remoterep.com not found; skipping platform admin seed.';
    return;
  end if;

  -- Create the platform tenant (once)
  insert into public.tenants (slug, name, type, status)
  values ('remoterep-platform', 'RemoteRep Platform', 'platform', 'active')
  on conflict (slug) do nothing;

  select id into v_platform_tenant_id
  from public.tenants
  where slug = 'remoterep-platform'
  limit 1;

  -- Grant platform_admin membership (allows multiple memberships per user)
  insert into public.tenant_members (tenant_id, user_id, role, status)
  values (v_platform_tenant_id, v_user_id, 'platform_admin', 'active')
  on conflict (tenant_id, user_id, role) do nothing;

  raise notice 'Granted platform_admin to robert@remoterep.com in tenant %', v_platform_tenant_id;
end $$;
