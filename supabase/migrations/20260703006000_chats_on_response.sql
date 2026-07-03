-- When a candidate says "I'm interested" on an invitation, create a chat
-- linking them to all hiring-side members of the inviting tenant so
-- scheduling / follow-up can happen inside the app.

-- Also enable Supabase Realtime for the messages table so client
-- subscriptions pick up new messages instantly.

alter publication supabase_realtime add table public.messages;

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
  v_chat_id uuid;
  v_participant record;
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

  -- ============================================================
  -- If interested → open a chat between candidate and hiring tenant
  -- ============================================================
  if p_response = 'interested' then
    select id into v_chat_id
    from public.chats
    where related_application_id = p_application_id;

    if v_chat_id is null then
      insert into public.chats (tenant_id, related_application_id, last_message_at)
      values (v_application.tenant_id, v_application.id, now())
      returning id into v_chat_id;

      -- Candidate is a participant
      insert into public.chat_participants (chat_id, user_id)
      values (v_chat_id, v_user_id)
      on conflict do nothing;

      -- Every active hiring-role member of the tenant is a participant
      for v_participant in
        select tm.user_id
        from public.tenant_members tm
        where tm.tenant_id = v_application.tenant_id
          and tm.status = 'active'
          and tm.role in ('client_admin', 'client_member', 'agency_admin', 'agency_member')
      loop
        insert into public.chat_participants (chat_id, user_id)
        values (v_chat_id, v_participant.user_id)
        on conflict do nothing;
      end loop;

      -- Seed the conversation with the candidate's implicit "I'm interested".
      insert into public.messages (chat_id, author_user_id, body)
      values (v_chat_id, v_user_id, 'I''m interested — let''s find a time to talk.');
    end if;
  end if;

  -- Notify hiring tenant members
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
      'candidate_user_id', v_user_id,
      'chat_id', v_chat_id
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
    jsonb_build_object('response', p_response, 'chat_id', v_chat_id)
  );
end $$;

grant execute on function public.respond_to_invitation(uuid, text) to authenticated;
