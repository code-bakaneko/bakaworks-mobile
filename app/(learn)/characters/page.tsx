import { getCharacterProgress } from "@/app/lib/progress"
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
 * A slot reveals the moment a completed set has practiced its character; see
 * `getCharacterProgress`. With no content finished, every slot is a mystery.
 */
export default async function CharactersPage() {
    const { taught, unlocked } = await getCharacterProgress(1);

    // Revealed when unlocked; the bar is MASTERY, not unlock. It starts empty
    // and the mastery system will fill it — for now every unlocked card shows a
    // bar with nothing in it yet.
    const state = (char: string): CharState => ({
        revealed: unlocked.has(char),
        pct: 0,
    });

    // Kanji has no canonical table, so its slots are whatever the course teaches.
    const kanji = [...taught].filter((char) => scriptOf(char) === "kanji");

    const groups: Groups = {
        hiragana: buildSections(HIRAGANA_CHART, state),
        katakana: buildSections(KATAKANA_CHART, state),
        kanji: listToSections(kanji, state),
    };

    return <CharacterTabs groups={groups} />;
}
