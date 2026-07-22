import { createClient } from "./supabase/server";
import { getCourseIdForLesson, getUnlockedCharacters, itemCharacter, isCharacter } from "./progress";
import { MASTERY_CAP } from "./mastery";
import { toRomaji } from "./romaji";
import { audioUrlFor } from "./audio";
import type { Tables } from "./database.types";

type LessonSet = Tables<"lesson_sets">;

/**
 * The runtime review drill for a completed lesson — the mastery-debt scheduler.
 *
 * Re-entering a finished lesson does not replay its authored sets; it generates
 * a fresh typing drill: the lesson's own kana plus the weakest, stalest kana
 * from everything else the learner knows, interleaved and capped at twice the
 * lesson's new-kana count. When there is not enough weak old material the drill
 * simply gets shorter. Tracing is never here — repeats are pure typing.
 */

/**
 * Spaced-repetition debt: how far a kana is below full mastery, weighted by how
 * long since it was last practised. Both matter — a strong-but-stale kana can
 * out-rank a weak-but-fresh one, which is the forgetting curve at work. A maxed
 * kana has zero debt (never resurfaces); one with no mastery row has never been
 * practised, so it counts as maximally stale.
 */
function debtFor(xp: number, updatedAt: string | null): number {
    const deficit = MASTERY_CAP - xp;
    if (deficit <= 0) return 0;
    const daysSince = updatedAt
        ? (Date.now() - new Date(updatedAt).getTime()) / 86_400_000
        : 3650; // never practised — treat as very stale
    return deficit * (1 + daysSince);
}

/** A synthetic typing item for one kana. The player only reads id/type/content,
 *  so the rest is stubbed; negative ids keep them clear of real rows. */
function typingItem(char: string, id: number, lessonId: number): LessonSet {
    return {
        id,
        lesson_id: lessonId,
        set_number: 0,
        sort: id,
        type: "typing",
        created_at: new Date().toISOString(),
        content: {
            prompt: toRomaji(char) ?? "",
            answer: char,
            audio: char,
            audio_url: audioUrlFor(char),
        },
    };
}

/** Round-robin two lists into one, so new and old are mixed rather than blocked
 *  (interleaving beats blocking for retention). The longer tail is appended. */
function interleave(a: string[], b: string[]): string[] {
    const out: string[] = [];
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        if (i < a.length) out.push(a[i]);
        if (i < b.length) out.push(b[i]);
    }
    return out;
}

export async function buildReviewDrill(lessonId: number): Promise<LessonSet[]> {
    const supabase = await createClient();
    const courseId = await getCourseIdForLesson(lessonId);

    // The kana this lesson teaches (single-codepoint trace/typing targets).
    const { data: sets } = await supabase
        .from("lesson_sets")
        .select("type, content")
        .eq("lesson_id", lessonId);

    const newChars: string[] = [];
    for (const item of sets ?? []) {
        const c = itemCharacter(item.type, item.content);
        if (c && isCharacter(c) && !newChars.includes(c)) newChars.push(c);
    }
    const newSet = new Set(newChars);

    // The old half: every other unlocked kana below the cap, ranked by debt,
    // capped at the new count. Empty for lesson 1 with nothing else learned.
    let old: string[] = [];
    if (courseId !== null) {
        const unlocked = await getUnlockedCharacters(courseId);
        const { data: mastery } = await supabase
            .from("character_mastery")
            .select("character, xp, updated_at");
        const rowOf = new Map((mastery ?? []).map((m) => [m.character, m]));

        old = [...unlocked]
            .filter((c) => isCharacter(c) && !newSet.has(c))
            .map((c) => {
                const r = rowOf.get(c);
                return { char: c, debt: debtFor(r?.xp ?? 0, r?.updated_at ?? null) };
            })
            .filter((x) => x.debt > 0)
            .sort((a, b) => b.debt - a.debt)
            .slice(0, newChars.length)
            .map((x) => x.char);
    }

    return interleave(newChars, old).map((char, i) => typingItem(char, -(i + 1), lessonId));
}
