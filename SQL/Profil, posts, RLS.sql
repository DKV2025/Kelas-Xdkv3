-- =========================
-- EXTENSION
-- =========================
create extension if not exists "pgcrypto";

-- =========================
-- PROFILES TABLE
-- =========================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  avatar_url text,
  bio text,
  instagram text,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- POSTS TABLE
-- =========================
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  image_path text,
  category text not null,
  post_type text not null,
  aspect_mode text not null default 'square',
  description text,
  status text not null default 'pending',
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  declined_at timestamptz
);

-- =========================
-- VALIDATION CHECKS
-- =========================
alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check
check (role in ('user', 'admin'));

alter table public.posts
drop constraint if exists posts_status_check;

alter table public.posts
add constraint posts_status_check
check (status in ('pending', 'approved', 'declined'));

alter table public.posts
drop constraint if exists posts_post_type_check;

alter table public.posts
add constraint posts_post_type_check
check (post_type in ('Open Commission', 'Showcase/Feed'));

alter table public.posts
drop constraint if exists posts_aspect_mode_check;

alter table public.posts
add constraint posts_aspect_mode_check
check (aspect_mode in ('square', 'original'));

-- =========================
-- ENABLE RLS
-- =========================
alter table public.profiles enable row level security;
alter table public.posts enable row level security;

-- =========================
-- PROFILES POLICIES
-- =========================

drop policy if exists "Profiles are visible to everyone" on public.profiles;
create policy "Profiles are visible to everyone"
on public.profiles
for select
using (true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- =========================
-- POSTS POLICIES
-- =========================

drop policy if exists "Approved posts are visible to everyone" on public.posts;
create policy "Approved posts are visible to everyone"
on public.posts
for select
using (status = 'approved');

drop policy if exists "Users can view own posts" on public.posts;
create policy "Users can view own posts"
on public.posts
for select
using (auth.uid() = user_id);

drop policy if exists "Admins can view all posts" on public.posts;
create policy "Admins can view all posts"
on public.posts
for select
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

drop policy if exists "Users can insert own pending posts" on public.posts;
create policy "Users can insert own pending posts"
on public.posts
for insert
with check (
  auth.uid() = user_id
  and status = 'pending'
  and is_featured = false
);

drop policy if exists "Users can delete own posts" on public.posts;
create policy "Users can delete own posts"
on public.posts
for delete
using (auth.uid() = user_id);

drop policy if exists "Admins can update posts" on public.posts;
create policy "Admins can update posts"
on public.posts
for update
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can delete posts" on public.posts;
create policy "Admins can delete posts"
on public.posts
for delete
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);
