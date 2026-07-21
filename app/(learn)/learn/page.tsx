import { createClient } from "@/app/lib/supabase/server"

/**
 * Particles for the progress sparkler. Fixed set, computed once: uneven
 * distances and staggered delays so it reads as a firework rather than a
 * pulsing ring.
 */
/** Seeded pseudo-random in [0,1). Deterministic on purpose — Math.random()
 *  here would differ between server render and any re-render. */
function noise(seed: number): number {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
}

const SPARKS = Array.from({ length: 16 }, (_, i) => {
    // Fan across the upper half only. In SVG y grows downward, so angles from
    // PI to 2PI point up. Jitter every value so no two particles march in step.
    const angle = Math.PI + ((i + noise(i) * 0.9) / 15) * Math.PI;
    const distance = 1.6 + noise(i + 40) * 1.6;

    return {
        dx: +(Math.cos(angle) * distance).toFixed(2),
        dy: +(Math.sin(angle) * distance).toFixed(2),
        r: +(0.13 + noise(i + 80) * 0.16).toFixed(3),
        delay: +(noise(i + 120) * 0.42).toFixed(2),
        duration: +(0.42 + noise(i + 160) * 0.3).toFixed(2),
    };
});

/** Streaks layered over the dots — short rays that shoot outward, giving the
 *  burst direction rather than just presence. Fewer and longer than the dots. */
