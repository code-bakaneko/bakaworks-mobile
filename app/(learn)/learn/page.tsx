import { createClient } from "@/app/lib/supabase/server"

export default async function LearnPage() {
    const supabase = await createClient();
    const STAR_PATH =
    "M0,-10 L2.35,-3.24 L9.51,-3.09 L3.8,1.24 L5.88,8.09 L0,4 L-5.88,8.09 L-3.8,1.24 L-9.51,-3.09 L-2.35,-3.24 Z";

    const { data: units, error } = await supabase
        .from("units")
        // Both joins are inner: a lesson with no sets is a dead link, and a
        // unit with no playable lessons is an empty sky.
        .select("*, lessons!inner(*, lesson_sets!inner(set_number))")
        .eq("course_id", 1)
        .order("id")
        .order("id", { referencedTable: "lessons" });

    if (error) return <div className="p-10 text-muted">Could not load the course.</div>;

    // Every set this user has finished, keyed "lessonId:setNumber".
    const { data: completions } = await supabase
        .from("set_completions")
        .select("lesson_id, set_number");
    const doneSets = new Set(completions?.map((c) => `${c.lesson_id}:${c.set_number}`));

    // How many sets each lesson has, and how many of them are done.
    const progress = new Map<number, { done: number; total: number }>();
    for (const unit of units ?? []) {
        for (const lesson of unit.lessons) {
            const setNumbers = [...new Set(lesson.lesson_sets.map((s) => s.set_number))];
            progress.set(lesson.id, {
                done: setNumbers.filter((n) => doneSets.has(`${lesson.id}:${n}`)).length,
                total: setNumbers.length,
            });
        }
    }

    // Walk every lesson in display order (units by id, lessons by id) and mark
    // each unlocked when ALL sets of the lesson before it are done. The first
    // lesson of the course is always open.
    const unlocked = new Map<number, boolean>();
    let prevCompleted = true;
    for (const unit of units ?? []) {
        for (const lesson of unit.lessons) {
            unlocked.set(lesson.id, prevCompleted);
            const p = progress.get(lesson.id)!;
            prevCompleted = p.done >= p.total;
        }
    }

    return (
        <div className="starfield min-h-screen flex flex-col items-center gap-16 py-12 px-6">
            {units?.map((unit, unitIndex) => (
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

                    <svg viewBox="0 0 100 200" className="w-[320px] h-[640px] overflow-visible">

                        {/* One line per gap. A segment leading into a locked
                            lesson is dashed and dimmer. */}
                        {unit.lessons.slice(1).map((lesson, i) => {
                            const prev = unit.lessons[i];
                            const locked = !unlocked.get(lesson.id);
                            return (
                                <line key={lesson.id}
                                    x1={prev.x} y1={prev.y} x2={lesson.x} y2={lesson.y}
                                    strokeWidth="0.8"
                                    strokeLinecap="round"
                                    strokeDasharray={locked ? "2 3" : undefined}
                                    className={locked ? "stroke-white/15" : "stroke-white/25"} />
                            );
                        })}

                        {unit.lessons.map((lesson, lessonIndex) => {
                            const locked = !unlocked.get(lesson.id);
                            const { done, total } = progress.get(lesson.id)!;
                            const finished = done >= total;

                            const label = locked
                                ? `${lesson.name} (locked)`
                                : `${lesson.name} — ${done}/${total} sets`;

                            const star = (
                                <g
                                    transform={`translate(${lesson.x}, ${lesson.y}) scale(0.6)`}
                                    className={locked ? "" : "star-glow"}
                                    style={locked ? undefined : { animationDelay: `${(lessonIndex % 5) * 0.8}s` }}>
                                    {/* One child only. <title> is a raw text element, so
                                        React's text separator comment would be parsed as
                                        literal text and break hydration. */}
                                    <title>{label}</title>

                                    {/* Progress ring: how many sets of this lesson are done. */}
                                    {!locked && total > 1 && (
                                        <circle
                                            r="14" fill="none" strokeWidth="2.5"
                                            strokeDasharray={`${(done / total) * 88} 88`}
                                            transform="rotate(-90)"
                                            className={finished ? "stroke-green-400" : "stroke-brand/70"} />
                                    )}
                                    <path d={STAR_PATH}
                                        className={locked ? "fill-slate-600" : "fill-brand"} />
                                </g>
                            );

                            // Locked lessons are not enterable, so no link.
                            // Use a native SVG <a> (not next/link): an HTML anchor
                            // nested in <svg> hydrates in the wrong namespace and
                            // triggers a hydration mismatch.
                            return locked ? (
                                <g key={lesson.id} className="cursor-not-allowed">{star}</g>
                            ) : (
                                <a key={lesson.id} href={`/lesson/${lesson.id}`} className="cursor-pointer">{star}</a>
                            );
                        })}

                    </svg>

                </section>
            ))}
        </div>
    )
}
