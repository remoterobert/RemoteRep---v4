-- Rep-initiated application to a listing.
--
-- Mirrors the shape of respond_to_invitation but flipped: rep clicks Apply,
-- we create the application, open a chat with hiring-tenant members, seed
-- it with the rep's intro message (or a default), and fan out notifications
-- to the hiring side.

create or replace function public.apply_to_listing(
  p_listing_id uuid,
  p_message text default null
)
returns table (application_id uuid, chat_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_listing record;
  v_tenant_name text;
  v_candidate_name text;
  v_application_id uuid;
  v_chat_id uuid;
  v_participant record;
  v_seed_message text;
  v_trimmed_msg text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_trimmed_msg := nullif(trim(coalesce(p_message, '')), '');
  if v_trimmed_msg is not null and char_length(v_trimmed_msg) > 500 then
    raise exception 'Message must be 500 characters or fewer';
  end if;

  -- Load the listing (must be published + public for a rep to reach here).
  select l.id, l.tenant_id, l.status, l.visibility, l.title, t.name as _tenant_name
  into v_listing
  from public.listings l
  join public.tenants t on t.id = l.tenant_id
  where l.id = p_listing_id;

  if v_listing is null then
    raise exception 'Listing not found';
  end if;

  if v_listing.status != 'published' or v_listing.visibility != 'public' then
    raise exception 'Listing is not open for applications';
  end if;

  v_tenant_name := v_listing._tenant_name;

  -- Idempotent: if this rep already applied to this listing, reuse it.
  select id into v_application_id
  from public.applications
  where listing_id = p_listing_id
    and candidate_user_id = v_user_id;

  if v_application_id is null then
    insert into public.applications (
      tenant_id, listing_id, candidate_user_id, status, message,
      applied_at, last_status_change_at
    ) values (
      v_listing.tenant_id, p_listing_id, v_user_id, 'applied', v_trimmed_msg,
      now(), now()
    )
    returning id into v_application_id;
  else
    -- Existing app — bump message if the rep provided a fresh one.
    if v_trimmed_msg is not null then
      update public.applications
      set message = v_trimmed_msg,
          updated_at = now()
      where id = v_application_id;
    end if;
  end if;

  -- Candidate display name for chat + notifications
  select
    coalesce(
      nullif(trim(u.display_name), ''),
      nullif(trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')), ''),
      u.email,
      'A candidate'
    )
  into v_candidate_name
  from public.users u
  where u.id = v_user_id;

  -- ============================================================
  -- Open (or reuse) a chat between rep and hiring tenant members.
  -- ============================================================
  select id into v_chat_id
  from public.chats
  where related_application_id = v_application_id;

  if v_chat_id is null then
    insert into public.chats (tenant_id, related_application_id, last_message_at)
    values (v_listing.tenant_id, v_application_id, now())
    returning id into v_chat_id;

    insert into public.chat_participants (chat_id, user_id)
    values (v_chat_id, v_user_id)
    on conflict do nothing;

    for v_participant in
      select tm.user_id
      from public.tenant_members tm
      where tm.tenant_id = v_listing.tenant_id
        and tm.status = 'active'
        and tm.role in ('client_admin', 'client_member', 'agency_admin', 'agency_member')
    loop
      insert into public.chat_participants (chat_id, user_id)
      values (v_chat_id, v_participant.user_id)
      on conflict do nothing;
    end loop;

    -- Seed message: rep's own intro if provided, else a friendly default.
    v_seed_message := coalesce(
      v_trimmed_msg,
      'I''d like to apply for this role.'
    );

    insert into public.messages (chat_id, author_user_id, body)
    values (v_chat_id, v_user_id, v_seed_message);
  end if;

  -- ============================================================
  -- Notify hiring tenant members. Dedup per application so 10 message
  -- edits don't spam 10 rows.
  -- ============================================================
  insert into public.notifications (
    user_id, tenant_id, kind, entity_type, entity_id, title, body, payload, deduplication_key
  )
  select
    tm.user_id,
    v_listing.tenant_id,
    'talent_application',
    'application',
    v_application_id,
    v_candidate_name || ' applied to ' || v_listing.title,
    coalesce(
      substr(v_trimmed_msg, 1, 140),
      'New application. Reply to start the conversation.'
    ),
    jsonb_build_object(
      'application_id', v_application_id,
      'candidate_user_id', v_user_id,
      'listing_id', p_listing_id,
      'chat_id', v_chat_id
    ),
    'apply:' || v_application_id::text || ':' || tm.user_id::text
  from public.tenant_members tm
  where tm.tenant_id = v_listing.tenant_id
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
    v_listing.tenant_id,
    v_user_id,
    'candidate.applied',
    'application',
    v_application_id,
    jsonb_build_object('listing_id', p_listing_id, 'chat_id', v_chat_id)
  );

  return query select v_application_id, v_chat_id;
end $$;

grant execute on function public.apply_to_listing(uuid, text) to authenticated;

comment on function public.apply_to_listing(uuid, text) is
  'Rep-initiated application. Idempotent per (listing, candidate). Creates application, opens or reuses a chat with the hiring tenant members, seeds first message, and notifies the hiring side.';
