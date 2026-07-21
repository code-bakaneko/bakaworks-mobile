import { createClient } from "@/app/lib/supabase/server";
import LessonPlayer from "./LessonPlayer";

export default async function LessonContent({ lessonId }: { lessonId: string }) {
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

    // Every set this lesson has, in order.
    const setNumbers = [...new Set(lesson.lesson_sets.map((s) => s.set_number))].sort((a, b) => a - b);

    // Which of them this user has already finished.
    const { data: completions } = await supabase
        .from("set_completions")
        .select("set_number")
        .eq("lesson_id", id);
    const done = new Set(completions?.map((c) => c.set_number));

    // Play the first unfinished set. Once every set is done, re-entering the
    // lesson replays the first one as practice.
    const activeSet = setNumbers.find((n) => !done.has(n)) ?? setNumbers[0];
    const items = lesson.lesson_sets.filter((s) => s.set_number === activeSet);

    return (
        <LessonPlayer
            lessonId={lesson.id}
            lessonName={lesson.name}
            setNumber={activeSet}
            setPosition={setNumbers.indexOf(activeSet) + 1}
            setTotal={setNumbers.length}
            isReplay={done.has(activeSet)}
            sets={items}
        />
    );
}
