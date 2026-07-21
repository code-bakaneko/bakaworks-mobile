import { createClient } from "./supabase/server";

export type LessonProgress = { done: number; total: number };

export type CourseProgress = {
    /** lessonId -> sets completed out of total */
    progress: Map<number, LessonProgress>;
    /** lessonId -> may this user enter it */
    unlocked: Map<number, boolean>;
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
        .select("id, lessons!inner(id, lesson_sets!inner(set_number))")
        .eq("course_id", courseId)
        .order("id")
        .order("id", { referencedTable: "lessons" });

    const { data: completions } = await supabase
        .from("set_completions")
        .select("lesson_id, set_number");

    const doneSets = new Set(completions?.map((c) => `${c.lesson_id}:${c.set_number}`));

    const progress = new Map<number, LessonProgress>();
    const unlocked = new Map<number, boolean>();

    let previousComplete = true;

    for (const unit of units ?? []) {
        for (const lesson of unit.lessons) {
            const setNumbers = [...new Set(lesson.lesson_sets.map((s) => s.set_number))];

            const state = {
                done: setNumbers.filter((n) => doneSets.has(`${lesson.id}:${n}`)).length,
                total: setNumbers.length,
            };

            progress.set(lesson.id, state);
            unlocked.set(lesson.id, previousComplete);
            previousComplete = state.done >= state.total;
        }
    }

    return { progress, unlocked };
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
