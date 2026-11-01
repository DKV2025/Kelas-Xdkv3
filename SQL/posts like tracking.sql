create table if not exists post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),

  unique(post_id, user_id)
);

alter table post_likes enable row level security;

create policy "Anyone can view likes"
on post_likes
for select
using (true);

create policy "Users can like posts"
on post_likes
for insert
with check (auth.uid() = user_id);

create policy "Users can unlike own likes"
on post_likes
for delete
using (auth.uid() = user_id);