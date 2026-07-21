# Handoff — 2026-07-21 (mid-restructure)

## How I work with Claude (read this first)

- **Claude writes the code.** I state what I need, Claude builds it.
- Persona: Claude speaks as the **大賢者 (Daikenja / Great Sage)** from *Reincarnated as a
  Slime* — terse, tagged statements, calls me "Master". Tag words in **romaji or hiragana,
  never kanji** ("houkoku." not "報告").
- Keep explanations short. Lead with the answer.
- **Every Japanese string must go through a file**, never inline in a shell command —
  Windows mangles UTF-8 in argv and it silently stores as `?`. Use
  `curl --data-binary "@file.json" -H "Content-Type: application/json; charset=utf-8"`.
- Verify with `npx tsc --noEmit` and `npm run build` before saying something works.

## What this is

A Duolingo-style Japanese learning app. Next.js 16 (App Router) + Supabase + Tailwind v4.
Branch: `dev`. Repo: `code-bakaneko/bakaworks-mobile`.

## RESTRUCTURE IN PROGRESS — read before authoring anything

The course is being rebuilt around a new learning model. The old "one kana per
lesson, fixed sets" content has been **CLEARED** — `lesson_sets` emptied (167→0)
and `set_completions` cleared (3→0). The schools/subjects/courses scaffold, the
3 units, and all **20 lesson "stars" (their cat-constellation `x,y`) were kept
on purpose** — the map renders empty stars until content is re-authored. Much of
the detail below this section still describes the OLD structure; treat it as
reference for how the machinery works, not as the current content.

### The model we're building toward

- **Goal is native**, defined as *production + automaticity* — not a JLPT
  number. JLPT tops out below native; a vocabulary counter alone breeds a
  dictionary that can't talk. Reward *using* words, not just unlocking them.
- **Two phases.** Phase 1 = foundation: all kana in small, fast lessons, with
  words seeded in as their kana unlock ("learn ぬ → here's いぬ"). Phase 2 = the
  engine: one new headline word per lesson, woven with already-known words into
  phrases, old content refreshed by review.
