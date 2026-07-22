-- Explicit display order for units and lessons.
--
-- Until now the star map and the unlock chain ordered purely by primary-key
-- `id` (see getCourseProgress and the /learn query). That works only while ids
-- already happen to be in teaching order — reordering, or slotting katakana in
-- earlier, would mean renumbering ids. A `position` column decouples "what
-- order to teach in" from "what id the row got", so content can be reordered by
-- an UPDATE instead. Backfilled from the current id order so nothing moves today.

alter table public.units   add column if not exists position integer not null default 0;
alter table public.lessons add column if not exists position integer not null default 0;

-- Units are ordered within their course; lessons within their unit. Seed each
-- from the existing id order so the current sequence is preserved exactly.
update public.units u
set position = ranked.rn
from (
    select id, row_number() over (partition by course_id order by id) as rn
    from public.units
) ranked
where u.id = ranked.id;

update public.lessons l
set position = ranked.rn
from (
    select id, row_number() over (partition by unit_id order by id) as rn
    from public.lessons
) ranked
where l.id = ranked.id;
