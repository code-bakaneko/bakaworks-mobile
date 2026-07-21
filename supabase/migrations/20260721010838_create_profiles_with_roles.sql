-- One profile row per auth user, holding their role.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A user may read their own profile. There is deliberately no update/insert
-- policy: roles are managed server-side (SQL / service key), never by the user.
create policy "Users can read own profile"
  on public.profiles for select
  using ((select auth.uid()) = id);

-- Auto-create a profile whenever a new auth user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any users that already exist.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;
