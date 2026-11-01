-- =========================
-- HARDEN STORAGE INSERT POLICIES
-- =========================

drop policy if exists "Users can upload artworks" on storage.objects;

create policy "Users can upload own artwork folder only"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'artworks'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);

drop policy if exists "Users can upload avatars" on storage.objects;

create policy "Users can upload own avatar folder only"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);