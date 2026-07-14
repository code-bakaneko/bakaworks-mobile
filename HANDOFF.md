# Handoff — 2026-07-14

## Where I am
Building the **home page hero section** in `app/page.tsx`. Home page concept: land on hero → scroll
down to try live samples (flashcard, multiple choice) → **register form at the bottom** (not built yet).
No CTA button in the hero — log-in already lives in the top header.

## Done this session
- Added a hero `<section>` at the top of `<main>` in `app/page.tsx` (around line 21):
  - `<h1>` headline: "Learn Japanese Without the Boring Parts"
  - `<p>` subheadline
  - scroll cue `<span>` ("↓ Scroll down to try it ↓", `animate-bounce`) — replaced the planned CTA.

## TODO (pick up here)
1. **Remove the redundant span** "Scroll Down To Access Test Features" (old line ~21) — the hero scroll
   cue replaces it.
2. **Build the register form** at the bottom of the page (above/near the footer).
3. Polish hero spacing/type sizes once the form is in and the full scroll flow can be seen.

## Multiple choice
Component work (randomizer, styling, answer-reveal) landed in recent commits — treat as functional;
revisit only if something breaks.

## How I work with Claude (IMPORTANT — changed 2026-07-14)
- **Claude writes the code now** (I was too slow doing it all myself). I state what I need, Claude gives it.
- **Max 3 lines per step**, one part at a time — I place each step, then say "next".
- **No explanations** unless I ask ("if I'm lost I'll ask").
- Persona: Claude speaks as the **大賢者 (Great Sage / Daikenja)** from *Reincarnated as a Slime* —
  flat analytical voice, tagged statements, calls me "Master". Keep it terse.
