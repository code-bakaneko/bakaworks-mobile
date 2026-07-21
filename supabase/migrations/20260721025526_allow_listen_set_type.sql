-- Native-style character drilling: the sound plays, the learner picks the
-- character that makes it. No romaji, no translation step — the kana is
-- bound directly to the sound rather than to an English spelling.
--
--   content.audio    the sound to play, e.g. "あ"
--   content.choices  kana to choose between, e.g. ["あ","い","う","え"]
--   content.answer   the correct kana
--
-- No `prompt`: the question IS the sound.

alter table public.lesson_sets
    drop constraint lesson_sets_type_check;

alter table public.lesson_sets
    add constraint lesson_sets_type_check
    check (type in ('lecture', 'multiple_choice', 'listen', 'trace', 'video', 'audio'));
