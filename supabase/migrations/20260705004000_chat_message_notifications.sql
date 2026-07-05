-- Chat message notifications.
--
-- When a new message lands in a chat, notify every OTHER participant.
-- Dedup key is `chat:<chat_id>:<recipient_user_id>`, so ten messages in
-- the same conversation collapse into a single row with message_count
-- incremented and seen_at reset (so the bell reappears if you'd already
-- read the previous notification).
--
-- Runs as SECURITY DEFINER because notifications only have a select/update
-- policy for the row owner — we need to write into other users' rows.

create or replace function public.notify_chat_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chat record;
  v_author_name text;
  v_body_preview text;
begin
  select c.id, c.tenant_id
  into v_chat
  from public.chats c
  where c.id = new.chat_id;

  if v_chat is null then
    return new;
  end if;

  select
    coalesce(
      nullif(trim(u.display_name), ''),
      nullif(trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')), ''),
      u.email,
      'Someone'
    )
  into v_author_name
  from public.users u
  where u.id = new.author_user_id;

  -- Short preview: first 140 chars, single-line
  v_body_preview := regexp_replace(new.body, E'[\r\n]+', ' ', 'g');
  if char_length(v_body_preview) > 140 then
    v_body_preview := substr(v_body_preview, 1, 137) || '...';
  end if;

  insert into public.notifications (
    user_id, tenant_id, kind, entity_type, entity_id, title, body, payload,
    deduplication_key, message_count
  )
  select
    cp.user_id,
    v_chat.tenant_id,
    'chat'::public.notification_kind,
    'chat',
    new.chat_id,
    v_author_name,
    v_body_preview,
    jsonb_build_object(
      'chat_id', new.chat_id,
      'message_id', new.id,
      'author_user_id', new.author_user_id
    ),
    'chat:' || new.chat_id::text || ':' || cp.user_id::text,
    1
  from public.chat_participants cp
  where cp.chat_id = new.chat_id
    and cp.user_id <> new.author_user_id
  on conflict (user_id, deduplication_key) do update
    set updated_at = now(),
        seen_at = null,
        title = excluded.title,
        body = excluded.body,
        payload = excluded.payload,
        message_count = notifications.message_count + 1;

  return new;
end $$;

drop trigger if exists messages_notify_chat_message on public.messages;
create trigger messages_notify_chat_message
  after insert on public.messages
  for each row execute function public.notify_chat_message();

comment on function public.notify_chat_message() is
  'Trigger: fans out a notification to every other chat participant on new message. Deduped so a chat with 10 unread messages = 1 notification row with message_count=10.';
