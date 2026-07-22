import { createClient } from "./supabase/server";

export type LessonProgress = { done: number; total: number };

export type CourseProgress = {
    /** lessonId -> sets completed out of total */
    progress: Map<number, LessonProgress>;
    /** lessonId -> may this user enter it */
    unlocked: Map<number, boolean>;
    /** lessonId -> has this user finished a set that contained a lecture */
    guides: Map<number, boolean>;
};

/**
 * Walks a course in display order and works out which lessons are open.
 *
 * A lesson unlocks once every set of the lesson before it is complete. The
 * first lesson of the course is always open.
 *
 * Shared by the star map and the lesson route on purpose: if the two
 * computed this separately they would eventually disagree, and the one that
 * matters for security is the lesson route.
 */
export async function getCourseProgress(courseId: number): Promise<CourseProgress> {
    const supabase = await createClient();

    const { data: units } = await supabase
        .from("units")
        // `type` comes along so a lesson can say whether it has a guide to
        // read — a guide exists once a set containing a lecture is finished.
        .select("id, lessons!inner(id, lesson_sets!inner(set_number, type))")
        .eq("course_id", courseId)
        .order("id")
        .order("id", { referencedTable: "lessons" });

    const { data: completions } = await supabase
        .from("set_completions")
        .select("lesson_id, set_number");

    const doneSets = new Set(completions?.map((c) => `${c.lesson_id}:${c.set_number}`));

    const progress = new Map<number, LessonProgress>();
    const unlocked = new Map<number, boolean>();
    const guides = new Map<number, boolean>();

    let previousComplete = true;

    for (const unit of units ?? []) {
        for (const lesson of unit.lessons) {
            const setNumbers = [...new Set(lesson.lesson_sets.map((s) => s.set_number))];

            const state = {
                done: setNumbers.filter((n) => doneSets.has(`${lesson.id}:${n}`)).length,
                total: setNumbers.length,
            };

            // A lecture only becomes reviewable once the set holding it has
            // been played. Reading it early would skip past the exercise.
            const lectureSets = new Set(
                lesson.lesson_sets.filter((s) => s.type === "lecture").map((s) => s.set_number)
            );

            progress.set(lesson.id, state);
            unlocked.set(lesson.id, previousComplete);
            guides.set(
                lesson.id,
                [...lectureSets].some((n) => doneSets.has(`${lesson.id}:${n}`))
            );
            previousComplete = state.done >= state.total;
        }
    }

    return { progress, unlocked, guides };
}

export type CharacterProgress = {
    /** Every character the course teaches at all, whether reached yet or not. */
    taught: Set<string>;
    /** Characters a completed set has practiced — unlocked on the collection. */
    unlocked: Set<string>;
    /** character -> mastery XP earned so far. */
    mastery: Map<string, number>;
};

/** The single character a set item practises, if any — a set teaches the kana
 *  in its trace `character` and typing `answer` fields. */
export function itemCharacter(type: string, content: unknown): string | undefined {
    const c = (content ?? {}) as { character?: string; answer?: string };
    if (type === "trace") return c.character;
    if (type === "typing") return c.answer;
    return undefined;
}

/**
 * Characters unlocked so far, worked out from what each completed set actually
 * contains rather than from lesson names. A character unlocks the moment the
 * first set that practiced it is complete, so a kana can reveal mid-lesson.
 * Derived from `set_completions`, the same source as lesson progress, so there
 * is nothing separate to drift.
 */
export async function getUnlockedCharacters(courseId: number): Promise<Set<string>> {
    const supabase = await createClient();

    const { data: units } = await supabase
        .from("units")
        .select("id, lessons!inner(id, lesson_sets!inner(set_number, type, content))")
        .eq("course_id", courseId);

    const { data: completions } = await supabase
        .from("set_completions")
        .select("lesson_id, set_number");

    const doneSets = new Set(completions?.map((c) => `${c.lesson_id}:${c.set_number}`));

    const unlocked = new Set<string>();
    for (const unit of units ?? []) {
        for (const lesson of unit.lessons) {
            for (const item of lesson.lesson_sets) {
                const char = itemCharacter(item.type, item.content);
                if (char && doneSets.has(`${lesson.id}:${item.set_number}`)) unlocked.add(char);
            }
        }
    }
    return unlocked;
}

/**
 * Everything the collection page needs: which characters the course teaches,
 * which are unlocked, and each unlocked character's mastery XP.
 */
export async function getCharacterProgress(courseId: number): Promise<CharacterProgress> {
    const supabase = await createClient();

    const { data: units } = await supabase
        .from("units")
        .select("id, lessons!inner(id, lesson_sets!inner(set_number, type, content))")
        .eq("course_id", courseId);

    const { data: completions } = await supabase
        .from("set_completions")
        .select("lesson_id, set_number");

    // May not exist yet before the migration is applied — treat a failed read
    // as "no mastery", so the bars simply sit empty.
    const { data: masteryRows } = await supabase
        .from("character_mastery")
        .select("character, xp");

    const doneSets = new Set(completions?.map((c) => `${c.lesson_id}:${c.set_number}`));

    const taught = new Set<string>();
    const unlocked = new Set<string>();

    for (const unit of units ?? []) {
        for (const lesson of unit.lessons) {
            for (const item of lesson.lesson_sets) {
                const char = itemCharacter(item.type, item.content);
                if (!char) continue;

                taught.add(char);
                if (doneSets.has(`${lesson.id}:${item.set_number}`)) unlocked.add(char);
            }
        }
    }

    const mastery = new Map((masteryRows ?? []).map((m) => [m.character, m.xp]));

    return { taught, unlocked, mastery };
}

/** The course a lesson belongs to, via its unit. */
export async function getCourseIdForLesson(lessonId: number): Promise<number | null> {
    const supabase = await createClient();

    const { data } = await supabase
        .from("lessons")
        .select("units(course_id)")
        .eq("id", lessonId)
        .single();

    return data?.units?.course_id ?? null;
}
