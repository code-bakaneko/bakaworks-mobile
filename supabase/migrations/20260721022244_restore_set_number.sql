-- A lesson is made of SETS, and each set is a group of items played in order.
--
--   lesson 1 (A Row)
--     set 1  intro    -> lecture, lecture
--     set 2  tracing  -> trace あ
--     set 3  quiz     -> multiple choice x5
--
-- `set_number` groups; `sort` orders within the group. The pair is unique per
-- lesson. This restores the column dropped in 20260721000656, which was based
-- on a wrong reading of the model.

alter table public.lesson_sets
    add column set_number integer not null default 1;

alter table public.lesson_sets
    drop constraint lesson_sets_lesson_id_sort_key;

alter table public.lesson_sets
    add constraint lesson_sets_lesson_id_set_number_sort_key
    unique (lesson_id, set_number, sort);

drop index if exists public.lesson_sets_lesson_id_idx;

create index lesson_sets_lesson_id_idx
    on public.lesson_sets (lesson_id, set_number, sort);
