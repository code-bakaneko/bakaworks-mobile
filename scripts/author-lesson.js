/**
 * Authors hiragana lessons into the database, in the "review one back" shape of
 * lessons 1-3.
 *
 *   node scripts/author-lesson.js --dry     print what would be written
 *   node scripts/author-lesson.js           write it
 *
 * Each lesson teaches one gojūon row. Set 1 is a lecture, then the first kana
 * traced and typed; every later set introduces the next kana (trace, type) and
 * reviews only the one before it (trace, type). A 5-kana row is 5 sets / 19
 * items; a 3-kana row is 3 sets / 11 items.
 *
 * Content is built in memory and sent as a UTF-8 JSON body — no Japanese ever
 * rides on a shell argument, so nothing gets mangled. Re-runnable: a lesson's
 * existing sets are deleted before its new ones are inserted, so editing the
 * config and running again reproduces the lesson exactly.
 *
 * Stroke data comes from scripts/data/strokes.json (see fetch-strokes.js).
 * Audio is a separate, later step (generate-audio.js, needs VOICEVOX); until it
 * runs the lessons still play through the browser's speech fallback.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const STROKES = path.join(__dirname, "data", "strokes.json");

const env = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
const readEnv = (key) => env.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim();
const URL = readEnv("NEXT_PUBLIC_SUPABASE_URL");
const KEY = readEnv("SECRET_KEY");
if (!URL || !KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SECRET_KEY in .env.local");
    process.exit(1);
}

const rest = (query, init = {}) =>
    fetch(`${URL}/rest/v1/${query}`, {
        ...init,
        headers: {
            apikey: KEY,
            Authorization: `Bearer ${KEY}`,
            "Content-Type": "application/json",
            ...init.headers,
        },
    });

// --- the units and lessons to author ---------------------------------------

// Unit 1 becomes the whole base-hiragana cat; unit 2 becomes Words. Blurbs are
// updated too — the old ones still described the "first ten characters" split.
const UNIT_META = {
    1: { name: "Hiragana", blurb: "The whole hiragana chart — every basic sound, one row at a time." },
    2: { name: "Words", blurb: "Your first real words, built from the hiragana you now know." },
};

// k = [kana, romaji]. Lessons 1-3 (あ/か/さ rows) already live in the DB.
const LESSONS = [
    {
        id: 4, unitId: 1, name: "たちつてと",
        lecture:
            "Same move again — a new consonant, t, run across the vowels: た, ち, つ, て, と.\n\n" +
            "Most of the row is regular — ta, te, to — but two shift in the mouth: ち is \"chi\", " +
            "not \"ti\", and つ is \"tsu\", not \"tu\". Japanese has no ti or tu sound, so these are " +
            "as close as it gets — say the ch in \"cheese\" for ち and the ts in \"cats\" for つ.\n\n" +
            "Learn those two odd sounds and the rest of the row is what you already know.\n\n" +
            "See it, hear it, write it.",
        kana: [["た", "ta"], ["ち", "chi"], ["つ", "tsu"], ["て", "te"], ["と", "to"]],
    },
    {
        id: 5, unitId: 1, name: "なにぬねの",
        lecture:
            "The n row: な, に, ぬ, ね, の — na, ni, nu, ne, no.\n\n" +
            "All five are regular, an n in front of each vowel with no surprises. の especially you " +
            "will meet everywhere — it is one of the most common characters in the language, a tiny " +
            "word that links things together.\n\n" +
            "One consonant, five sounds, every one of them already yours.\n\n" +
            "See it, hear it, write it.",
        kana: [["な", "na"], ["に", "ni"], ["ぬ", "nu"], ["ね", "ne"], ["の", "no"]],
    },
    {
        id: 6, unitId: 1, name: "はひふへほ",
        lecture:
            "The h row: は, ひ, ふ, へ, ほ — ha, hi, fu, he, ho.\n\n" +
            "Four are a plain h, but ふ is softer — not quite \"hu\", not quite \"fu\", a breath " +
            "between the two. English \"fu\" is close enough to start.\n\n" +
            "Two of these, は and へ, lead a double life as little words — you will meet that later. " +
            "For now, just the sounds.\n\n" +
            "See it, hear it, write it.",
        kana: [["は", "ha"], ["ひ", "hi"], ["ふ", "fu"], ["へ", "he"], ["ほ", "ho"]],
    },
    {
        id: 7, unitId: 1, name: "まみむめも",
        lecture:
            "The m row: ま, み, む, め, も — ma, mi, mu, me, mo.\n\n" +
            "Regular all the way across: an m before each vowel. Your lips close and open, the same " +
            "shape five times.\n\n" +
            "See it, hear it, write it.",
        kana: [["ま", "ma"], ["み", "mi"], ["む", "mu"], ["め", "me"], ["も", "mo"]],
    },
    {
        id: 8, unitId: 1, name: "やゆよ",
        lecture:
            "The y row is short — only three: や, ゆ, よ — ya, yu, yo.\n\n" +
            "Modern Japanese has no \"yi\" or \"ye\", so the row skips them. These three glide, a y " +
            "sliding into the vowel — like the start of \"yacht\", \"you\", \"yo\".\n\n" +
            "See it, hear it, write it.",
        kana: [["や", "ya"], ["ゆ", "yu"], ["よ", "yo"]],
    },
    {
        id: 9, unitId: 1, name: "らりるれろ",
        lecture:
            "The r row: ら, り, る, れ, ろ — ra, ri, ru, re, ro.\n\n" +
            "The Japanese r is its own sound — not the English r, and not quite an l. A light tap of " +
            "the tongue behind the teeth, closer to the d in \"ladder\". Do not roll it. Copy the " +
            "audio and you will find it.\n\n" +
            "See it, hear it, write it.",
        kana: [["ら", "ra"], ["り", "ri"], ["る", "ru"], ["れ", "re"], ["ろ", "ro"]],
    },
    {
        id: 10, unitId: 1, name: "わをん",
        lecture:
            "The last of the base kana — three that stand a little apart: わ, を, ん — wa, wo, n.\n\n" +
            "わ is \"wa\". を sounds exactly like お (\"o\") but is kept for one job in a sentence, " +
            "which you will meet later. ん is the only character with no vowel at all — a single n " +
            "that ends syllables, like the n in \"pen\".\n\n" +
            "With these, every basic hiragana is yours. The whole chart is filled.\n\n" +
            "See it, hear it, write it.",
        kana: [["わ", "wa"], ["を", "wo"], ["ん", "n"]],
    },
];

// --- build the rows exactly like lessons 1-3 -------------------------------

const strokes = JSON.parse(fs.readFileSync(STROKES, "utf8"));

function traceContent([char, romaji]) {
    const s = strokes[char];
    if (!s) throw new Error(`No stroke data for ${char} — run fetch-strokes.js first`);
    return { guides: s.strokes.length, romaji, strokes: s.strokes, viewBox: s.viewBox, character: char };
}
const typingContent = ([char, romaji]) => ({ audio: char, answer: char, prompt: romaji });

/** The review-one-back rows for one lesson, ordered by set then sort. */
function rowsFor(lesson) {
    const rows = [];
    lesson.kana.forEach((k, i) => {
        const setNumber = i + 1;
        if (i === 0) {
            rows.push({ set_number: 1, sort: 1, type: "lecture", content: { text: lesson.lecture } });
            rows.push({ set_number: 1, sort: 2, type: "trace", content: traceContent(k) });
            rows.push({ set_number: 1, sort: 3, type: "typing", content: typingContent(k) });
        } else {
            const prev = lesson.kana[i - 1];
            rows.push({ set_number: setNumber, sort: 1, type: "trace", content: traceContent(k) });
            rows.push({ set_number: setNumber, sort: 2, type: "typing", content: typingContent(k) });
            rows.push({ set_number: setNumber, sort: 3, type: "trace", content: traceContent(prev) });
            rows.push({ set_number: setNumber, sort: 4, type: "typing", content: typingContent(prev) });
        }
    });
    return rows.map((r) => ({ lesson_id: lesson.id, ...r }));
}

