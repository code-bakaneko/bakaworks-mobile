import Link from "next/link";
import { createClient } from "@/app/lib/supabase/server";
import {
    HIRAGANA_CHART, KATAKANA_CHART, buildSections, scriptOf,
    type KanaScript, type Groups,
} from "@/app/lib/kana";
import CharacterTabs from "@/app/(learn)/characters/CharacterTabs";

/**
 * Every set in the course, each one playable directly.
 *
 * Lives under /admin because proxy.ts already turns away anyone whose profile
 * role is not admin — no new permission check to write, and none to forget.
 */
export default async function AdminPreviewPage() {
    const supabase = await createClient();

    const { data: units, error } = await supabase
        .from("units")
        .select("id, name, lessons(id, name, blurb, lesson_sets(set_number, type))")
        .order("position")
        .order("id")
        .order("position", { referencedTable: "lessons" })
        .order("id", { referencedTable: "lessons" });

    if (error) return <div className="p-10 text-muted">Could not load the course.</div>;

    // The full canonical set, every slot revealed — a reference of every
    // character the collection covers, laid out as the gojūon table.
    const revealed = () => ({ revealed: true, pct: 0, xp: 0 });
    const fullSet: Groups = {
        hiragana: buildSections(HIRAGANA_CHART, revealed),
        katakana: buildSections(KATAKANA_CHART, revealed),
        kanji: [],
    };

    // Group lessons by writing system, not by unit — so the two hiragana units
    // (kept separate for their cat constellations) read as one "Hiragana"
    // section here, with no "Part 1 / Part 2".
    const lessons = (units ?? []).flatMap((u) => u.lessons);
    const byScript: Record<KanaScript, typeof lessons> = { hiragana: [], katakana: [], kanji: [] };
    for (const lesson of lessons) {
        const script = scriptOf(lesson.name);
        if (script) byScript[script].push(lesson);
    }
    const SCRIPTS: { key: KanaScript; label: string }[] = [
        { key: "hiragana", label: "Hiragana" },
        { key: "katakana", label: "Katakana" },
        { key: "kanji", label: "Kanji" },
    ];

    return (
        <div className="min-h-screen px-4 py-10">
            <div className="w-full flex flex-col gap-10">

                <header className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.2em] text-brand font-bold">
                        Admin
                    </span>
                    <h1 className="text-3xl font-extrabold">Content Preview</h1>
                    <p className="text-muted text-sm">
                        Play any set directly. Nothing is recorded, no gold is paid, and
                        locked lessons are open — your own progress is untouched.
                    </p>
                </header>

                {SCRIPTS.map(({ key, label }) => {
                    const group = byScript[key];
                    if (group.length === 0) return null;

                    return (
                    <section key={key} className="flex flex-col gap-4">
                        <h2 className="text-lg font-extrabold border-b border-white/10 pb-2">
                            {label}
                        </h2>

                        {group.map((lesson) => {
                            // Group the items so each button can say what is inside.
                            const sets = new Map<number, string[]>();
                            for (const item of lesson.lesson_sets) {
                                if (!sets.has(item.set_number)) sets.set(item.set_number, []);
                                sets.get(item.set_number)!.push(item.type);
                            }
                            const ordered = [...sets.entries()].sort((a, b) => a[0] - b[0]);

                            return (
                                <div key={lesson.id}
                                    className="flex flex-wrap items-center gap-3 py-1">
                                    <span className="w-20 shrink-0 flex items-baseline gap-2">
                                        <span className="text-2xl font-bold">{lesson.name}</span>
                                        <span className="text-xs text-muted">{lesson.blurb}</span>
                                    </span>

                                    {ordered.length === 0 && (
                                        <span className="text-sm text-muted">no sets</span>
                                    )}

                                    {ordered.map(([setNumber, types]) => {
                                        // "3 trace" reads better than "trace, trace, trace".
                                        const counts = new Map<string, number>();
                                        for (const t of types) counts.set(t, (counts.get(t) ?? 0) + 1);
                                        const summary = [...counts.entries()]
                                            .map(([t, n]) => (n > 1 ? `${n} ${t}` : t))
                                            .join(", ");

                                        return (
                                            <Link
                                                key={setNumber}
                                                href={`/admin/preview/${lesson.id}/${setNumber}`}
                                                title={summary}
                                                className="px-3 py-1.5 rounded-sm text-sm
                                                    bg-slate-950 border border-white/15
                                                    hover:border-brand hover:bg-brand/10
                                                    transition-colors">
                                                <span className="font-bold">Set {setNumber}</span>
                                                <span className="text-muted ml-2 text-xs">{summary}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </section>
                    );
                })}

                <section className="flex flex-col gap-4">
                    <h2 className="text-lg font-extrabold border-b border-white/10 pb-2">
                        Characters — full set
                    </h2>
                    <CharacterTabs groups={fullSet} />
                </section>
            </div>
        </div>
    );
}
