import { createClient } from "@/app/lib/supabase/server"
import { getCourseProgress } from "@/app/lib/progress"
import { toRomaji } from "@/app/lib/romaji"

/**
 * The kana collection. Every character the course teaches is a slot; a slot
 * stays a "？" mystery until the learner has unlocked it, then it reveals the
 * character and its reading. Seeing the locked slots is the point — the row of
 * mysteries is what there is left to collect.
 *
 * NOTE ON THE REVEAL SIGNAL. What flips a slot from mystery to known is, for
 * now, lesson completion via `getCourseProgress` — the same source the map and
 * the lesson route already trust, so nothing can disagree. When the mastery
 * system lands, the character's mastery becomes the gate instead; swap the
 * `revealed` computation below and nothing else changes. With content cleared,
 * no lesson can complete, so every slot is a mystery — the correct empty state.
 */
export default async function CharactersPage() {
    const supabase = await createClient();

    // No inner join on lesson_sets: a star with no content yet is still a slot
    // to show, drawn as a mystery.
    const { data: units } = await supabase
        .from("units")
        .select("id, name, lessons(id, name)")
        .eq("course_id", 1)
        .order("id")
        .order("id", { referencedTable: "lessons" });

    const { progress } = await getCourseProgress(1);

    return (
        <div className="max-w-3xl mx-auto p-4 flex flex-col gap-10">
            {units?.map((unit) => (
                <section key={unit.id} className="flex flex-col gap-3">
                    <h2 className="text-xl font-extrabold">{unit.name}</h2>

                    <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-2">
                        {unit.lessons.map((lesson) => {
                            const p = progress.get(lesson.id);
                            // Revealed once the kana's lesson is finished. This
                            // is the line the mastery system will replace.
                            const revealed = !!p && p.total > 0 && p.done >= p.total;
                            const pct = p && p.total > 0 ? (p.done / p.total) * 100 : 0;

                            if (!revealed) {
                                return (
                                    <div key={lesson.id}
                                        className="bg-gray-950 min-h-40 p-3 rounded-sm
                                            flex flex-col gap-2 items-center justify-center
                                            border-2 border-dashed border-slate-800">
                                        <span className="text-5xl leading-none text-slate-700 select-none">
                                            ？
                                        </span>
                                        <span className="text-center text-slate-700 text-xs uppercase tracking-widest">
                                            Locked
                                        </span>
                                    </div>
                                );
                            }

                            const romaji = toRomaji(lesson.name) ?? "";

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