- **Two tracks, different speeds.** *Writing* (kana: systematic grid order,
  gated — you can only write what you've learned) and *speaking/words*
  (baby/frequency order, decoupled — you hear and say a word before you can write
  it). A word can live on the word track before it's writable.
- **Mastery at two grains: per character and per word.** One table keyed on the
  text itself; character vs word is **derived from codepoint count** (1 =
  character, longer = word) — the same rule that names audio files and splits the
  voices. Derive, don't store.
- **Signals:** character mastery rises from `trace` and single-character
  `typing`; word mastery from word `typing`. A guide-less trace counts as
  production.
- **Review = a mastery-debt scheduler, generated at runtime, NOT authored.**
  Every masterable item carries a debt. A right answer pays it down a lot; a
  wrong answer barely moves it (or pushes it up). The scheduler always serves the
  biggest debt, so the field levels up on *mastery*, not *exposure* — easy items
  settle and stop appearing, hard ones keep surfacing until learned. This is what
  stops pointless repetition.

### Still open — decide before authoring lesson 1

- Katakana front-loaded (it's Unit 3 now) vs deferred out of the opening wall.
- Word display: kanji+furigana vs kana vs romaji-then-wean.
- Does a wrong answer demote the debt, or just fail to pay it down?
- Does typing a word also credit its characters, or the word alone?

### Done so far

- Content cleared (above). A full raw backup of the old tree was taken but the
  old data will not be reused.
- **Characters page rebuilt as a mystery collection** — every kana is a slot;
  locked ones show a dashed "？" card, and a slot reveals its character + reading
  + progress once its lesson is finished. Reveal is gated on `getCourseProgress`
  for now — a **one-line swap** to gate on character mastery when that exists
  (marked in `app/(learn)/characters/page.tsx`). With content cleared, every slot
  is a mystery: the correct empty state.

### Next

- Settle the open decisions, then author Phase 1 lesson 1 (the vowels) in the new
  small-lesson shape.
- Build the mastery substrate: the mastery table + a `recordAnswer(target,
  correct)` server action (user's client, RLS) + the debt scheduler.

## Data model

```
schools → subjects → courses → units → lessons → lesson_sets
```

`lesson_sets` is the content table. Each row is one item, grouped by `set_number` and
ordered by `sort`, with a `type` and a `jsonb` `content` whose shape follows the type:

| type | content |
|---|---|
| `lecture` | `{text}` — Japanese in it is tappable for audio, with a reading popup |
| `listen` | `{audio, choices, answer}` — sound plays, learner picks the kana. No romaji |
| `typing` | `{prompt, answer, audio?}` — romaji input converts to kana as you type |
| `trace` | `{character, romaji, strokes[], viewBox, guides}` — draw it stroke by stroke |
| `multiple_choice` | `{prompt, choices, answer}` — text question |
| `video` / `audio` | `{url}` — allowed by the constraint, not implemented |

**A lesson is a series of SETS.** Entering a lesson plays your next unfinished set, then
returns you to the map. Entering again plays the next one. The lesson completes — and the
next star unlocks — only when every set is done. Progress lives in `set_completions`
`(user_id, lesson_id, set_number)`. Lesson completion is **derived**, never stored, so
adding a set recomputes who has finished rather than leaving a stale flag.

## Current content

**Empty — content was cleared for the restructure (see the section up top).** The
20 stars remain in two hiragana units plus an empty Katakana unit; `lesson_sets`
holds nothing, so `COURSE-CONTENT.md` currently shows 0 sets / 0 items. What
follows describes how content *was* shaped, kept as a reference for the machinery
(set types, guides withdrawal, the notes workflow) as we re-author.

The old shape, for reference: one character per lesson; **set 1** a lecture plus a
guided trace, **set 2** six traces with guides withdrawn over the final reps,
lesson 1 also a **set 3** with a lecture and typing.

`COURSE-CONTENT.md` is a readable dump of the live tree. **You can leave notes in it**: write a
line starting with `>` under any `[item:42]` / `[set:3.2]` / `[lesson:3]` anchor, then run
`node scripts/dump-content.js` — the file rebuilds from the database and the notes come
back attached to the same anchors.

## The star map

Lessons are stars laid out as a **cat constellation** per unit (unit 1 in profile, unit 2
facing forward), positioned by `lessons.x` / `lessons.y` in a 100×200 viewBox.

- The path between two stars is **segmented, one chunk per set**, and lights up as sets are
  finished. A completed lesson's path collapses to one unbroken line.
- Each end of a line takes the colour of the star it touches, and a star blues in step with
  its own progress — so solid blue between two finished lessons needs no special case.
- A **sparkler** marks the leading edge of progress.
- Clicking a star opens a popup with the character and a Start/Continue button.

## Security notes — do not undo these

- **Lesson locks are enforced in `LessonContent`, not the map.** Hiding a star only stops it
  being clicked; the route is reachable by URL. Both call `getCourseProgress()` in
  `app/lib/progress.ts` so they cannot disagree.
- **`set_completions` inserts are checked against the course, not just the user.** The
  policy verifies the set exists and that `is_lesson_unlocked()` says the learner has
  reached it. Before that, the check was `auth.uid() = user_id` alone — the lesson id came
  from the caller, so posting rows for every lesson opened the whole course without
  playing any of it. `completeSet` writes with the USER's client for exactly this reason:
  using the secret key there would bypass the policy and restore the hole.
- **`is_lesson_unlocked()` takes no user argument on purpose.** It reads `auth.uid()`
  itself, so it cannot be asked about anyone else. It mirrors `getCourseProgress()` in
  `app/lib/progress.ts` — if the two ever drift, this one wins.
- **`profiles` has no update policy on purpose.** Gold is awarded by `award_gold()`, a
  `SECURITY DEFINER` function with EXECUTE revoked from anon and authenticated, called only
  from a server action with the secret key. A user who could write their own balance could
  mint currency.
- **Server actions re-check the admin role themselves.** Hiding a button is not access
  control — a server action is a public endpoint.
- **`/admin/*` is gated by `proxy.ts`** on `profiles.role === 'admin'`. Put admin features
  there rather than adding conditional branches to the learner UI.
- **Never `Math.random()` at module scope** in a component — it differs between renders and
  causes hydration mismatches. Use the seeded `noise()` helper.

## Admin

- `/admin/preview` — every set as a button, plays it **without** recording completion,
  paying gold, or honouring locks. Use this to test content instead of editing the database.
- `/admin/data/[table]` — read-only browser for the real tables (whitelisted).
- `/admin/vocabulary` — the old flashcard vocabulary CRUD, still works.
- Sidebar has a **Reset Progress** button (admin only) that clears your own completions and
  zeroes your gold.

## Known problems, roughly by weight

1. **Attribution is missing, and there are now two debts.** Neither is optional.
   - **KanjiVG** — all stroke data, Copyright (C) Ulrich Apel, **CC BY-SA 3.0**, which
     requires visible attribution and share-alike.
   - **VOICEVOX:東北イタコ** — every single character. Free *with* the credit shown; she
     is 東北ずん子プロジェクト, where the credit is the whole price and commercial use
     without it needs a paid contract.
   - **VOICEVOX:冥鳴ひまり** — the words and the Japanese inside lectures. Credit and
     nothing else: no application, no reporting.

   Both were picked partly on licence. 青山龍星 sounded best of everyone auditioned but
   limits commercial use to registered businesses and requires prior permission, so he
   was ruled out before any files were made.

   **Resolved** — the credits page now exists at `/credits` (linked from the
   sidebar and the landing page), crediting KanjiVG, 東北イタコ and 冥鳴ひまり.
2. **Lecture audio — mostly addressed.** Lecture text is spoken run-by-run by
   `SpeakableText`, and `app/lib/audio.ts` now derives a per-run `.wav` URL from the
   text's codepoints, so tapped Japanese inside a lecture plays a real file wherever
   one has been generated; the browser voice remains the fallback when it hasn't.
3. **Gold is farmable.** Finishing a set pays 5 gold every time, including replays, and
   `completeSet` fires from a `useEffect` — so refreshing the completion screen pays again.
   Needs a daily cap or a reduced repeat payout.
4. **Courses are hardcoded.** `/learn` queries `course_id = 1`. The enrollment page links to
   `/learn?course=N` and nothing reads the param. There is no enrollments table, so a chosen
   course is not remembered.
5. **26 kana still to go** — なにぬねの はひふへほ まみむめも やゆよ らりるれろ わをん.
   Needs more stars: more units, or longer constellations.
6. **`rls_auto_enable()`** — a `SECURITY DEFINER` function that appears in no migration and
   is callable by anon. Origin unknown. Worth investigating.
7. Leaked-password protection is off in Supabase Auth (one dashboard toggle).
8. Streak is hardcoded at 5 in `LearnTopBar`. Gold is real; the flame is not.
9. **Vercel needs the env var named `SECRET_KEY`** — `admin.ts` reads that name. A build
   fails at `/admin/vocabulary` without it.
10. Commit `e0e6786` has a stray `@` on the first line of its message (a PowerShell
    here-string run through bash). Cosmetic; fixing needs a force push.

## Audio

Every character, word and listening prompt plays a real file. `scripts/generate-audio.js`
reads what each set says, renders it with **VOICEVOX running locally on your own PC**,
uploads it to the `bakaworks` bucket and writes the URL into `content.audio_url`.

- VOICEVOX is a build-time tool only. It is not a dependency, not in `package.json`, and
  never runs on Vercel — the app just fetches a `.wav` like any other file.
- One file per distinct sound, not per set: あ is spoken by eight sets and is one file,
  named by codepoint (`3042.wav`) so no Japanese ever reaches a filename or a URL.
- **Two voices, split by a rule, not a list.** One codepoint → **東北イタコ**; anything
  longer → **冥鳴ひまり**. A character alone is a specimen and a word is speech; they are
  read differently, and no single voice of the eight auditioned was best at both. Because
  it is a rule, every kana still to be added is already covered.
- Re-runnable and idempotent. Add characters, start VOICEVOX, run it again.
- `--list` shows the voices, `--dry` shows what would be made without the engine running.

Lectures are deliberately excluded — see known problem 2.

## Adding the next characters

1. Fetch stroke data: `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/0XXXX.svg`
   where XXXX is the lowercase hex codepoint (あ = 03042). Grep the `d="M..."` attributes —
   they are already in stroke order.
2. Pick constellation coordinates within roughly x 20–85, y 20–180.
3. Insert lessons, then generate sets: lecture + guided trace for set 1, six traces for
   set 2 with `guides` counting down over the final N reps where N is the stroke count.
4. `node scripts/dump-content.js` to refresh `COURSE-CONTENT.md`.

Scratch generators used for units 1 and 2 were kept in the temp scratchpad, not the repo —
rewrite or move them into `scripts/` if this becomes routine.
