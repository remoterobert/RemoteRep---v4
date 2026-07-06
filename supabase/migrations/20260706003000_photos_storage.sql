-- Storage bucket + RLS for candidate profile photos.
--
-- Public bucket: photos appear on public /profiles/[id] pages and in
-- Kanban / candidate cards, so read is unrestricted. Writes are
-- limited to the owning user (photo lives under their own folder).
--
-- Path convention: `{user_id}/photo-{timestamp}.{ext}`.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos',
  'photos',
  true,
  5 * 1024 * 1024,
  array[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "photos_insert_own" on storage.objects;
create policy "photos_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "photos_update_own" on storage.objects;
create policy "photos_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "photos_delete_own" on storage.objects;
create policy "photos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read comes from bucket.public = true — no SELECT policy needed.
