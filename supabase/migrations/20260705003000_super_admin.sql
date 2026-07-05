-- Super Admin tier.
--
-- Adds users.is_super_admin as a hardcoded protection flag reserved
-- for the business owner. Super Admin is BOOTSTRAP-ONLY: you can only
-- create one by direct SQL update, never through the admin UI.
--
-- Guardrails enforced in application code (src/app/admin/users/actions.ts):
--   - deleteUserPermanently refuses to delete a super admin
--   - updateUserFields does not modify is_super_admin (SQL-only field)
--   - the Edit User modal disables the "admin" toggle for super admins
--
-- To promote the business owner, run (after this migration):
--   UPDATE public.users SET is_super_admin = true
--    WHERE LOWER(email) = LOWER('owner@example.com');

alter table public.users
  add column if not exists is_super_admin boolean not null default false;

comment on column public.users.is_super_admin is
  'Business-owner tier. Cannot be created, demoted, or deleted from the admin UI. Set via SQL only.';

-- Index for the (rare) super-admin lookups.
create index if not exists users_is_super_admin_idx
  on public.users(is_super_admin)
  where is_super_admin = true;
