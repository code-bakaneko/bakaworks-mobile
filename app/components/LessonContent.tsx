import { createClient } from "@/app/lib/supabase/server";
import LessonPlayer from "./LessonPlayer";

export default async function LessonContent({ lessonId }: { lessonId: string }) {
    const supabase = await createClient();

    const { data: lesson } = await supabase
        .from("lessons")
        .select("*, lesson_sets(*)")
        .eq("id", Number(lessonId))
        .order("sort", { referencedTable: "lesson_sets" })
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

    return <LessonPlayer lessonId={lesson.id} lessonName={lesson.name} sets={lesson.lesson_sets} />;
}
