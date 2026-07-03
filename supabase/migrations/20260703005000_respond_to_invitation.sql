-- Candidate responds to an invitation: 'interested' → status='interviewing',
-- 'not_interested' → status='withdrawn'. Notifies the hiring tenant's
-- admins/members and writes an event.

create or replace function public.respond_to_invitation(
  p_application_id uuid,
  p_response text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_application record;
  v_tenant_name text;
  v_new_status public.application_status;
  v_candidate_name text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_response not in ('interested', 'not_interested') then
    raise exception 'Invalid response: %', p_response;
  end if;

  select a.*, t.name as _tenant_name into v_application
  from public.applications a
  join public.tenants t on t.id = a.tenant_id
  where a.id = p_application_id;

  if v_application is null then
    raise exception 'Application not found';
  end if;

  if v_application.candidate_user_id != v_user_id then
    raise exception 'Not your application';
  end if;

  if v_application.status != 'invited' then
    raise exception 'Already responded to this invitation';
  end if;

  v_tenant_name := v_application._tenant_name;

  v_new_status := case p_response
    when 'interested' then 'interviewing'::public.application_status
    when 'not_interested' then 'withdrawn'::public.application_status
  end;

  update public.applications
  set status = v_new_status,
      last_status_change_at = now(),
      updated_at = now()
  where id = p_application_id;

  select
    coalesce(nullif(trim(u.display_name), ''), nullif(trim(u.first_name || ' ' || u.last_name), ''), u.email, 'A candidate')
  into v_candidate_name
  from public.users u
  where u.id = v_user_id;

  -- Notify every active client_admin/agency_admin/client_member/agency_member of the hiring tenant.
  insert into public.notifications (
    user_id, tenant_id, kind, entity_type, entity_id, title, body, payload, deduplication_key
  )
  select
    tm.user_id,
    v_application.tenant_id,
    'talent_application',
    'application',
    v_application.id,
    v_candidate_name || ' responded',
    case p_response
      when 'interested' then v_candidate_name || ' is interested — reach out to schedule.'
      when 'not_interested' then v_candidate_name || ' passed for now.'
    end,
    jsonb_build_object(
      'application_id', v_application.id,
      'response', p_response,
      'candidate_user_id', v_user_id
    ),
    'response:' || v_application.id::text || ':' || tm.user_id::text
  from public.tenant_members tm
  where tm.tenant_id = v_application.tenant_id
    and tm.status = 'active'
    and tm.role in ('client_admin', 'client_member', 'agency_admin', 'agency_member')
  on conflict (user_id, deduplication_key) do update
    set updated_at = now(),
        seen_at = null,
        payload = excluded.payload;

  insert into public.events (
    tenant_id, actor_user_id, event_type, entity_type, entity_id, payload
  )
  values (
    v_application.tenant_id,
    v_user_id,
    'candidate.responded',
    'application',
    v_application.id,
    jsonb_build_object('response', p_response)
  );
end $$;

grant execute on function public.respond_to_invitation(uuid, text) to authenticated;

comment on function public.respond_to_invitation(uuid, text) is
  'Candidate accepts (→interviewing) or declines (→withdrawn) an invitation. Notifies hiring tenant.';
