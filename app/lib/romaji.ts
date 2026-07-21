/**
 * Kana to romaji, for furigana above lecture text.
 *
 * Kana is fully rule-based: あ is always "a". Kanji is NOT — 漢字 could be
 * read many ways depending on the word — so kanji readings have to be looked
 * up, and anything unknown returns null rather than a guess.
 */

const KANA: Record<string, string> = {
    あ: "a", い: "i", う: "u", え: "e", お: "o",
    か: "ka", き: "ki", く: "ku", け: "ke", こ: "ko",
    が: "ga", ぎ: "gi", ぐ: "gu", げ: "ge", ご: "go",
    さ: "sa", し: "shi", す: "su", せ: "se", そ: "so",
    ざ: "za", じ: "ji", ず: "zu", ぜ: "ze", ぞ: "zo",
    た: "ta", ち: "chi", つ: "tsu", て: "te", と: "to",
    だ: "da", ぢ: "ji", づ: "zu", で: "de", ど: "do",
    な: "na", に: "ni", ぬ: "nu", ね: "ne", の: "no",
    は: "ha", ひ: "hi", ふ: "fu", へ: "he", ほ: "ho",
    ば: "ba", び: "bi", ぶ: "bu", べ: "be", ぼ: "bo",
    ぱ: "pa", ぴ: "pi", ぷ: "pu", ぺ: "pe", ぽ: "po",
    ま: "ma", み: "mi", む: "mu", め: "me", も: "mo",
    や: "ya", ゆ: "yu", よ: "yo",
    ら: "ra", り: "ri", る: "ru", れ: "re", ろ: "ro",
    わ: "wa", ゐ: "wi", ゑ: "we", を: "wo", ん: "n",
    ゔ: "vu",
};

/** Small ya/yu/yo fold into the previous character: き + ゃ = kya. */
const SMALL_Y: Record<string, string> = { ゃ: "ya", ゅ: "yu", ょ: "yo" };

/** Readings that cannot be derived. Extend as lectures use more kanji. */
const KANJI: Record<string, string> = {
    "漢字": "kanji",
    "仮名": "kana",
    "平仮名": "hiragana",
    "片仮名": "katakana",
    "日本": "nihon",
    "日本語": "nihongo",
    "山": "yama",
    "川": "kawa",
    "人": "hito",
    "水": "mizu",
    "火": "hi",
    "本": "hon",
};

const isKatakana = (ch: string) => ch >= "ァ" && ch <= "ヶ";
const toHiragana = (ch: string) =>
    isKatakana(ch) ? String.fromCharCode(ch.charCodeAt(0) - 0x60) : ch;

/**
 * Returns the romaji for a run of Japanese, or null when it cannot be
 * determined — an unknown kanji, say. Null means "render no furigana",
 * which is always better than printing a wrong reading above a character
 * someone is trying to learn.
 */
export function toRomaji(run: string): string | null {
    if (KANJI[run]) return KANJI[run];

    let out = "";

    for (let i = 0; i < run.length; i++) {
        const raw = run[i];
        const ch = toHiragana(raw);

        // Long vowel mark repeats whatever vowel came before it.
        if (raw === "ー") {
            out += out.slice(-1);
            continue;
        }

        // Small tsu doubles the next consonant: がっこう -> gakkou.
        if (ch === "っ") {
            const next = toHiragana(run[i + 1] ?? "");
            const sound = KANA[next];
            if (sound) out += sound[0];
            continue;
        }

        const small = SMALL_Y[toHiragana(run[i + 1] ?? "")];
        const sound = KANA[ch];

        if (!sound) return null; // kanji or something unmapped

        if (small) {
            // Drop the vowel and graft the y-sound on: き + ゃ -> kya.
            out += sound.replace(/i$/, "") + small;
            i++;
            continue;
        }

        out += sound;
    }

    return out || null;
}

export type RomajiToken = { text: string; romaji: string };

/**
 * Splits a run into per-character pieces with each piece's own reading, for
 * showing the reading above each character.
 *
 * A "character" here is a sound, not a codepoint: きゃ is one token, and a
 * small tsu joins the character it doubles. Kanji cannot be split reliably —
 * 漢字 is two characters but its reading is looked up as a whole — so a known
 * kanji word comes back as a single token.
 */
export function toRomajiTokens(run: string): RomajiToken[] | null {
    if (KANJI[run]) return [{ text: run, romaji: KANJI[run] }];

    const tokens: RomajiToken[] = [];

    for (let i = 0; i < run.length; i++) {
        const raw = run[i];
        const ch = toHiragana(raw);

        // Long vowel mark belongs to the sound before it.
        if (raw === "ー") {
            const previous = tokens[tokens.length - 1];
            if (!previous) return null;
            previous.text += raw;
            previous.romaji += previous.romaji.slice(-1);
            continue;
        }

        // Small tsu doubles the next consonant, so it rides along with it.
        if (ch === "っ") {
            const nextRaw = run[i + 1];
            const next = toHiragana(nextRaw ?? "");
            const sound = KANA[next];
            if (!sound) return null;

            const small = SMALL_Y[toHiragana(run[i + 2] ?? "")];
            const body = small ? sound.replace(/i$/, "") + small : sound;

            tokens.push({
                text: raw + nextRaw + (small ? run[i + 2] : ""),
                romaji: sound[0] + body,
            });
            i += small ? 2 : 1;
            continue;
        }

        const small = SMALL_Y[toHiragana(run[i + 1] ?? "")];
        const sound = KANA[ch];
        if (!sound) return null;

        if (small) {
            tokens.push({
                text: raw + run[i + 1],
                romaji: sound.replace(/i$/, "") + small,
            });
            i++;
            continue;
        }

        tokens.push({ text: raw, romaji: sound });
    }

    return tokens.length > 0 ? tokens : null;
}
