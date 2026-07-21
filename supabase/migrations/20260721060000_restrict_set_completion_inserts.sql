-- A completion row is a CLAIM, and until now nothing checked it.
--
-- The old policy was `with check (auth.uid() = user_id)` — it verified who
-- you were and nothing else. The lesson_id and set_number were whatever the
-- caller sent. Since a lesson unlocks once every set of the previous lesson
-- has a row here, anyone able to reach the REST endpoint could insert rows
-- for the whole course and open all of it without playing a second of it.
-- Hiding the star does not help: the map and the lesson route read this
-- table, so a forged row is indistinguishable from a real one.
--
-- Two conditions are added:
--   1. the set must actually exist
--   2. the lesson must already be unlocked for this user
--
-- Condition 2 is the same walk `getCourseProgress` does in app/lib/progress.ts,
-- expressed in SQL. The two must agree; if they drift, this one wins, and a
-- learner sees a lesson they cannot record progress on.

create or replace function public.is_lesson_unlocked(p_lesson bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with ordered as (
    -- Course order is unit id, then lesson id — the same order the app
    -- displays. Lessons with no sets are skipped, matching the inner join
    -- the app uses: a lesson with nothing in it is not a step in the chain.
    select
      l.id,
      row_number() over (order by u.id, l.id) as position
    from public.lessons l
    join public.units u on u.id = l.unit_id
    where u.course_id = (
      select u2.course_id
      from public.lessons l2
      join public.units u2 on u2.id = l2.unit_id
      where l2.id = p_lesson
    )
    and exists (
      select 1 from public.lesson_sets ls where ls.lesson_id = l.id
    )
  ),
  target as (
    select position from ordered where id = p_lesson
  ),
  previous as (
    select id from ordered
    where position = (select position from target) - 1
  )
  select case
    -- Not a real, playable lesson.
    when not exists (select 1 from target) then false
    -- First lesson of the course is always open.
    when not exists (select 1 from previous) then true
    -- Otherwise: every set of the lesson before it must be recorded.
    else not exists (
      select 1
      from (
        select distinct ls.set_number
        from public.lesson_sets ls
        where ls.lesson_id = (select id from previous)
      ) needed
      where not exists (
        select 1
        from public.set_completions sc
        where sc.user_id = (select auth.uid())
          and sc.lesson_id = (select id from previous)
          and sc.set_number = needed.set_number
      )
    )
  end;
$$;

-- SECURITY DEFINER so it can read the caller's own completions regardless of
-- policy recursion. It takes NO user parameter on purpose: it reads
-- auth.uid() itself, so it cannot be asked about somebody else.
revoke execute on function public.is_lesson_unlocked(bigint) from public, anon;
grant execute on function public.is_lesson_unlocked(bigint) to authenticated;

drop policy "Users can record own set completions" on public.set_completions;

create policy "Users can record only sets they have reached"
    on public.set_completions for insert
    to authenticated
    with check (
        (select auth.uid()) = user_id
        and exists (
            select 1
            from public.lesson_sets ls
            where ls.lesson_id = set_completions.lesson_id
              and ls.set_number = set_completions.set_number
        )
        and public.is_lesson_unlocked(set_completions.lesson_id)
    );
