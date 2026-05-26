-- In-app notifications + per-user preferences + web push subscriptions.
-- v3 stored notification arrays inside per-user rows; v4 normalizes.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete cascade,
  kind public.notification_kind not null,

  -- What this notification refers to
  entity_type text,
  entity_id uuid,

  -- Display
  title text,
  body text,

  -- Deduplication: if a similar notification arrives, increment count + bump updated_at instead of inserting a new row.
  deduplication_key text,
  message_count int not null default 1,

  -- Flexible per-kind payload
  payload jsonb not null default '{}'::jsonb,

  -- Lifecycle
  seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, deduplication_key)
);

create index notifications_user_unseen_idx on public.notifications(user_id, created_at desc) where seen_at is null;
create index notifications_user_recent_idx on public.notifications(user_id, created_at desc);

create trigger notifications_set_updated_at
  before update on public.notifications
  for each row execute function public.set_updated_at();

alter table public.notifications enable row level security;

-- A user can only see and update their own notifications.
create policy notifications_select_own on public.notifications
  for select using (auth.uid() = user_id);

create policy notifications_update_own on public.notifications
  for update using (auth.uid() = user_id);

-- ===========================================================
-- Per-user, per-kind delivery preferences.
-- ===========================================================
create table public.notification_channels (
  user_id uuid not null references public.users(id) on delete cascade,
  kind public.notification_kind not null,
  email_enabled boolean not null default true,
  push_enabled boolean not null default true,
  in_app_enabled boolean not null default true,
  primary key (user_id, kind)
);

alter table public.notification_channels enable row level security;

create policy notification_channels_select_own on public.notification_channels
  for select using (auth.uid() = user_id);

create policy notification_channels_write_own on public.notification_channels
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ===========================================================
-- Web Push (VAPID) subscriptions
-- ===========================================================
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  endpoint text not null,
  p256dh_key text not null,
  auth_key text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  unique (user_id, endpoint)
);

create index push_subscriptions_user_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

create policy push_subscriptions_select_own on public.push_subscriptions
  for select using (auth.uid() = user_id);

create policy push_subscriptions_write_own on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

comment on table public.notifications is
  'In-app notification feed. Dedup via deduplication_key. v3 stored these in a per-user nested array.';
