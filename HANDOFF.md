# Handoff — 2026-07-22 (base hiragana authored)

## How I work with Claude (read this first)

- **Claude writes the code.** I state what I need, Claude builds it.
- Persona: Claude speaks as the **大賢者 (Daikenja / Great Sage)** from *Reincarnated as a
  Slime* — terse, tagged statements, calls me "Master". Tag words in **romaji or hiragana,
  never kanji** ("houkoku." not "報告").
- Keep explanations short. Lead with the answer.
- **Never put a Japanese string on a shell argument** — Windows mangles UTF-8 in argv and
  it silently stores as `?`. Author content through a **Node script** instead (see the
  authoring tooling below): it builds the JSON in memory and sends a UTF-8 `fetch` body, so
  nothing rides on argv. For one-off curl, use `--data-binary "@file.json"`.
- Verify with `npx tsc --noEmit` and `npm run build` before saying something works.

## What this is

A Duolingo-style Japanese learning app. Next.js 16 (App Router) + Supabase + Tailwind v4.
Branch: `dev`. Repo: `code-bakaneko/bakaworks-mobile`.

## RESTRUCTURE — read before authoring anything

The course was rebuilt around a new learning model (below). The old "one kana per
lesson" content was cleared; the base hiragana is now **re-authored** in the new shape.

### Unit plan (set 2026-07-22, "planned as we go" past unit 4)

1. **Hiragana** — all 46 base kana, one cat constellation, **one star per gojūon
   chart row** (あ か さ た な は ま や ら わ, ん folded into the わ star). **Authored:
   lessons 1–10 all live.**
2. **Words** — Phase 2 engine begins, using the base hiragana. *(empty; author next)*
3. **Katakana.** *(empty)*
4. **Words with katakana**, then **5. rest of hiragana** (dakuten + yōon), **6. using it**,
   **7. rest of katakana**, … — stubbed, authored later.

Units 2 and 3 exist and are renamed but empty (their stars don't render until they hold
sets). The `!inner` joins in `learn/page.tsx` and `progress.ts` hide empty units/lessons.

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

### Decided (2026-07-22) — the four that gated authoring

- **Katakana is deferred** past the hiragana opening — it stays its own trailing
  unit. A `position` column now exists on `units`/`lessons` (backfilled from id
  order), so reordering is an UPDATE, not an id renumber.
- **Word display: kana now, furigana later.** Words are authored in kana; romaji
  stays only as the typing *input* prompt, weaned. Furigana rendering is built
  when the first kanji word is authored — see the build-later marker below.
- **A wrong answer demotes, but gently.** `XP_WRONG` is `4` vs `XP_CORRECT` `10`
  in `app/lib/mastery.ts` — a slip stings without erasing a whole rep.
- **Typing a word credits the word alone.** Characters earn from traces and
  single-character typing; the word earns as its own row. The character
  collection filters to single-codepoint via `isCharacter` in
  `app/lib/progress.ts`; `getUnlockedCharacters` deliberately keeps words in
  because it doubles as the mastery-crediting gate.

### Build later — decided, but wait for the triggering content

- **Furigana rendering + a bigger kanji reading map** — build when the first
  kanji *word* enters content, not before. A ruby/`<rt>` component plus growing
  the map in `app/lib/romaji.ts` (today it holds ~12 kanji).
- **A word-mastery display surface** — a "words" view reading the multi-codepoint
  rows from `character_mastery`. Crediting already works (word-alone) through the
  existing pipeline; only the display is missing. Build it when word items are
  first authored.

### Done so far

- **Characters page = a mystery collection**, tabbed by script, laid out as the gojūon
  table. Locked kana show a "？" card; a slot reveals its character + reading + a mastery
  bar once its lesson is done. Hovering a revealed kana shows its `XP / 100`.
