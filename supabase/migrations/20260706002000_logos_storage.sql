-- Storage bucket + RLS for company logos.
--
-- Public bucket: candidates + anonymous visitors see logos on the
-- listing/company pages, so read is unrestricted. Writes are limited
-- to client_admin / agency_admin of the tenant whose folder they're
-- writing into.
--
-- Path convention: `{tenant_id}/logo-{timestamp}.{ext}`. The tenant_id
-- prefix is what RLS uses to authorize writes.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'logos',
  'logos',
  true,
  5 * 1024 * 1024,
  array[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Write policies: caller must be an active admin of the tenant whose
-- id sits at the head of the object path.

drop policy if exists "logos_insert_tenant_admin" on storage.objects;
create policy "logos_insert_tenant_admin"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'logos'
    and exists (
      select 1 from public.tenant_members tm
      where tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in ('client_admin', 'agency_admin')
        and tm.tenant_id::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists "logos_update_tenant_admin" on storage.objects;
create policy "logos_update_tenant_admin"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'logos'
    and exists (
      select 1 from public.tenant_members tm
      where tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in ('client_admin', 'agency_admin')
        and tm.tenant_id::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists "logos_delete_tenant_admin" on storage.objects;
create policy "logos_delete_tenant_admin"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'logos'
    and exists (
      select 1 from public.tenant_members tm
      where tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in ('client_admin', 'agency_admin')
        and tm.tenant_id::text = (storage.foldername(name))[1]
    )
  );

-- Public read is granted automatically because bucket.public = true.
-- No SELECT policy needed for anon or authenticated.
