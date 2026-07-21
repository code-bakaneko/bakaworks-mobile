/**
 * Regenerates COURSE-CONTENT.md from the live Supabase database.
 *
 *   node scripts/dump-content.js
 *
 * NOTES ARE PRESERVED. Every lesson, set and item carries a stable anchor
 * like [item:42]. Any line beginning with ">" directly beneath an anchor is
 * read back out of the existing file and re-attached to the same anchor, so
 * regenerating never destroys what you wrote.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "COURSE-CONTENT.md");

// --- env -------------------------------------------------------------------

const env = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
const readEnv = (key) => env.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim();

const URL = readEnv("NEXT_PUBLIC_SUPABASE_URL");
const KEY = readEnv("SECRET_KEY");

if (!URL || !KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SECRET_KEY in .env.local");
    process.exit(1);
}

// --- keep existing notes ---------------------------------------------------

/** anchor -> array of note lines the user wrote under it */
function readExistingNotes() {
    if (!fs.existsSync(OUT)) return new Map();

    const notes = new Map();
    const lines = fs.readFileSync(OUT, "utf8").split(/\r?\n/);

    let anchor = null;
    let inFence = false;

    for (const line of lines) {
        // The "how to" section contains a worked example in a fence. Without
        // this, that example is parsed as a real note on a real item.
        if (/^\s*```/.test(line)) {
            inFence = !inFence;
            continue;
        }
        if (inFence) continue;

        const found = line.match(/\[(lesson|set|item|course|unit):([^\]]+)\]/);
        if (found) {
            anchor = `${found[1]}:${found[2]}`;
            continue;
        }

        if (/^\s*>/.test(line)) {
            if (!anchor) continue;
            if (!notes.has(anchor)) notes.set(anchor, []);
            notes.get(anchor).push(line.trim());
        } else if (line.trim() !== "") {
            // Any other content ends the note block.
            anchor = null;
        }
    }

    return notes;
}

// --- fetch -----------------------------------------------------------------

async function main() {
    const notes = readExistingNotes();
    const kept = [...notes.values()].reduce((n, v) => n + v.length, 0);

    const query =
        "schools?select=*,subjects(*,courses(*,units(*,lessons(*,lesson_sets(*)))))&order=id";

    const response = await fetch(`${URL}/rest/v1/${query}`, {
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });

    if (!response.ok) {
        console.error("Fetch failed:", response.status, await response.text());
        process.exit(1);
    }

    const schools = await response.json();

    const out = [];
    const w = (s = "") => out.push(s);

    /** Emit an anchor's preserved notes, if any. */
    const emitNotes = (anchor, indent = "") => {
        const lines = notes.get(anchor);
        if (!lines) return;
        for (const line of lines) w(indent + line);
        w();
    };

    let totalSets = 0;
    let totalItems = 0;

    w("# Course Content");
    w();
    w("Live contents of the `lesson_sets` tree, with room for your notes.");
    w();
    w("## How to leave notes");
    w();
    w("Write any line starting with `>` directly **underneath** an anchor. Anchors look");
    w("like `[item:42]`, `[set:3.2]` or `[lesson:3]` and never change.");
    w();
    w("```");
    w("- [item:42] listen — plays か → か / き / く / け");
    w("  > swap this for a harder distractor");
    w("  > and move it after the trace");
    w("```");
    w();
    w("Then run `node scripts/dump-content.js` — the file rebuilds from the database");
    w("and **your notes come back with it**, attached to the same anchors.");
    w();
    w("Notes on something that does not exist yet go in the Requests section at the");
    w("bottom, which is preserved as a whole.");
    w();
    w("---");
    w();

    for (const school of schools) {
        w(`## ${school.name}`);
        if (school.blurb) w(`_${school.blurb}_`);
        w();

        for (const subject of school.subjects ?? []) {
            for (const course of (subject.courses ?? []).sort((a, b) => a.id - b.id)) {
                const units = (course.units ?? []).sort((a, b) => a.id - b.id);
                const lessonCount = units.reduce((n, u) => n + (u.lessons?.length ?? 0), 0);

                w(`### ${course.name} &nbsp; \`[course:${course.id}]\``);
                if (course.blurb) w(`_${course.blurb}_`);
                w();
                emitNotes(`course:${course.id}`);

                if (units.length === 0) {
                    w("_No units yet._");
                    w();
                    continue;
                }

                w(`${units.length} unit(s), ${lessonCount} lesson(s).`);
                w();

                for (const unit of units) {
                    w(`#### Unit — ${unit.name} &nbsp; \`[unit:${unit.id}]\``);
                    if (unit.blurb) w(`_${unit.blurb}_`);
                    w();
                    emitNotes(`unit:${unit.id}`);

                    const lessons = (unit.lessons ?? []).sort((a, b) => a.id - b.id);
                    if (lessons.length === 0) {
                        w("_No lessons yet._");
                        w();
                        continue;
                    }

                    w("| Lesson | Name | Sets | Items | x,y |");
                    w("|--------|------|------|-------|-----|");
                    for (const lesson of lessons) {
                        const sets = new Set((lesson.lesson_sets ?? []).map((s) => s.set_number));
                        w(`| ${lesson.id} | ${lesson.name} | ${sets.size} | ${lesson.lesson_sets?.length ?? 0} | ${lesson.x},${lesson.y} |`);
                    }
                    w();

                    for (const lesson of lessons) {
                        const items = (lesson.lesson_sets ?? []).sort(
                            (a, b) => a.set_number - b.set_number || a.sort - b.sort
                        );

                        w(`##### ${lesson.name} &nbsp; \`[lesson:${lesson.id}]\``);
                        if (lesson.blurb) w(`_${lesson.blurb}_`);
                        w();
                        emitNotes(`lesson:${lesson.id}`);

                        if (items.length === 0) {
                            w("_No content yet._");
                            w();
                            continue;
                        }

                        let currentSet = null;
                        for (const item of items) {
                            if (item.set_number !== currentSet) {
                                if (currentSet !== null) w();
                                currentSet = item.set_number;
                                totalSets++;
                                w(`**Set ${currentSet}** &nbsp; \`[set:${lesson.id}.${currentSet}]\``);
                                w();
                                emitNotes(`set:${lesson.id}.${currentSet}`);
                            }

                            totalItems++;
                            const c = item.content ?? {};
                            const tag = `- \`[item:${item.id}]\``;

                            if (item.type === "lecture") {
                                w(`${tag} **lecture** — ${c.text ?? ""}`);
                            } else if (item.type === "listen") {
                                const choices = (c.choices ?? [])
                                    .map((ch) => (ch === c.answer ? `**${ch}**` : ch))
                                    .join(" / ");
                                w(`${tag} **listen** — plays \`${c.audio ?? ""}\` → ${choices}`);
                            } else if (item.type === "multiple_choice") {
                                const choices = (c.choices ?? [])
                                    .map((ch) => (ch === c.answer ? `**${ch}**` : ch))
                                    .join(" / ");
                                w(`${tag} **multiple choice** — ${c.prompt ?? ""} → ${choices}`);
                            } else if (item.type === "trace") {
                                w(`${tag} **trace** — ${c.character ?? ""} (${c.romaji ?? ""}), ${c.strokes?.length ?? 0} strokes`);
                            } else {
                                w(`${tag} **${item.type}** — ${JSON.stringify(c)}`);
                            }

                            emitNotes(`item:${item.id}`, "  ");
                        }
                        w();
                    }
                }
            }
        }
    }

    w("---");
    w();
    w("## Totals");
    w();
    w(`- Sets: **${totalSets}**`);
    w(`- Items: **${totalItems}**`);
    w();
    w("## Set types");
    w();
    w("| type | meaning | content shape |");
    w("|------|---------|---------------|");
    w("| `lecture` | text to read; any Japanese in it is tappable for audio | `{text}` |");
    w("| `listen` | sound plays, learner picks the kana — no romaji | `{audio, choices, answer}` |");
    w("| `multiple_choice` | text prompt with text choices | `{prompt, choices, answer, audio?}` |");
    w("| `trace` | draw the character stroke by stroke | `{character, romaji, strokes[], viewBox}` |");
    w("| `video` / `audio` | declared, not implemented yet | `{url}` |");
    w();
    w("Stroke data for `trace` comes from [KanjiVG](http://kanjivg.tagaini.net),");
    w("Copyright (C) Ulrich Apel, licensed CC BY-SA 3.0.");
    w();
    w("---");
    w();
    w("## Requests");
    w();
    w("For anything that does not exist yet — new lessons, new units, whole rewrites.");
    w("Write below the anchor, same as anywhere else.");
    w();
    // Anchor last: a note block ends at the first line that is neither a note
    // nor blank, so prose between the anchor and the notes would cut them off.
    w("`[course:requests]`");
    w();

    const requests = notes.get("course:requests");
    if (requests && requests.length > 0) {
        for (const line of requests) w(line);
    } else {
        w("_(nothing yet)_");
    }
    w();

    fs.writeFileSync(OUT, out.join("\n"), "utf8");
    console.log(
        `COURSE-CONTENT.md — ${totalSets} sets, ${totalItems} items, ${kept} note line(s) preserved`
    );
}

main();
