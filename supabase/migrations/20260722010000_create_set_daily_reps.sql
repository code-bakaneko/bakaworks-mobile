-- Counts how many times a learner completes each set on a given day, so that
-- repeated practice of the same content within one day earns diminishing XP.
-- Massed practice does not consolidate; the app rewards spacing it out.

create table if not exists public.set_daily_reps (
    user_id    uuid    not null references auth.users (id) on delete cascade,
    lesson_id  bigint  not null references public.lessons (id) on delete cascade,
    set_number integer not null,
    day        date    not null,
    reps       integer not null default 0,
    primary key (user_id, lesson_id, set_number, day)
);

alter table public.set_daily_reps enable row level security;

-- A learner reads and writes only their own counters. Deletes are admin-only
-- (reset progress) through the secret key, which bypasses RLS.
create policy "read own reps"
    on public.set_daily_reps for select
    to authenticated
    using ((select auth.uid()) = user_id);

create policy "insert own reps"
    on public.set_daily_reps for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

create policy "update own reps"
    on public.set_daily_reps for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

grant select, insert, update on public.set_daily_reps to authenticated;
