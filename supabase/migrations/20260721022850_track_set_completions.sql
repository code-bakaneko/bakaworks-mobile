-- Progress is per SET, not per lesson.
--
-- Entering a lesson plays the learner's next incomplete set. Finishing it
-- returns them to the map. Entering again plays the next set. The lesson is
-- only complete — and the next lesson only unlocks — once every set of that
-- lesson has a row here.
--
-- Replaces lesson_completions, which recorded a lesson as done after a single
-- run through all of its sets.

create table public.set_completions (
    user_id      uuid    not null references auth.users (id) on delete cascade,
    lesson_id    bigint  not null references public.lessons (id) on delete cascade,
    set_number   integer not null,
    completed_at timestamptz not null default now(),
    primary key (user_id, lesson_id, set_number)
);

alter table public.set_completions enable row level security;

create policy "Users can read own set completions"
    on public.set_completions for select
    to authenticated
    using ((select auth.uid()) = user_id);

create policy "Users can record own set completions"
    on public.set_completions for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

-- Carry over anything already finished: an old lesson completion meant the
-- learner had played every set in that lesson.
insert into public.set_completions (user_id, lesson_id, set_number, completed_at)
select c.user_id, c.lesson_id, s.set_number, c.completed_at
from public.lesson_completions c
join (
    select distinct lesson_id, set_number from public.lesson_sets
) s on s.lesson_id = c.lesson_id
on conflict do nothing;

drop table public.lesson_completions;
