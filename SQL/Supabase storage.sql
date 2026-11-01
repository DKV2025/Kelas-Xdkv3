-- =========================
-- STORAGE POLICIES
-- Buckets:
-- artworks
-- avatars
-- =========================

-- Allow everyone to read public files from artworks and avatars
drop policy if exists "Public can read artworks and avatars" on storage.objects;
create policy "Public can read artworks and avatars"
on storage.objects
for select
using (
  bucket_id in ('artworks', 'avatars')
);

-- Allow authenticated users to upload artworks
drop policy if exists "Users can upload artworks" on storage.objects;
create policy "Users can upload artworks"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'artworks'
);

-- Allow authenticated users to upload avatars
drop policy if exists "Users can upload avatars" on storage.objects;
create policy "Users can upload avatars"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
);

-- Allow users to update their own artwork files
drop policy if exists "Users can update own artworks" on storage.objects;
create policy "Users can update own artworks"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'artworks'
  and owner = auth.uid()
)
with check (
  bucket_id = 'artworks'
  and owner = auth.uid()
);

-- Allow users to delete their own artwork files
drop policy if exists "Users can delete own artworks" on storage.objects;
create policy "Users can delete own artworks"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'artworks'
  and owner = auth.uid()
);

-- Allow users to update their own avatar files
drop policy if exists "Users can update own avatars" on storage.objects;
create policy "Users can update own avatars"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and owner = auth.uid()
)
with check (
  bucket_id = 'avatars'
  and owner = auth.uid()
);

-- Allow users to delete their own avatar files
drop policy if exists "Users can delete own avatars" on storage.objects;
create policy "Users can delete own avatars"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and owner = auth.uid()
);