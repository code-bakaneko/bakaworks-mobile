-- Typing: the learner produces the kana rather than picking it. The input
-- converts romaji to kana as they type, since kana is otherwise unreachable
-- on a latin keyboard.
--
--   content.prompt  what to produce, in English
--   content.answer  the expected kana, e.g. "ああ"
--   content.audio   optional, plays the word

alter table public.lesson_sets
    drop constraint lesson_sets_type_check;

alter table public.lesson_sets
    add constraint lesson_sets_type_check
    check (type in ('lecture', 'multiple_choice', 'listen', 'typing', 'trace', 'video', 'audio'));
