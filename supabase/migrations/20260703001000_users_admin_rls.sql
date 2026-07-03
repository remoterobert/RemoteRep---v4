-- Platform admins need to see all users for the /admin/users page.
-- The existing `users_select_self` policy limits everyone to their own
-- row; we add an admin override to grant cross-user visibility.
--
-- Write policies (update/delete) are deliberately NOT added — those
-- happen through purpose-built admin actions later (with audit_log
-- entries) rather than raw table writes.

create policy users_select_platform_admin on public.users
  for select using (public.is_platform_admin());