// --- run -------------------------------------------------------------------

async function main() {
    const dry = process.argv.includes("--dry");

    for (const lesson of LESSONS) {
        const rows = rowsFor(lesson);
        const sets = lesson.kana.length;
        console.log(`Lesson ${lesson.id} "${lesson.name}" — ${sets} set(s), ${rows.length} item(s)`);
        if (dry) continue;

        // Rename the star to the row it now teaches, and set its blurb to the
        // row's romaji — the "a i u e o" line lessons 1-3 already use.
        const blurb = lesson.kana.map(([, romaji]) => romaji).join(" ");
        const ren = await rest(`lessons?id=eq.${lesson.id}`, {
            method: "PATCH",
            body: JSON.stringify({ name: lesson.name, blurb }),
        });
        if (!ren.ok) throw new Error(`rename lesson ${lesson.id}: ${await ren.text()}`);

        // Delete-then-insert so re-running reproduces the lesson cleanly.
        const del = await rest(`lesson_sets?lesson_id=eq.${lesson.id}`, { method: "DELETE" });
        if (!del.ok) throw new Error(`clear lesson ${lesson.id}: ${await del.text()}`);

        const ins = await rest("lesson_sets", { method: "POST", body: JSON.stringify(rows) });
        if (!ins.ok) throw new Error(`insert lesson ${lesson.id}: ${await ins.text()}`);
    }

    if (dry) return;

    for (const [id, meta] of Object.entries(UNIT_META)) {
        const res = await rest(`units?id=eq.${id}`, {
            method: "PATCH",
            body: JSON.stringify(meta),
        });
        if (!res.ok) throw new Error(`rename unit ${id}: ${await res.text()}`);
        console.log(`Unit ${id} -> "${meta.name}"`);
    }

    console.log("\nDone. Next: node scripts/generate-audio.js (with VOICEVOX), then node scripts/dump-content.js");
}

main();
