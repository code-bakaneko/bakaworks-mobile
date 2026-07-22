import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { getCourseProgress, getCourseIdForLesson } from "@/app/lib/progress";
import { buildReviewDrill } from "@/app/lib/review";
import LessonPlayer from "./LessonPlayer";

export default async function LessonContent({
    lessonId,
    forceSet,
    preview = false,
}: {
    lessonId: string;
    /** Admin preview only: play this set rather than the next unfinished one. */
    forceSet?: number;
    preview?: boolean;
}) {
    const supabase = await createClient();
    const id = Number(lessonId);

    const { data: lesson } = await supabase
        .from("lessons")
        .select("*, lesson_sets(*)")
        // Sets group the items; sort orders them within a set.
        .order("set_number", { referencedTable: "lesson_sets" })
        .order("sort", { referencedTable: "lesson_sets" })
        .eq("id", id)
        .single();

    if (!lesson) {
        return (
            <div className="min-h-screen flex items-center justify-center text-muted">
                That lesson does not exist.
            </div>
        );
    }

    if (lesson.lesson_sets.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
                <h2 className="text-2xl font-extrabold">{lesson.name}</h2>
                <p className="text-muted">This lesson has no content yet.</p>
            </div>
        );
    }

    // The lock is enforced HERE, not on the star map. Hiding a star only stops
    // it being clicked — the route is still reachable by typing the URL.
    // Preview skips it, and only /admin can reach preview at all.
    if (!preview) {
        const courseId = await getCourseIdForLesson(id);
        if (courseId !== null) {
            const { unlocked } = await getCourseProgress(courseId);
            if (!unlocked.get(id)) redirect("/learn");
        }
    }

    // Every set this lesson has, in order.
    const setNumbers = [...new Set(lesson.lesson_sets.map((s) => s.set_number))].sort((a, b) => a - b);

    // Which of them this user has already finished, oldest play first.
    const { data: completions } = await supabase
        .from("set_completions")
        .select("set_number, completed_at")
        .eq("lesson_id", id)
        .order("completed_at");
    const done = new Set(completions?.map((c) => c.set_number));

    // A fully-finished lesson, re-entered, becomes a runtime spaced-repetition
    // drill (app/lib/review.ts): its own kana mixed with the weakest, stalest
    // kana the learner knows, typed not traced. Admin preview and an explicit
    // forceSet still play the authored content.
    const allDone = setNumbers.every((n) => done.has(n));
    if (allDone && !preview && forceSet === undefined) {
        const reviewItems = await buildReviewDrill(id);
        return (
            <LessonPlayer
                lessonId={lesson.id}
                lessonName={lesson.name}
                setNumber={0}
                setPosition={1}
                setTotal={1}
                isReplay
                review
                sets={reviewItems}
            />
        );
    }

    // Before the lesson is finished, entering it plays the first unfinished set.
    // (The stalest-set cycle below only matters if the review branch is skipped,
    // e.g. admin preview of a completed lesson.)
    const stalest = completions
        ?.map((c) => c.set_number)
        .find((n) => setNumbers.includes(n));

    // Play the first unfinished set while any remain.
    const activeSet =
        forceSet !== undefined && setNumbers.includes(forceSet)
            ? forceSet
            : setNumbers.find((n) => !done.has(n)) ?? stalest ?? setNumbers[0];

    const isReplay = done.has(activeSet);

    const all = lesson.lesson_sets.filter((s) => s.set_number === activeSet);

    // Replaying is practice, not teaching. The lecture has been read once and
    // now lives in the guide, so drop it and go straight to the exercises.
    // Preview keeps everything — an admin is checking the content itself.
    const drilled = all.filter((s) => s.type !== "lecture");
    const items = isReplay && !preview && drilled.length > 0 ? drilled : all;

    return (
        <LessonPlayer
            lessonId={lesson.id}
            lessonName={lesson.name}
            setNumber={activeSet}
            setPosition={setNumbers.indexOf(activeSet) + 1}
            setTotal={setNumbers.length}
            isReplay={isReplay}
            sets={items}
            preview={preview}
        />
    );
}
