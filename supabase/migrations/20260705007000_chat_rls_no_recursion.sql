-- Fix infinite-recursion RLS policies on chat_participants, chats, messages.
--
-- The original migration (20260526010500_chats_messages.sql) wrote policies
-- like:
--
--   create policy chat_participants_select_co_member on public.chat_participants
--     for select using (
--       exists (
--         select 1 from public.chat_participants cp
--         where cp.chat_id = chat_participants.chat_id and cp.user_id = auth.uid()
--       )
--     );
--
-- When Postgres evaluates the subquery, the same SELECT policy fires on the
-- subquery's chat_participants scan, and that subquery itself references
-- chat_participants, and so on. Postgres detects the recursion and errors:
--
--   ERROR: 42P17: infinite recursion detected in policy for relation "chat_participants"
--
-- Nobody hit this until the apply-to-listing flow started redirecting the
-- rep straight into /chats/[id] after applying. Previously chats were only
-- surfaced from /chats index queries filtered by user_id, which happened to
-- dodge the recursion.
--
-- Fix: define a SECURITY DEFINER helper `is_chat_participant()` that reads
-- chat_participants outside the caller's RLS context (no recursion), and
-- rewrite the SELECT policies on the three chat tables to use it.

create or replace function public.is_chat_participant(
  p_chat_id uuid,
  p_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.chat_participants
    where chat_id = p_chat_id
      and user_id = p_user_id
  );
$$;

grant execute on function public.is_chat_participant(uuid, uuid)
  to authenticated, anon;

comment on function public.is_chat_participant(uuid, uuid) is
  'RLS helper. Runs as definer so it can read chat_participants without re-triggering RLS, avoiding the infinite recursion the original inline policies hit.';

-- ---------------------------------------------------------------------
-- chat_participants: users can see the roster of any chat they''re in.
-- ---------------------------------------------------------------------
drop policy if exists chat_participants_select_co_member on public.chat_participants;
create policy chat_participants_select_co_member on public.chat_participants
  for select using (
    public.is_chat_participant(chat_participants.chat_id, auth.uid())
    or public.is_platform_admin()
  );

-- ---------------------------------------------------------------------
-- chats: users can see chats they participate in.
-- ---------------------------------------------------------------------
drop policy if exists chats_select_participant on public.chats;
create policy chats_select_participant on public.chats
  for select using (
    public.is_chat_participant(chats.id, auth.uid())
    or public.is_platform_admin()
  );

-- ---------------------------------------------------------------------
-- messages: users can see + write messages in chats they participate in.
-- The original messages_select_participant and messages_insert_participant
-- policies referenced chat_participants directly, which is fine on its own
-- (no self-recursion), but they still get evaluated inside a session where
-- Postgres has already flagged chat_participants as recursive. Switching
-- them to the helper is safer and cheaper.
-- ---------------------------------------------------------------------
drop policy if exists messages_select_participant on public.messages;
create policy messages_select_participant on public.messages
  for select using (
    public.is_chat_participant(messages.chat_id, auth.uid())
    or public.is_platform_admin()
  );

drop policy if exists messages_insert_participant on public.messages;
create policy messages_insert_participant on public.messages
  for insert with check (
    author_user_id = auth.uid()
    and public.is_chat_participant(messages.chat_id, auth.uid())
  );
