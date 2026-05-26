-- Chat threads + messages + participation.
-- v3 stored all chat messages as a nested array in the chat row; v4 normalizes.

create table public.chats (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,  -- nullable: candidate↔candidate not tenant-scoped
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  -- Optional: link a chat to a listing or application for context
  related_listing_id uuid references public.listings(id) on delete set null,
  related_application_id uuid references public.applications(id) on delete set null
);

create index chats_tenant_idx on public.chats(tenant_id, last_message_at desc);

create table public.chat_participants (
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  notification_preference text not null default 'all' check (notification_preference in ('all', 'mentions', 'muted')),
  primary key (chat_id, user_id)
);

create index chat_participants_user_idx on public.chat_participants(user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  author_user_id uuid not null references public.users(id) on delete cascade,
  body text not null check (char_length(body) <= 5000),
  attachments jsonb not null default '[]'::jsonb,
  edited_at timestamptz,
  deleted_at timestamptz,
  deleted_by_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create index messages_chat_created_idx on public.messages(chat_id, created_at);
create index messages_author_idx on public.messages(author_user_id, created_at desc);

-- Update last_message_at on chat when a new message arrives
create or replace function public.update_chat_last_message_at()
returns trigger
language plpgsql
as $$
begin
  update public.chats
  set last_message_at = new.created_at
  where id = new.chat_id;
  return new;
end;
$$;

create trigger messages_update_chat_last_message
  after insert on public.messages
  for each row execute function public.update_chat_last_message_at();

-- RLS
alter table public.chats enable row level security;
alter table public.chat_participants enable row level security;
alter table public.messages enable row level security;

-- Participants can see chats they're in.
create policy chats_select_participant on public.chats
  for select using (
    exists (
      select 1 from public.chat_participants cp
      where cp.chat_id = chats.id and cp.user_id = auth.uid()
    )
    or public.is_platform_admin()
  );

-- Participants can see other participants of the same chat.
create policy chat_participants_select_co_member on public.chat_participants
  for select using (
    exists (
      select 1 from public.chat_participants cp
      where cp.chat_id = chat_participants.chat_id and cp.user_id = auth.uid()
    )
    or public.is_platform_admin()
  );

-- A participant can update their own row (e.g., last_read_at, notification pref).
create policy chat_participants_update_self on public.chat_participants
  for update using (auth.uid() = user_id);

-- Messages: visible to chat participants.
create policy messages_select_participant on public.messages
  for select using (
    exists (
      select 1 from public.chat_participants cp
      where cp.chat_id = messages.chat_id and cp.user_id = auth.uid()
    )
    or public.is_platform_admin()
  );

-- Authors can update/delete their own messages (soft delete preferred).
create policy messages_update_own on public.messages
  for update using (auth.uid() = author_user_id);

-- Inserts: a participant can post in their chat.
create policy messages_insert_participant on public.messages
  for insert with check (
    author_user_id = auth.uid()
    and exists (
      select 1 from public.chat_participants cp
      where cp.chat_id = messages.chat_id and cp.user_id = auth.uid()
    )
  );

comment on table public.chats is
  'Conversation thread. Participants in chat_participants. Messages normalized into their own table (replaces v3 nested arrays).';
