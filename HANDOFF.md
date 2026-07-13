# Handoff — 2026-07-13

## Where I am
Building the **Multiple Choice** feature (roadmap #3). MC questions are generated from `language_vocabulary`: 1 correct answer + 3 random other words.

File in progress: `app/components/multiplechoice.tsx`

## Done this session
- Fixed 4 issues in `app/components/flashcard.tsx` (hooks order, out-of-bounds index/limit, Math.min initial limit).
- Added Correct/Incorrect tracking to flashcard: `next(wasCorrect)` bumps `correct`/`incorrect` counters.
- Fixed Supabase client typing in `server.ts` + `client.ts` (`<Database>` on the create-call, not the function name).
- Updated site metadata in `app/layout.tsx`.

## Multiple choice — progress
Steps 1–4 done: file + props, `index`/`score` state, `useMemo` choices (correct + 3 random, shuffled), render prompt + choice buttons.

## TODO (pick up here)
1. **Add the `answer` handler** and wire it to the buttons:
   ```tsx
   function answer(choice: Vocab) {
       if (choice.id === words[index].id) setScore((s) => s + 1);
       setIndex((i) => (i + 1) % words.length); // wrap with %
   }
   ```
   Then: `<button key={choice.id} onClick={() => answer(choice)}>`
2. **Guard empty words** (same crash as flashcard had): add `if (words.length === 0) return <div>No Words Yet</div>` — but AFTER the hooks (`useState`/`useMemo`), never before.
3. **Drop it on a page**: `<MultipleChoice words={vocabWords ?? []} />` (see `app/page.tsx` for how flashcard is wired).

## How I work with Claude (reminder for laptop session)
- I fix code myself; Claude checks + explains the "why". Short answers, code example per step.
- Verify loop: I say "check my work" → Claude reads file, runs `npx eslint <file>`, traces logic.
