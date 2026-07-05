-- Admin user-management fields.
--
-- Adds columns needed to power the enhanced /admin/users table:
--   - tags[]: free-form strings used to trigger GHL automations
--   - notes: admin-only free-text
--   - access_level: 'free' (default) | 'premium' | 'comp'
--       'comp' = comped premium — non-paying user granted paid features
--   - archived_at: soft-archive marker; archived users hidden from browse
--   - reference_source: how they signed up ("Self-registered", "Invited by X",
--       "Referred by <partner>", etc.)

alter table public.users
  add column if not exists tags text[],
  add column if not exists notes text,
  add column if not exists access_level text
    check (access_level in ('free', 'premium', 'comp')),
  add column if not exists archived_at timestamptz,
  add column if not exists reference_source text;

-- Default all existing rows to 'free' so downstream code can rely on a
-- non-null access level.
update public.users
  set access_level = 'free'
  where access_level is null;

comment on column public.users.tags is
  'Free-form tag strings. Used by admins to trigger GHL automations.';
comment on column public.users.notes is
  'Admin-only internal notes about a user account.';
comment on column public.users.access_level is
  'Access tier: free (default), premium (paying), comp (admin-granted).';
comment on column public.users.archived_at is
  'Soft-archive timestamp. Non-null = hidden from public browsing.';
comment on column public.users.reference_source is
  'How the user reached the platform. Editable by admins.';
