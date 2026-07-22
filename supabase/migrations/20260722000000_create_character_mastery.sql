-- Per-character mastery XP.
--
-- A character earns XP when a completed set practises it AFTER the set that
-- first unlocked it, and loses XP on a wrong answer. It powers the mastery bar
-- on the character collection and, later, the review scheduler.

create table if not exists public.character_mastery (
    user_id    uuid        not null references auth.users (id) on delete cascade,
    character  text        not null,
    xp         integer     not null default 0,
    updated_at timestamptz not null default now(),
    primary key (user_id, character)
);

alter table public.character_mastery enable row level security;

-- Mastery is personal, not currency: a learner reads and writes only their own
-- rows, and adjusting their own mastery only affects their own learning — so
-- unlike gold, no SECURITY DEFINER guard is needed. Deletes are admin-only
-- (reset progress) through the secret key, which bypasses RLS, so there is no
-- delete policy on purpose.
create policy "read own mastery"
    on public.character_mastery for select
    to authenticated
    using ((select auth.uid()) = user_id);

create policy "insert own mastery"
    on public.character_mastery for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

create policy "update own mastery"
    on public.character_mastery for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

grant select, insert, update on public.character_mastery to authenticated;
