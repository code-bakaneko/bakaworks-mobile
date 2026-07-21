import { createClient } from "@/app/lib/supabase/server"

// The trace set carries the reading. content is jsonb, so narrow what we read.
type TraceContent = { romaji?: string };

export default async function CharactersPage() {
    const supabase = await createClient();

    const { data: units } = await supabase
        .from("units")
        // inner joins: a unit with no playable lessons, and a lesson with no
        // sets, are both nothing to show here.
        .select("id, name, lessons!inner(id, name, lesson_sets!inner(type, content))")
        .eq("course_id", 1)
        .order("id")
        .order("id", { referencedTable: "lessons" });

    return (
        <div className="max-w-3xl mx-auto p-4 flex flex-col gap-10">
            {units?.map((unit) => (
                <section key={unit.id} className="flex flex-col gap-3">
                    <h2 className="text-xl font-extrabold">{unit.name}</h2>

                    <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-2">
                        {unit.lessons.map((lesson) => {
                            const trace = lesson.lesson_sets.find((s) => s.type === "trace");
                            const romaji = (trace?.content as TraceContent | null)?.romaji ?? "";

                            // TODO: progress bar is a placeholder — the real fill
                            // is coming from a scheme the user is planning.
                            const pct = 0;

                            return (
                                <div key={lesson.id}
                                    className="bg-gray-950 min-h-40 p-3 rounded-sm
                                        flex flex-col gap-2 items-center justify-center
                                        border-2 border-slate-800
                                        hover:border-white hover:-translate-y-1 transition-all">
                                    <span className="text-5xl leading-none">{lesson.name}</span>
                                    <span className="text-center text-muted text-sm">{romaji}</span>

                                    <div className="w-full h-2 bg-slate-800 rounded-xs overflow-hidden mt-1">
                                        <div className="h-full bg-brand transition-all"
                                            style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            ))}
        </div>
    );
}
