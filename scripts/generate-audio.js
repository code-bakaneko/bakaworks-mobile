/**
 * Generates spoken audio for every set that needs it, once.
 *
 *   node scripts/generate-audio.js --list     list the available voices
 *   node scripts/generate-audio.js --dry      show what would be made
 *   node scripts/generate-audio.js            make it
 *
 * VOICEVOX runs on your own machine and is used ONLY here. The files it
 * produces are uploaded to Supabase storage and their URLs written into
 * `content.audio_url`, after which nothing in the app knows or cares that a
 * synthesizer was ever involved — the player already prefers a URL over the
 * browser's speech voice, so no application code changes.
 *
 * Re-runnable: anything already generated is skipped, so adding characters
 * later means running this again and only the new ones are made.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

// --- config ----------------------------------------------------------------

const VOICEVOX = "http://127.0.0.1:50021";

/**
 * 冥鳴ひまり, normal style. Run with --list to see the alternatives.
 *
 * Chosen by ear over seven others, and for her licence: commercial use is
 * permitted with the credit line "VOICEVOX:冥鳴ひまり" and nothing else —
 * no application, no reporting. 青山龍星 sounded better but restricts
 * commercial use to registered businesses and requires prior permission.
 *
 * CHANGING THIS MEANS RE-RUNNING EVERYTHING. The files are keyed by what is
 * said, not by who says it, so a new voice overwrites all of them at once —
 * cheap to do, but it is all or nothing.
 */
const SPEAKER = Number(process.env.VOICEVOX_SPEAKER ?? 14);

/** Slower than conversation: these are single sounds being learned. */
const SPEED = 0.9;

const BUCKET = "bakaworks";
const FOLDER = "audio";

// --- env -------------------------------------------------------------------

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

// --- which sets need a sound ----------------------------------------------

/**
 * What a set should say, or null when it should stay silent.
 *
 * `audio` is the explicit answer wherever it is set. A trace has none — the
 * character being drawn IS the sound, which is why KanaTracer falls back to
 * it. Lectures are left alone: their Japanese is tapped run by run in the
 * browser, so there is no single string to record.
 */
function spokenText(set) {
    const c = set.content ?? {};
    if (typeof c.audio === "string" && c.audio.trim()) return c.audio.trim();
    if (set.type === "trace" && typeof c.character === "string") return c.character.trim();
    return null;
}

/**
 * ASCII filename from the codepoints, so no Japanese reaches a URL or a shell.
 *
 * MUST MATCH `audioFileName` in app/lib/audio.ts. The browser derives this
 * same name to play lecture audio, since a lecture has no row to hang an
 * `audio_url` on — change one and change the other, or lectures go quiet.
 */
const fileNameFor = (text) =>
    [...text].map((ch) => ch.codePointAt(0).toString(16)).join("-") + ".wav";

/** Hiragana, katakana and kanji. Mirrors JAPANESE_RUN in app/lib/speak.ts. */
const JAPANESE_RUN = /[぀-ヿ一-鿿]+/g;

/**
 * Small kana and the long-vowel mark modify the sound before them and have
 * none of their own. A lecture that mentions っ by name yields it as its own
 * run, and asking the engine to pronounce it in isolation produces nothing
 * worth storing.
 */
const MODIFIERS_ONLY = /^[ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮー]+$/;

const publicUrlFor = (name) =>
    `${URL}/storage/v1/object/public/${BUCKET}/${FOLDER}/${name}`;

// --- voicevox --------------------------------------------------------------

async function listVoices() {
    const response = await fetch(`${VOICEVOX}/speakers`);
    if (!response.ok) throw new Error(`VOICEVOX /speakers: ${response.status}`);

    for (const speaker of await response.json()) {
        const styles = speaker.styles.map((s) => `${s.name}=${s.id}`).join("  ");
        console.log(`${speaker.name}\n    ${styles}`);
    }
}

/**
 * Two calls, as the engine requires: /audio_query analyses the text into
 * mora and pitch, then /synthesis renders that analysis. Splitting them is
 * what lets the speed be adjusted without re-analysing.
 */
