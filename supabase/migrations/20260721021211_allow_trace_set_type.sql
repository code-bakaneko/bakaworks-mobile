-- Stroke-order tracing: the learner draws each stroke of a character in the
-- correct order and direction.
--
--   content.character  the kana being drawn, e.g. "あ"
--   content.romaji     its reading, shown as a label
--   content.strokes    SVG path `d` strings, one per stroke, IN STROKE ORDER
--   content.viewBox    coordinate space the paths are drawn in
--
-- Stroke path data comes from KanjiVG (http://kanjivg.tagaini.net),
-- Copyright (C) Ulrich Apel, licensed CC BY-SA 3.0.

alter table public.lesson_sets
    drop constraint lesson_sets_type_check;

alter table public.lesson_sets
    add constraint lesson_sets_type_check
    check (type in ('lecture', 'multiple_choice', 'trace', 'video', 'audio'));
