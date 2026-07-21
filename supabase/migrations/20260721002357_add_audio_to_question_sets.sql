-- Audio is opt-in per set. The player shows a speaker button only when
-- `content.audio` is present, so a set without it stays silent.
--
--   content.audio      text to speak with the browser's Japanese voice
--   content.audio_url  a real audio file, when one exists (takes priority)
--
-- Every existing multiple choice prompt reads "Which character is X?",
-- so the kana can be lifted straight out of the prompt.

update public.lesson_sets
set content = jsonb_set(
        content,
        '{audio}',
        to_jsonb(substring(content->>'prompt' from 'is (.+)\?$'))
    )
where type = 'multiple_choice'
  and content ? 'prompt'
  and substring(content->>'prompt' from 'is (.+)\?$') is not null;
