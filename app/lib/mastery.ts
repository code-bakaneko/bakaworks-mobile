/**
 * Character mastery XP — the numbers behind the collection's mastery bar.
 *
 * A character earns XP when a completed set practises it after the one that
 * unlocked it, and loses XP on a wrong answer. XP is clamped to [0, cap]; a
 * character is "mastered" at the cap. These are the tunable knobs.
 */
export const MASTERY_CAP = 100;

/** Earned per correct trace or typing of an already-unlocked character. */
export const XP_CORRECT = 20;

/** Drained per wrong answer on an already-unlocked character. */
export const XP_WRONG = 20;

export const clampXp = (xp: number) => Math.max(0, Math.min(MASTERY_CAP, xp));

/** XP as the 0–100 fill for the mastery bar. */
export const masteryPct = (xp: number) => (clampXp(xp) / MASTERY_CAP) * 100;
