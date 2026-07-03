-- Allow direct outreach (invitations not tied to a formal listing yet).
-- Applications previously required a listing_id; MVP wants companies to
-- express interest before they've written up a full job post.
alter table public.applications
  alter column listing_id drop not null;

-- Prevent duplicate direct invitations of the same candidate by the
-- same tenant (partial unique so listing-based apps aren't affected).
create unique index if not exists applications_no_dup_direct_invites
  on public.applications (tenant_id, candidate_user_id)
  where listing_id is null and status = 'invited';

-- ============================================================
-- invite_candidate(candidate_user_id, message)
-- Caller must be an active member of a hiring tenant (client_company
-- or agency). Creates an application (or returns existing), inserts a
-- notification for the candidate, and writes an event.
-- ============================================================
create or replace function public.invite_candidate(
  p_candidate_user_id uuid,
  p_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_tenant_id uuid;
  v_tenant_name text;
  v_application_id uuid;
begin
  if v_actor_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Find a hiring tenant the caller belongs to.
  select t.id, t.name into v_tenant_id, v_tenant_name
  from public.tenant_members tm
  join public.tenants t on t.id = tm.tenant_id
  where tm.user_id = v_actor_user_id
    and tm.status = 'active'
    and t.type in ('client_company', 'agency')
    and t.status = 'active'
  limit 1;

  if v_tenant_id is null then
    raise exception 'Only hiring tenants can invite candidates';
  end if;

  -- If already invited (direct, no listing), return existing id — idempotent.
  select id into v_application_id
  from public.applications
  where tenant_id = v_tenant_id
    and candidate_user_id = p_candidate_user_id
    and listing_id is null
    and status = 'invited';

  if v_application_id is not null then
    return v_application_id;
  end if;

  insert into public.applications (
    tenant_id, listing_id, candidate_user_id, status, message,
    applied_at, last_status_change_at
  )
  values (
    v_tenant_id, null, p_candidate_user_id, 'invited', p_message,
    now(), now()
  )
  returning id into v_application_id;

  -- Notification for the candidate
  insert into public.notifications (
    user_id, tenant_id, kind, entity_type, entity_id, title, body, payload,
    deduplication_key
  )
  values (
    p_candidate_user_id, v_tenant_id, 'client_application', 'application', v_application_id,
    v_tenant_name || ' is interested',
    v_tenant_name || ' invited you. Reply to start the conversation.',
    jsonb_build_object(
      'application_id', v_application_id,
      'hiring_tenant_name', v_tenant_name
    ),
    'invite:' || v_tenant_id::text || ':' || p_candidate_user_id::text
  )
  on conflict (user_id, deduplication_key) do update
    set updated_at = now(),
        payload = excluded.payload;

  -- Event for analytics
  insert into public.events (
    tenant_id, actor_user_id, event_type, entity_type, entity_id, payload
  )
  values (
    v_tenant_id, v_actor_user_id, 'candidate.invited', 'application', v_application_id,
    jsonb_build_object('candidate_user_id', p_candidate_user_id)
  );

  return v_application_id;
end $$;

grant execute on function public.invite_candidate(uuid, text) to authenticated;

comment on function public.invite_candidate(uuid, text) is
  'Hiring tenant invites a candidate (direct, no listing required). Idempotent.';
