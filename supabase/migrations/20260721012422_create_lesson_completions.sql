-- Records which lessons a user has finished. Drives sequential level unlocks:
-- a lesson is unlocked once the previous lesson has a completion row.
create table public.lesson_completions (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id bigint not null references public.lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table public.lesson_completions enable row level security;

-- A user may see and record only their own completions.
create policy "Users can read own completions"
  on public.lesson_completions for select
  using ((select auth.uid()) = user_id);

create policy "Users can record own completions"
  on public.lesson_completions for insert
  with check ((select auth.uid()) = user_id);
