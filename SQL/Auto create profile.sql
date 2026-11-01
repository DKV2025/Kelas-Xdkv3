-- =========================
-- AUTO CREATE PROFILE AFTER SIGN UP
-- =========================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    username,
    avatar_url,
    bio,
    instagram,
    role
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'User'),
    'images/pp-01.png',
    null,
    null,
    'user'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();