import { createClient } from "@/app/lib/supabase/server"
import { getCourseProgress } from "@/app/lib/progress"
import {
    HIRAGANA_CHART, KATAKANA_CHART, buildSections, listToSections, scriptOf,
    type Groups, type CharState,
} from "@/app/lib/kana"
import CharacterTabs from "./CharacterTabs"

/**
 * The kana/kanji collection, tabbed by writing system and laid out as the
 * gojūon table (see app/lib/kana.ts). Hiragana and katakana show the FULL
 * canonical set — the point of a collection is to see every slot there is to
 * fill. Kanji has no fixed table, so its tab lays whatever the course teaches
 * into rows of five.
 *
 * A slot reveals when its character is learned. That signal is lesson
 * completion for now — the same source the map and lesson route trust — and
 * swaps to character mastery in one line once that system exists. With content
 * cleared, nothing is learned, so every slot is a mystery.
 */
export default async function CharactersPage() {
    const supabase = await createClient();

    const { data: units } = await supabase
        .from("units")
        .select("id, lessons(id, name)")
        .eq("course_id", 1)
        .order("id")
        .order("id", { referencedTable: "lessons" });

    const { progress } = await getCourseProgress(1);

    // Learned state keyed by the character itself, so a table cell can look up
    // its own progress. Also collect any kanji the course teaches.
    const byChar = new Map<string, CharState>();
    const kanji: string[] = [];

    for (const unit of units ?? []) {
        for (const lesson of unit.lessons) {
            const p = progress.get(lesson.id);
            const revealed = !!p && p.total > 0 && p.done >= p.total;
            const pct = p && p.total > 0 ? (p.done / p.total) * 100 : 0;
            byChar.set(lesson.name, { revealed, pct });
            if (scriptOf(lesson.name) === "kanji") kanji.push(lesson.name);
        }
    }

    const state = (char: string): CharState => byChar.get(char) ?? { revealed: false, pct: 0 };

    const groups: Groups = {
        hiragana: buildSections(HIRAGANA_CHART, state),
        katakana: buildSections(KATAKANA_CHART, state),
        kanji: listToSections(kanji, state),
    };

    return <CharacterTabs groups={groups} />;
}