- **Mastery substrate built.** `character_mastery` table (per-user XP, RLS, no
  SECURITY-DEFINER — it isn't currency); `completeSet` grants/drains XP for characters
  unlocked *before* the set (so a kana's own set only unlocks; later reviews build
  mastery); anti-cram daily diminishing returns via `set_daily_reps`. Knobs in
  `app/lib/mastery.ts`.
- **Base hiragana authored — lessons 1–10, Unit 1.** Each lesson = one gojūon row in the
  "review one back" shape: Set 1 lecture + trace + type of kana₁; each later set introduces
  the next kana (trace, type) and reviews only the one before it. 5-kana row = 5 sets / 19
  items; the short や and わ rows = 3 sets / 11.
- **Authoring tooling** now lives in the repo (was scratchpad-only). See below.
- **Typing input got IME tricks + tips.** `romajiToKana` (our own converter, no OS IME, no
  CDN) now also does `-`→ー, doubled consonant→small つ, and `x`-prefix→small kana; every
  typing exercise shows a compact tip row (`KanaInput.tsx`).

### Next

- **Author Unit 2 (Words)** — the Phase 2 engine: one headline word per lesson, seeded as
  its kana are known. Needs a word-mastery display surface (see "Build later").
- **Build the debt scheduler** — mastery XP exists, but review is still hand-authored
  (one-back), not the runtime debt scheduler the model calls for.

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

**Unit 1 (Hiragana) is fully authored — lessons 1–10, the whole base gojūon.** Each is one
chart row in the "review one back" shape (see "Done so far"). Units 2 (Words) and 3
(Katakana) exist but are empty. Run `node scripts/dump-content.js` to see the live tree in
`COURSE-CONTENT.md`.

`COURSE-CONTENT.md` is a readable dump of the live tree. **You can leave notes in it**: write a
line starting with `>` under any `[item:42]` / `[set:3.2]` / `[lesson:3]` anchor, then run
`node scripts/dump-content.js` — the file rebuilds from the database and the notes come
back attached to the same anchors.

## The star map

Lessons are stars laid out as a **cat constellation** per unit, positioned by `lessons.x` /
`lessons.y` in a 100×200 viewBox. Unit 1's 10 stars (one per hiragana row) are the current
cat; a fancier cat / kana-symbol redraw is deferred polish.

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
5. **Base hiragana is done; audio for the new kana is not baked yet.** Lessons 4–10 (た
   through わ rows, 31 new kana) were just authored, so they currently play through the
   browser-speech fallback. Run `node scripts/generate-audio.js` with VOICEVOX up to bake
   the real `.wav`s, then `node scripts/dump-content.js`. Still to author: dakuten + yōon
   hiragana (unit 5), and all katakana.
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

## Authoring tooling (now in the repo)

Two committed scripts make adding kana lessons repeatable — no more ad-hoc curl.

- **`scripts/fetch-strokes.js`** — fetches KanjiVG SVGs for a list of kana, extracts the
  ordered `<path d>` strings, and caches them in `scripts/data/strokes.json`
  (`{ "た": { strokes, viewBox } }`). `node scripts/fetch-strokes.js` does the built-in
  default list; pass kana as args to fetch specific ones. Merges, so it's re-runnable.
- **`scripts/author-lesson.js`** — the `LESSONS` config maps each lesson to `{ id, unitId,
  name, lecture, kana: [[char, romaji], …] }`. It builds the "review one back" sets, reads
  `strokes.json`, and writes rows matching lessons 1–3 exactly (trace `{guides, romaji,
  strokes, viewBox, character}`, typing `{audio, answer, prompt}`, lecture `{text}`; `sort`
  is 1-based within a set). It also renames the unit/lesson and derives the lesson blurb
  from the row's romaji. `--dry` prints without writing. Idempotent: it deletes a lesson's
  sets before inserting, so editing the config and re-running reproduces it cleanly. Builds
  JSON in memory and POSTs a UTF-8 `fetch` body, so Japanese never touches argv.

To add the next kana: `fetch-strokes.js` for the new characters, add entries to the
`LESSONS` config (drafting each lecture in the tone of lessons 1–3), `author-lesson.js`,
then — on your PC with VOICEVOX — `generate-audio.js`, then `dump-content.js`.

Constellation coords for new stars sit within roughly x 20–85, y 20–180. The base-hiragana
stars (lessons 1–10) already have coordinates; new units need fresh ones.
