import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import SpeakableText from "@/app/components/SpeakableText";

/** `content` is jsonb; a lecture only ever carries text. */
type LectureContent = { text?: string };

/**
 * Everything this lesson has taught, re-readable at any time.
 *
 * Only lectures from sets the learner has FINISHED appear. That is the whole
 * access rule and it is enforced by the query itself rather than by hiding a
 * button: the page is reachable by URL, so an unfinished set must simply have
 * nothing here to read.
 */
export default async function LessonGuidePage({
    params,
}: {
    params: Promise<{ lessonId: string }>
}) {
    const { lessonId } = await params;
    const id = Number(lessonId);

    const supabase = await createClient();

    const { data: lesson } = await supabase
        .from("lessons")
        .select("id, name, blurb, lesson_sets(set_number, sort, type, content)")
        .order("set_number", { referencedTable: "lesson_sets" })
        .order("sort", { referencedTable: "lesson_sets" })
        .eq("id", id)
        .single();

    if (!lesson) redirect("/learn");

    const { data: completions } = await supabase
        .from("set_completions")
        .select("set_number")
        .eq("lesson_id", id);
    const done = new Set(completions?.map((c) => c.set_number));

    const lectures = lesson.lesson_sets.filter(
        (item) => item.type === "lecture" && done.has(item.set_number)
    );

    // Nothing finished yet means nothing to review — and no hint that there
    // was ever anything here.
    if (lectures.length === 0) redirect("/learn");

    return (
        <div className="starfield lesson-enter min-h-screen px-6 py-10">
            <div className="max-w-2xl mx-auto flex flex-col gap-8">

                <header className="flex items-center gap-4">
                    <Link href="/learn"
                        className="text-muted hover:text-white transition-colors text-2xl leading-none">
                        ✕
                    </Link>
                    <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-[0.2em] text-brand font-bold">
                            Guide
                        </span>
                        <h1 className="text-3xl font-extrabold leading-tight">
                            {lesson.name}
                            {lesson.blurb && (
                                <span className="text-muted font-normal text-xl ml-3">
                                    {lesson.blurb}
                                </span>
                            )}
                        </h1>
                    </div>
                </header>

                <div className="flex flex-col gap-6">
                    {lectures.map((item, i) => (
                        <section key={`${item.set_number}-${item.sort}`}
                            className="bg-slate-950/60 border border-white/10 rounded-lg p-6
                                flex flex-col gap-3">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-muted font-bold">
                                Part {i + 1}
                            </span>
                            <p className="text-lg md:text-xl leading-relaxed">
                                <SpeakableText text={(item.content as LectureContent)?.text ?? ""} />
                            </p>
                        </section>
                    ))}
                </div>

                <p className="text-sm text-muted text-center">
                    Tap any Japanese to hear it. More is added here as you finish more sets.
                </p>

            </div>
        </div>
    );
}
