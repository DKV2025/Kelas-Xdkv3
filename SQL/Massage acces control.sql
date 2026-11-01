-- =========================
-- MESSAGES TABLE
-- =========================

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),

  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,

  post_id uuid references public.posts(id) on delete set null,

  message text not null,

  created_at timestamptz not null default now(),
  read_at timestamptz
);

alter table public.messages enable row level security;

-- =========================
-- MESSAGES POLICIES
-- =========================

drop policy if exists "Users can view their own messages" on public.messages;
create policy "Users can view their own messages"
on public.messages
for select
using (
  auth.uid() = sender_id
  or auth.uid() = receiver_id
);

drop policy if exists "Users can send messages" on public.messages;
create policy "Users can send messages"
on public.messages
for insert
with check (
  auth.uid() = sender_id
);

drop policy if exists "Users can update received messages" on public.messages;
create policy "Users can update received messages"
on public.messages
for update
using (
  auth.uid() = receiver_id
)
with check (
  auth.uid() = receiver_id
);

drop policy if exists "Users can delete own sent messages" on public.messages;
create policy "Users can delete own sent messages"
on public.messages
for delete
using (
  auth.uid() = sender_id
);