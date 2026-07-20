import { createClient } from "@/app/lib/supabase/server"
import Link from "next/link"

// Visual only — no icon column on `courses` yet. Unmatched names fall back to 🌐.
const COURSE_ICONS: Record<string, string> = {
    Japanese: "🇯🇵",
    Spanish: "🇪🇸",
    Korean: "🇰🇷",
    Mandarin: "🇨🇳",
    Cantonese: "🇭🇰",
    Italian: "🇮🇹",
    French: "🇫🇷",
    German: "🇩🇪",
    Portuguese: "🇧🇷",
    Vietnamese: "🇻🇳",
    Thai: "🇹🇭",
    Tagalog: "🇵🇭",
    Russian: "🇷🇺",
    Arabic: "🇸🇦",
    Hindi: "🇮🇳",
};

export default async function PreRegisterCoursePage() {
    const supabase = await createClient();

    const { data: schools, error } = await supabase
        .from("schools")
        .select("*, subjects(*, courses(*))")
        .order("id");

    if (error) return (
        <div className="min-h-screen flex items-center justify-center text-muted">
            Failure to load courses.
        </div>
    );

    return (
        <div className="starfield min-h-screen px-6 py-20">
            <div className="max-w-4xl mx-auto flex flex-col gap-20">

                <header className="text-center flex flex-col gap-4">
                    <span className="text-xs uppercase tracking-[0.2em] text-brand font-bold">
                        Enrollment
                    </span>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                        What do you want to learn?
                    </h1>
                    <p className="text-muted max-w-md mx-auto">
                        Pick a course to start. You can add more later — nothing here is permanent.
                    </p>
                </header>

                {schools?.map((school) => (
                    <section key={school.id} className="flex flex-col gap-10">

                        <div className="flex flex-col gap-1 border-b border-white/10 pb-4">
                            <h2 className="text-2xl font-extrabold">{school.name}</h2>
                            {school.blurb && (
                                <p className="text-sm text-muted">{school.blurb}</p>
                            )}
                        </div>

                        {school.subjects?.map((subject) => (
                            <section key={subject.id} className="flex flex-col gap-5">

                                <div className="grid gap-4
                                    grid-cols-[repeat(auto-fill,minmax(9rem,1fr))]">
                                    {subject.courses?.map((course) => (
                                        <Link
                                            key={course.id}
                                            href={`/learn?course=${course.id}`}
                                            title={course.blurb ?? course.name}
                                            className="group
                                                aspect-square p-4
                                                flex flex-col items-center justify-center gap-3
                                                bg-slate-950/60 rounded-lg
                                                border border-white/10 border-b-4 border-b-brand
                                                hover:border-white/30 hover:border-b-brand
                                                hover:-translate-y-1 hover:bg-slate-950
                                                transition-all">
                                            <span className="text-4xl leading-none
                                                transition-transform group-hover:scale-110">
                                                {COURSE_ICONS[course.name] ?? "🌐"}
                                            </span>
                                            <span className="font-bold text-center text-sm">
                                                {course.name}
                                            </span>
                                        </Link>
                                    ))}
                                </div>

                            </section>
                        ))}

                    </section>
                ))}

            </div>
        </div>
    )
}
