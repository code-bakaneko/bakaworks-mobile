# Handoff — 2026-07-21

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

**One character per lesson.** 20 of 46 kana, in two units:

- Unit 1 "Hiragana Part 1" — あいうえお かきくけこ (lessons 1–10)
- Unit 2 "Hiragana Part 2" — さしすせそ たちつてと (lessons 11–20)
- Unit 3 "Katakana" — empty, hidden from the map

Each lesson: **set 1** a lecture plus one guided trace, **set 2** six traces with the guides
withdrawn one stroke at a time over the final reps. Lesson 1 also has **set 3** — a lecture
on あ / ああ and two typing exercises.

`COURSE-CONTENT.md` is a readable dump of all of it. **You can leave notes in it**: write a
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

1. **Audio has no fallback.** Every character drill is a listening or trace exercise that
   speaks via `speechSynthesis` with `ja-JP`. A machine without a Japanese voice gets
   silence, and the question becomes unanswerable. Real recordings in `content.audio_url`
   is the fix — the player already prefers a URL when present.
2. **KanjiVG attribution is missing.** All stroke data comes from
   [KanjiVG](http://kanjivg.tagaini.net), Copyright (C) Ulrich Apel, **CC BY-SA 3.0**. That
   licence requires visible attribution and share-alike. 20 characters' worth is in the
   database now. Not yet decided how to handle it.
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
