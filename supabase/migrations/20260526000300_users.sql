-- Application-level user record. 1:1 with auth.users (id is shared).
-- Holds extended fields beyond what Supabase Auth manages itself.
-- See docs/V4-DATA-MODEL.md §4.1.

create type public.user_status as enum (
  'active',
  'suspended',
  'deleted',
  'pending_verification'
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  phone text,
  timezone text,
  status public.user_status not null default 'pending_verification',
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index users_email_idx on public.users(email);
create index users_status_idx on public.users(status);

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- Auto-create a public.users row whenever a new auth.users row appears.
-- Runs as the function owner (postgres) via SECURITY DEFINER so the
-- inserting client (the new user, who has no public.users row yet) does
-- not need INSERT privileges on the table.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, status)
  values (new.id, new.email, 'pending_verification')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- RLS
alter table public.users enable row level security;

-- A user can read and update their own row.
-- Sensitive columns (status, email) are managed via service role or
-- dedicated flows; column-level restrictions enforced in app code.
create policy users_select_self on public.users
  for select using (auth.uid() = id);

create policy users_update_self on public.users
  for update using (auth.uid() = id);

comment on table public.users is
  'App-level user record. 1:1 with auth.users; auto-created via trigger on signup.';
