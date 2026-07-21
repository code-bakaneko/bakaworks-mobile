import { createClient } from "@/app/lib/supabase/server"
import { getCourseProgress } from "@/app/lib/progress"
import StarMap, { MapLesson } from "@/app/components/StarMap"

const COURSE_ID = 1;

export default async function LearnPage() {
    const supabase = await createClient();

    const { data: units, error } = await supabase
        .from("units")
        // Both joins are inner: a lesson with no sets is a dead link, and a
        // unit with no playable lessons is an empty sky.
        .select("*, lessons!inner(*, lesson_sets!inner(set_number))")
        .eq("course_id", COURSE_ID)
        .order("id")
        .order("id", { referencedTable: "lessons" });

    if (error) return <div className="p-10 text-muted">Could not load the course.</div>;

    // The same computation the lesson route gates on, so the map can never
    // show a star as open that the route would then refuse.
    const { progress, unlocked, guides } = await getCourseProgress(COURSE_ID);

    return (
        <div className="starfield min-h-screen flex flex-col items-center gap-16 py-12 px-6">
            {units?.map((unit, unitIndex) => {
                // Maps do not cross the server/client boundary, so flatten to
                // a plain array before handing it to the map.
                const lessons: MapLesson[] = unit.lessons.map((lesson) => {
                    const { done, total } = progress.get(lesson.id) ?? { done: 0, total: 0 };
                    return {
                        id: lesson.id,
                        name: lesson.name,
                        x: lesson.x,
                        y: lesson.y,
                        done,
                        total,
                        locked: !unlocked.get(lesson.id),
                        hasGuide: guides.get(lesson.id) ?? false,
                    };
                });

                return (
                    <section key={unit.id} className="w-full max-w-md flex flex-col items-center gap-4">

                        <div className="text-center flex flex-col gap-1">
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand">
                                Unit {unitIndex + 1}
                            </span>
                            <h2 className="text-2xl font-extrabold leading-tight">{unit.name}</h2>
                            {unit.blurb && (
                                <p className="text-sm text-muted">{unit.blurb}</p>
                            )}
                        </div>

                        <StarMap lessons={lessons} />

                    </section>
                );
            })}
        </div>
    )
}
