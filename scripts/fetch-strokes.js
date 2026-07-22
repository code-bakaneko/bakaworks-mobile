/**
 * Fetches KanjiVG stroke data for kana and caches it in scripts/data/strokes.json.
 *
 *   node scripts/fetch-strokes.js            fetch the built-in default list
 *   node scripts/fetch-strokes.js た ち つ    fetch just these
 *
 * KanjiVG (http://kanjivg.tagaini.net, © Ulrich Apel, CC BY-SA 3.0 — credited
 * on /credits) draws every glyph on a 109×109 canvas as an ordered list of SVG
 * path `d` strings, already in stroke order. We pull those paths out and store
 * them so authoring is offline and reproducible; the shape matches exactly what
 * a `trace` set's content holds ({ strokes, viewBox }).
 *
 * Re-runnable: it merges into the existing cache, so fetching new kana later
 * leaves the ones already saved untouched.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DATA = path.join(__dirname, "data");
const CACHE = path.join(DATA, "strokes.json");
const VIEWBOX = "0 0 109 109";

// The 31 base hiragana still to author (た-row through わ-row); the a/k/s rows
// already live in the database from lessons 1-3.
const DEFAULT = [..."たちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん"];

const kanjivgUrl = (ch) =>
    `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/0${ch
        .codePointAt(0)
        .toString(16)
        .padStart(4, "0")}.svg`;

/** Every stroke's `d`, in document order — which KanjiVG guarantees is stroke
 *  order. The stroke-number <text> labels carry no `d`, so they fall out. */
function extractStrokes(svg) {
    return [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
}

async function main() {
    fs.mkdirSync(DATA, { recursive: true });
    const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, "utf8")) : {};

    const kana = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT;

    for (const ch of kana) {
        process.stdout.write(`  ${ch} (0${ch.codePointAt(0).toString(16)}) ... `);
        const res = await fetch(kanjivgUrl(ch));
        if (!res.ok) {
            console.log(`FAILED ${res.status}`);
            continue;
        }
        const strokes = extractStrokes(await res.text());
        if (strokes.length === 0) {
            console.log("no strokes found");
            continue;
        }
        cache[ch] = { strokes, viewBox: VIEWBOX };
        console.log(`${strokes.length} stroke(s)`);
    }

    fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2) + "\n");
    console.log(`\nSaved ${Object.keys(cache).length} kana to ${path.relative(ROOT, CACHE)}`);
}

main();
