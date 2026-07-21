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

// --- romaji in, kana out ----------------------------------------------------

/** Every romaji spelling that maps to kana, longest matches first. */
const TO_KANA: Record<string, string> = {
    a: "あ", i: "い", u: "う", e: "え", o: "お",
    ka: "か", ki: "き", ku: "く", ke: "け", ko: "こ",
    ga: "が", gi: "ぎ", gu: "ぐ", ge: "げ", go: "ご",
    sa: "さ", shi: "し", si: "し", su: "す", se: "せ", so: "そ",
    za: "ざ", ji: "じ", zi: "じ", zu: "ず", ze: "ぜ", zo: "ぞ",
    ta: "た", chi: "ち", ti: "ち", tsu: "つ", tu: "つ", te: "て", to: "と",
    da: "だ", di: "ぢ", du: "づ", de: "で", do: "ど",
    na: "な", ni: "に", nu: "ぬ", ne: "ね", no: "の",
    ha: "は", hi: "ひ", fu: "ふ", hu: "ふ", he: "へ", ho: "ほ",
    ba: "ば", bi: "び", bu: "ぶ", be: "べ", bo: "ぼ",
    pa: "ぱ", pi: "ぴ", pu: "ぷ", pe: "ぺ", po: "ぽ",
    ma: "ま", mi: "み", mu: "む", me: "め", mo: "も",
    ya: "や", yu: "ゆ", yo: "よ",
    ra: "ら", ri: "り", ru: "る", re: "れ", ro: "ろ",
    wa: "わ", wo: "を", nn: "ん",
    kya: "きゃ", kyu: "きゅ", kyo: "きょ",
    gya: "ぎゃ", gyu: "ぎゅ", gyo: "ぎょ",
    sha: "しゃ", shu: "しゅ", sho: "しょ",
    ja: "じゃ", ju: "じゅ", jo: "じょ",
    cha: "ちゃ", chu: "ちゅ", cho: "ちょ",
    nya: "にゃ", nyu: "にゅ", nyo: "にょ",
    hya: "ひゃ", hyu: "ひゅ", hyo: "ひょ",
    bya: "びゃ", byu: "びゅ", byo: "びょ",
    pya: "ぴゃ", pyu: "ぴゅ", pyo: "ぴょ",
    mya: "みゃ", myu: "みゅ", myo: "みょ",
    rya: "りゃ", ryu: "りゅ", ryo: "りょ",
};

const VOWELS = "aiueo";

/**
 * Converts romaji to kana the way an IME does, leaving any trailing
 * incomplete sequence as latin so the field can be typed into naturally:
 * "k" stays "k" until the vowel arrives and turns it into か.
 */
export function romajiToKana(input: string, final = false): string {
    let out = "";
    let buffer = input.toLowerCase();

    while (buffer.length > 0) {
        // A lone trailing "n" is still pending while typing — it could yet
        // become な or にゃ. Only settle it as ん when the input is finished.
        if (buffer === "n") {
            return out + (final ? "ん" : "n");
        }

        // "nn" typed on its own is the explicit way to write ん.
        if (buffer === "nn") {
            return out + "ん";
        }

        // Doubled consonant becomes a small tsu: "kko" -> っこ.
        if (
            buffer.length >= 2 &&
            buffer[0] === buffer[1] &&
            !VOWELS.includes(buffer[0]) &&
            buffer[0] !== "n"
        ) {
            out += "っ";
            buffer = buffer.slice(1);
            continue;
        }

        // "n" before any consonant is ん — including a second n, which is why
        // konnichiwa gives こんにちわ: the first n closes こん and the second
        // one starts に. Before a vowel or y it is not, since な and にゃ are
        // still possible.
        if (buffer[0] === "n" && buffer.length >= 2) {
            const next = buffer[1];
            if (next !== "y" && !VOWELS.includes(next)) {
                out += "ん";
                buffer = buffer.slice(1);
                continue;
            }
        }

        // Longest match wins, so "sha" is not read as "sa" + leftovers.
        let matched = false;
        for (const size of [3, 2, 1]) {
            const piece = buffer.slice(0, size);
            if (TO_KANA[piece]) {
                out += TO_KANA[piece];
                buffer = buffer.slice(size);
                matched = true;
                break;
            }
        }
        if (matched) continue;

        // Nothing matches yet. If the rest could still become kana, hold it
        // as latin; otherwise pass the character through untouched.
        const couldGrow = Object.keys(TO_KANA).some((k) => k.startsWith(buffer));
        if (couldGrow) return out + buffer;

        out += buffer[0];
        buffer = buffer.slice(1);
    }

    return out;
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
