/**
 * Character mastery XP — the numbers behind the collection's mastery bar.
 *
 * A character earns XP when a completed set practises it after the one that
 * unlocked it, and loses XP on a wrong answer. XP is clamped to [0, cap]; a
 * character is "mastered" at the cap. These are the tunable knobs.
 */
export const MASTERY_CAP = 100;

/** Earned per correct trace or typing of an already-unlocked character. */
export const XP_CORRECT = 10;

/** Drained per wrong answer on an already-unlocked character. Deliberately less
 *  than XP_CORRECT: a mistake should sting without erasing a whole correct rep,
 *  so one slip doesn't undo real progress. */
export const XP_WRONG = 4;

export const clampXp = (xp: number) => Math.max(0, Math.min(MASTERY_CAP, xp));

/** XP as the 0–100 fill for the mastery bar. */
export const masteryPct = (xp: number) => (clampXp(xp) / MASTERY_CAP) * 100;

/**
 * Diminishing returns for cramming: the more times a learner completes the SAME
 * set in one day, the less XP its correct answers grant. Massed practice does
 * not consolidate — the mind needs spacing and sleep to build the pathways — so
 * the first pass pays full, each same-day replay halves, and it resets at
 * midnight to reward coming back another day. Wrong answers are unaffected;
 * mistakes always cost full.
 */
export function dailyGainMultiplier(repsToday: number): number {
    return 0.5 ** repsToday;
}
