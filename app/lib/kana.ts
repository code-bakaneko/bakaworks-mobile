import { toRomaji } from "./romaji";

/**
 * The kana laid out the traditional Japanese way — the gojūon (五十音) table:
 * consonant rows running down, the five vowel columns (a i u e o) running
 * across. The real gaps are kept as holes so the columns line up: the や row
 * has no yi/ye, the わ row no wi/wu/we, and ん stands alone. Dakuten and yōon
 * follow as their own blocks, yōon aligned under the a/u/o columns.
 *
 * Romaji is not stored — it is rule-derivable with `toRomaji`, so there is one
 * fewer thing to keep in sync.
 */

export type KanaScript = "hiragana" | "katakana" | "kanji";

/** Which writing system a character belongs to, by codepoint. Lets content be
 *  grouped by script without any unit or label being trusted to say so. */
export function scriptOf(ch: string): KanaScript | null {
    const cp = ch.codePointAt(0);
    if (cp === undefined) return null;
    if (cp >= 0x3040 && cp <= 0x309f) return "hiragana";
    if (cp >= 0x30a0 && cp <= 0x30ff) return "katakana";
    if (cp >= 0x4e00 && cp <= 0x9fff) return "kanji";
    return null;
}

// --- the static tables (a null is a hole in the grid) ----------------------

type Cell = string | null;
type ChartSection = { title: string; rows: Cell[][] };
type Chart = ChartSection[];

const HIRAGANA_CHART: Chart = [
    {
        title: "Gojūon", rows: [
            ["あ", "い", "う", "え", "お"],
            ["か", "き", "く", "け", "こ"],
            ["さ", "し", "す", "せ", "そ"],
            ["た", "ち", "つ", "て", "と"],
            ["な", "に", "ぬ", "ね", "の"],
            ["は", "ひ", "ふ", "へ", "ほ"],
            ["ま", "み", "む", "め", "も"],
            ["や", null, "ゆ", null, "よ"],
            ["ら", "り", "る", "れ", "ろ"],
            ["わ", null, null, null, "を"],
            ["ん", null, null, null, null],
        ],
    },
    {
        title: "Dakuten", rows: [
            ["が", "ぎ", "ぐ", "げ", "ご"],
            ["ざ", "じ", "ず", "ぜ", "ぞ"],
            ["だ", "ぢ", "づ", "で", "ど"],
            ["ば", "び", "ぶ", "べ", "ぼ"],
            ["ぱ", "ぴ", "ぷ", "ぺ", "ぽ"],
        ],
    },
    {
        title: "Yōon", rows: [
            ["きゃ", null, "きゅ", null, "きょ"],
            ["しゃ", null, "しゅ", null, "しょ"],
            ["ちゃ", null, "ちゅ", null, "ちょ"],
            ["にゃ", null, "にゅ", null, "にょ"],
            ["ひゃ", null, "ひゅ", null, "ひょ"],
            ["みゃ", null, "みゅ", null, "みょ"],
            ["りゃ", null, "りゅ", null, "りょ"],
            ["ぎゃ", null, "ぎゅ", null, "ぎょ"],
            ["じゃ", null, "じゅ", null, "じょ"],
            ["びゃ", null, "びゅ", null, "びょ"],
            ["ぴゃ", null, "ぴゅ", null, "ぴょ"],
        ],
    },
];

const KATAKANA_CHART: Chart = [
    {
        title: "Gojūon", rows: [
            ["ア", "イ", "ウ", "エ", "オ"],
            ["カ", "キ", "ク", "ケ", "コ"],
            ["サ", "シ", "ス", "セ", "ソ"],
            ["タ", "チ", "ツ", "テ", "ト"],
            ["ナ", "ニ", "ヌ", "ネ", "ノ"],
            ["ハ", "ヒ", "フ", "ヘ", "ホ"],
            ["マ", "ミ", "ム", "メ", "モ"],
            ["ヤ", null, "ユ", null, "ヨ"],
            ["ラ", "リ", "ル", "レ", "ロ"],
            ["ワ", null, null, null, "ヲ"],
            ["ン", null, null, null, null],
        ],
    },
    {
        title: "Dakuten", rows: [
            ["ガ", "ギ", "グ", "ゲ", "ゴ"],
            ["ザ", "ジ", "ズ", "ゼ", "ゾ"],
            ["ダ", "ヂ", "ヅ", "デ", "ド"],
            ["バ", "ビ", "ブ", "ベ", "ボ"],
            ["パ", "ピ", "プ", "ペ", "ポ"],
        ],
    },
    {
        title: "Yōon", rows: [
            ["キャ", null, "キュ", null, "キョ"],
            ["シャ", null, "シュ", null, "ショ"],
            ["チャ", null, "チュ", null, "チョ"],
            ["ニャ", null, "ニュ", null, "ニョ"],
            ["ヒャ", null, "ヒュ", null, "ヒョ"],
            ["ミャ", null, "ミュ", null, "ミョ"],
            ["リャ", null, "リュ", null, "リョ"],
            ["ギャ", null, "ギュ", null, "ギョ"],
            ["ジャ", null, "ジュ", null, "ジョ"],
            ["ビャ", null, "ビュ", null, "ビョ"],
            ["ピャ", null, "ピュ", null, "ピョ"],
        ],
    },
];

export { HIRAGANA_CHART, KATAKANA_CHART };

// --- the rendered shape, one slot per character with its learned state ------

export type Slot = { char: string; romaji: string; revealed: boolean; pct: number; xp: number };
export type SlotCell = Slot | null;
export type Section = { title: string; rows: SlotCell[][] };
export type Groups = Record<KanaScript, Section[]>;

export type CharState = { revealed: boolean; pct: number; xp: number };

/** Turn a static chart into render-ready sections, asking `state` how far along
 *  each character is. Holes stay holes. */
export function buildSections(chart: Chart, state: (char: string) => CharState): Section[] {
    return chart.map((section) => ({
        title: section.title,
        rows: section.rows.map((row) =>
            row.map((cell) =>
                cell === null ? null : { char: cell, romaji: toRomaji(cell) ?? "", ...state(cell) }
            )
        ),
    }));
}

/** Kanji has no canonical table, so lay a flat list into rows of five. */
export function listToSections(chars: string[], state: (char: string) => CharState, title = ""): Section[] {
    if (chars.length === 0) return [];
    const rows: Cell[][] = [];
    for (let i = 0; i < chars.length; i += 5) {
        const row: Cell[] = chars.slice(i, i + 5);
        while (row.length < 5) row.push(null);
        rows.push(row);
    }
    return buildSections([{ title, rows }], state);
}
