-- =========================
-- ACTIVITY LOGS
-- =========================

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.activity_logs enable row level security;

drop policy if exists "Users can insert own activity logs" on public.activity_logs;

create policy "Users can insert own activity logs"
on public.activity_logs
for insert
to authenticated
with check (
  auth.uid() = user_id
);

drop policy if exists "Admins can view all activity logs" on public.activity_logs;

create policy "Admins can view all activity logs"
on public.activity_logs
for select
to authenticated
using (
  public.is_admin(auth.uid())
);