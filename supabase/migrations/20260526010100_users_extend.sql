-- Extend public.users with v3-equivalent fields and rename `display_name`
-- to something cleaner. Adds first_name/last_name for proper form collection.

alter table public.users
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists address_city text,
  add column if not exists address_state text,
  add column if not exists address_country text check (address_country is null or address_country ~ '^[A-Z]{2}$'),
  add column if not exists address_zip text,
  add column if not exists creation_reference text;

-- Auto-bump status from pending_verification to active when auth.users
-- email_confirmed_at transitions from null to a value.
create or replace function public.handle_email_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.users
    set status = 'active'
    where id = new.id
      and status = 'pending_verification';
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_email_verified on auth.users;
create trigger on_auth_email_verified
  after update on auth.users
  for each row execute function public.handle_email_verified();

comment on function public.handle_email_verified() is
  'Promotes public.users.status from pending_verification to active when the user verifies their email.';
