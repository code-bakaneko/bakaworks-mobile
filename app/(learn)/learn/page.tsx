import { createClient } from "@/app/lib/supabase/server"
import Link from "next/link";

export default async function LearnPage() {
    const supabase = await createClient();
    const STAR_PATH =
    "M0,-10 L2.35,-3.24 L9.51,-3.09 L3.8,1.24 L5.88,8.09 L0,4 L-5.88,8.09 L-3.8,1.24 L-9.51,-3.09 L-2.35,-3.24 Z";

    const { data: units, error } = await supabase
        .from("units")
        .select("*, lessons(*)")
        .eq("course_id", 1)
        .order("id")
        .order("id", { referencedTable: "lessons" });

    if (error) return <div className="p-10 text-muted">Could not load the course.</div>;

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

                        <polyline
                            points={unit.lessons.map((lesson) => `${lesson.x},${lesson.y}`).join(" ")}
                            fill="none"
                            strokeWidth="0.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="stroke-white/25" />

                        {unit.lessons.map((lesson, lessonIndex) => (
                            <Link key={lesson.id} href={`/learn/${lesson.id}`}>
                                <g
                                    transform={`translate(${lesson.x}, ${lesson.y}) scale(0.6)`}
                                    className="star-glow"
                                    style={{ animationDelay: `${(lessonIndex % 5) * 0.8}s` }}>
                                    <title>{lesson.name}</title>
                                    <path d={STAR_PATH} className="fill-brand" />
                                </g>
                            </Link>
                        ))}

                    </svg>

                </section>
            ))}
        </div>
    )
}