const STREAKS = Array.from({ length: 7 }, (_, i) => {
    const angle = Math.PI + ((i + noise(i + 200) * 0.9) / 6) * Math.PI;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const inner = 0.5 + noise(i + 240) * 0.5;   // gap before the streak starts
    const length = 0.8 + noise(i + 280) * 1.0;  // how long the ray is
    const travel = 1.7 + noise(i + 320) * 1.5;  // how far it flies

    return {
        x1: +(cos * inner).toFixed(2),
        y1: +(sin * inner).toFixed(2),
        x2: +(cos * (inner + length)).toFixed(2),
        y2: +(sin * (inner + length)).toFixed(2),
        dx: +(cos * travel).toFixed(2),
        dy: +(sin * travel).toFixed(2),
        width: +(0.09 + noise(i + 360) * 0.07).toFixed(3),
        delay: +(noise(i + 400) * 0.4).toFixed(2),
        duration: +(0.45 + noise(i + 440) * 0.28).toFixed(2),
    };
});

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

                        {/* Each segment doubles as the progress bar for the lesson
                            it leaves, and takes its colour from the two stars it
                            joins: white for an unfinished lesson, blue for a
                            finished one. So a half-walked path is white, a path
                            out of a finished lesson fades blue-to-white, and a
                            path between two finished lessons is solid blue. */}
                        {unit.lessons.slice(1).map((lesson, i) => {
                            const prev = unit.lessons[i];
                            const from = progress.get(prev.id)!;
                            const to = progress.get(lesson.id)!;

                            const fromDone = from.done >= from.total;

            // Each end of the line takes the colour of the star it touches, and a
                            // star blues in step with its own progress. So the line is
                            // white between two untouched lessons, blue between two
                            // finished ones, and a gradient at every stage between.
                            const fromFraction = from.total > 0 ? from.done / from.total : 0;
                            const toFraction = to.total > 0 ? to.done / to.total : 0;
                            const fromColor = `color-mix(in srgb, var(--brand) ${fromFraction * 100}%, #ffffff)`;
                            const toColor = `color-mix(in srgb, var(--brand) ${toFraction * 100}%, #ffffff)`;

                            const length = Math.hypot(lesson.x - prev.x, lesson.y - prev.y);
                            const gradientId = `path-${prev.id}-${lesson.id}`;

                            // One chunk per set, so the path itself shows how many
                            // sets the lesson has and how many are done.
                            const GAP = 2.5;
                            const chunks = Math.max(from.total, 1);
                            const chunkLength = (length - GAP * (chunks - 1)) / chunks;

                            const segments = Array.from({ length: chunks }, (_, k) => {
                                const startAt = k * (chunkLength + GAP);
                                const t0 = startAt / length;
                                const t1 = (startAt + chunkLength) / length;

                                return {
                                    lit: k < from.done,
                                    x1: prev.x + (lesson.x - prev.x) * t0,
                                    y1: prev.y + (lesson.y - prev.y) * t0,
                                    x2: prev.x + (lesson.x - prev.x) * t1,
                                    y2: prev.y + (lesson.y - prev.y) * t1,
                                };
                            });

                            return (
                                <g key={lesson.id}>
                                    {/* userSpaceOnUse spans the WHOLE line, so each
                                        chunk picks up the colour at its own position
                                        along it without any per-chunk maths. */}
                                    <defs>
                                        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse"
                                            x1={prev.x} y1={prev.y} x2={lesson.x} y2={lesson.y}>
                                            <stop offset="0%" stopColor={fromColor} />
                                            <stop offset="100%" stopColor={toColor} />
                                        </linearGradient>
                                    </defs>

                                    {/* A finished lesson leaves one unbroken line —
                                        the chunks have served their purpose. Only the
                                        path still being worked on is segmented. */}
                                    {fromDone ? (
                                        <line
                                            x1={prev.x} y1={prev.y} x2={lesson.x} y2={lesson.y}
                                            strokeWidth="1.6" strokeLinecap="round"
                                            stroke={`url(#${gradientId})`} />
                                    ) : (
                                        /* Every chunk is solid. The gaps between them
                                           do the segmenting — dashing the chunks too
                                           produced a ragged pattern that did not line
                                           up with the chunk boundaries. */
                                        segments.map((seg, k) => (
                                            <line key={k}
                                                x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
                                                strokeLinecap="round"
                                                strokeWidth={seg.lit ? 1.6 : 1.2}
                                                stroke={seg.lit ? `url(#${gradientId})` : "#ffffff"}
                                                strokeOpacity={seg.lit ? 1 : 0.2} />
                                        ))
                                    )}

                                    {/* Sparkler at the leading edge — where progress
                                        has actually reached. Only while the lesson is
                                        underway; a finished path has no frontier. */}
                                    {!fromDone && from.done > 0 && (
                                        <g transform={`translate(${segments[from.done - 1].x2}, ${segments[from.done - 1].y2})`}>
                                            {SPARKS.map((spark, k) => (
                                                <circle key={k}
                                                    r={spark.r}
                                                    className={`spark-particle ${k % 3 === 0 ? "fill-brand" : "fill-white"}`}
                                                    style={{
                                                        "--dx": `${spark.dx}px`,
                                                        "--dy": `${spark.dy}px`,
                                                        animationDelay: `${spark.delay}s`,
                                                        animationDuration: `${spark.duration}s`,
                                                    } as React.CSSProperties} />
                                            ))}
                                            {STREAKS.map((streak, k) => (
                                                <line key={`s${k}`}
                                                    x1={streak.x1} y1={streak.y1}
                                                    x2={streak.x2} y2={streak.y2}
                                                    strokeWidth={streak.width}
                                                    strokeLinecap="round"
                                                    stroke={k % 3 === 0 ? "var(--brand)" : "#ffffff"}
                                                    className="spark-particle"
                                                    style={{
                                                        "--dx": `${streak.dx}px`,
                                                        "--dy": `${streak.dy}px`,
                                                        animationDelay: `${streak.delay}s`,
                                                        animationDuration: `${streak.duration}s`,
                                                    } as React.CSSProperties} />
                                            ))}
                                            <circle r="0.7" className="spark-core fill-white" />
                                        </g>
                                    )}
                                </g>
                            );
                        })}

                        {unit.lessons.map((lesson, lessonIndex) => {
                            const locked = !unlocked.get(lesson.id);
                            const { done, total } = progress.get(lesson.id)!;

                            const finished = done >= total;

                            const label = locked
                                ? `${lesson.name} (locked)`
                                : `${lesson.name} — ${done}/${total} sets`;

                            // White until every set is done, then blue. Locked
                            // stars stay dim and unlit.
                            const glow = locked
                                ? ""
                                : finished ? "star-glow" : "star-glow is-white";
                            const fill = locked
                                ? "fill-slate-600"
                                : finished ? "fill-brand" : "fill-white";

                            const star = (
                                <g
                                    transform={`translate(${lesson.x}, ${lesson.y}) scale(0.6)`}
                                    className={glow}
                                    style={locked ? undefined : { animationDelay: `${(lessonIndex % 5) * 0.8}s` }}>
                                    {/* One child only. <title> is a raw text element, so
                                        React's text separator comment would be parsed as
                                        literal text and break hydration. */}
                                    <title>{label}</title>
                                    <path d={STAR_PATH} className={fill} />
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