async function synthesize(text) {
    const query = await fetch(
        `${VOICEVOX}/audio_query?speaker=${SPEAKER}&text=${encodeURIComponent(text)}`,
        { method: "POST" }
    );
    if (!query.ok) throw new Error(`audio_query ${query.status}: ${await query.text()}`);

    const params = await query.json();
    params.speedScale = SPEED;

    const audio = await fetch(`${VOICEVOX}/synthesis?speaker=${SPEAKER}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
    });
    if (!audio.ok) throw new Error(`synthesis ${audio.status}: ${await audio.text()}`);

    return Buffer.from(await audio.arrayBuffer());
}

// --- storage ---------------------------------------------------------------

async function upload(name, buffer) {
    const response = await fetch(
        `${URL}/storage/v1/object/${BUCKET}/${FOLDER}/${name}`,
        {
            method: "POST",
            headers: {
                apikey: KEY,
                Authorization: `Bearer ${KEY}`,
                "Content-Type": "audio/wav",
                // Regenerating replaces the file rather than erroring, so a
                // voice change is just another run.
                "x-upsert": "true",
            },
            body: buffer,
        }
    );

    if (!response.ok) throw new Error(`upload ${response.status}: ${await response.text()}`);
}

// --- main ------------------------------------------------------------------

async function main() {
    if (process.argv.includes("--list")) return listVoices();

    const dry = process.argv.includes("--dry");

    // A dry run only reads the database, so it works with the engine closed.
    if (!dry) {
        const health = await fetch(`${VOICEVOX}/version`).catch(() => null);
        if (!health?.ok) {
            console.error(`VOICEVOX is not answering on ${VOICEVOX}. Start it and try again.`);
            process.exit(1);
        }
        console.log(`VOICEVOX ${await health.text()}, speaker ${SPEAKER}\n`);
    }

    const sets = await (await rest("lesson_sets?select=id,type,content&order=id")).json();

    // One recording per distinct sound, however many sets use it. あ is drawn
    // seven times in lesson 1 alone; it is one file.
    const byText = new Map();
    for (const set of sets) {
        const text = spokenText(set);
        if (!text) continue;
        if (!byText.has(text)) byText.set(text, []);
        byText.get(text).push(set);
    }

    // Lecture text needs files too, but no row to link them to: the browser
    // picks the Japanese out run by run and derives each URL from the run
    // itself. So these are generated and left unlinked — an empty array.
    for (const set of sets) {
        if (set.type !== "lecture") continue;
        for (const run of (set.content?.text ?? "").match(JAPANESE_RUN) ?? []) {
            if (MODIFIERS_ONLY.test(run)) continue;
            if (!byText.has(run)) byText.set(run, []);
        }
    }

    const linkable = [...byText.values()].filter((using) => using.length > 0).length;
    console.log(
        `${byText.size} distinct sound(s) — ${linkable} linked to sets, ` +
        `${byText.size - linkable} for lecture text\n`
    );

    if (dry) {
        for (const [text, using] of byText) {
            console.log(`  ${text}  ->  ${fileNameFor(text)}   (${using.length} set(s))`);
        }
        return;
    }

    let made = 0;
    let linked = 0;

    for (const [text, using] of byText) {
        const name = fileNameFor(text);
        const url = publicUrlFor(name);

        process.stdout.write(`  ${text} -> ${name} ... `);
        await upload(name, await synthesize(text));
        made++;

        // Point every set that says this at the one file. The content column
        // is jsonb, so the existing keys are spread back in rather than
        // replaced — losing `choices` or `strokes` here would gut the set.
        for (const set of using) {
            if (set.content?.audio_url === url) continue;

            const response = await rest(`lesson_sets?id=eq.${set.id}`, {
                method: "PATCH",
                body: JSON.stringify({ content: { ...set.content, audio_url: url } }),
            });
            if (!response.ok) throw new Error(`patch ${set.id}: ${await response.text()}`);
            linked++;
        }

        console.log(`ok (${using.length} set(s))`);
    }

    console.log(`\n${made} file(s) generated, ${linked} set(s) linked.`);
    console.log("Run `node scripts/dump-content.js` to refresh COURSE-CONTENT.md.");
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
