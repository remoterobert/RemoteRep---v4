-- Allow hiring tenants to declare multiple roles they're hiring for during
-- onboarding (e.g., "we're hiring both SDRs and Closers").
-- tenant_hiring_intents already supports multiple rows per tenant; we just
-- need the onboarding function to accept an array.

drop function if exists public.complete_hiring_onboarding(text, text, text, public.sales_role);

create or replace function public.complete_hiring_onboarding(
  p_first_name text,
  p_last_name text,
  p_company_name text,
  p_hiring_for public.sales_role[]
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

  if array_length(p_hiring_for, 1) is null or array_length(p_hiring_for, 1) = 0 then
    raise exception 'At least one hiring role must be selected';
  end if;

  update public.users
  set first_name = trim(p_first_name),
      last_name = trim(p_last_name),
      display_name = trim(p_first_name) || ' ' || trim(p_last_name)
  where id = v_user_id;

  v_slug := lower(regexp_replace(p_company_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := regexp_replace(v_slug, '^-+|-+$', '', 'g');
  if v_slug = '' then
    v_slug := 'tenant';
  end if;
  v_slug := substring(v_slug, 1, 50) || '-' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 6);

  insert into public.tenants (slug, name, type, status)
  values (v_slug, p_company_name, 'client_company', 'active')
  returning id into v_tenant_id;

  insert into public.tenant_members (tenant_id, user_id, role, status)
  values (v_tenant_id, v_user_id, 'client_admin', 'active');

  -- One hiring_intent per chosen role.
  foreach v_role in array p_hiring_for loop
    insert into public.tenant_hiring_intents (tenant_id, sales_role, created_by_user_id)
    values (v_tenant_id, v_role, v_user_id)
    on conflict do nothing;
  end loop;

  return v_tenant_id;
end;
$$;

grant execute on function public.complete_hiring_onboarding(text, text, text, public.sales_role[]) to authenticated;
