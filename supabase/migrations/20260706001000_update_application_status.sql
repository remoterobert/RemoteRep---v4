-- Kanban stage moves: change application.status.
--
-- Authorized movers:
--   - Any active hiring-tenant member of the app's tenant
--     (client_admin / client_member / agency_admin / agency_member)
--   - The candidate themselves (e.g., to withdraw)
--
-- Emits a `application.status_changed` event so /admin/analytics can
-- track pipeline flow. Bumps last_status_change_at + updated_at.

create or replace function public.update_application_status(
  p_application_id uuid,
  p_new_status public.application_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_app record;
  v_authorized boolean;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select a.*
  into v_app
  from public.applications a
  where a.id = p_application_id;

  if v_app is null then
    raise exception 'Application not found';
  end if;

  if v_app.status = p_new_status then
    return;
  end if;

  select
    exists (
      select 1 from public.tenant_members tm
      where tm.user_id = v_user_id
        and tm.tenant_id = v_app.tenant_id
        and tm.status = 'active'
        and tm.role in (
          'client_admin', 'client_member',
          'agency_admin', 'agency_member'
        )
    )
    or v_app.candidate_user_id = v_user_id
    or public.is_platform_admin()
  into v_authorized;

  if not v_authorized then
    raise exception 'Not authorized to change this application';
  end if;

  update public.applications
  set status = p_new_status,
      last_status_change_at = now(),
      updated_at = now()
  where id = p_application_id;

  insert into public.events (
    tenant_id, actor_user_id, event_type, entity_type, entity_id, payload
  )
  values (
    v_app.tenant_id,
    v_user_id,
    'application.status_changed',
    'application',
    p_application_id,
    jsonb_build_object(
      'from', v_app.status,
      'to', p_new_status,
      'listing_id', v_app.listing_id
    )
  );
end $$;

grant execute on function public.update_application_status(uuid, public.application_status)
  to authenticated;

comment on function public.update_application_status(uuid, public.application_status) is
  'Kanban stage transitions. Hiring-tenant members and the candidate themselves may move an application. Emits application.status_changed event.';
