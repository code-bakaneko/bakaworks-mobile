/**
 * Where a recording of a given piece of Japanese lives.
 *
 * The filename is derived from the TEXT ITSELF — its codepoints in hex — so
 * anything that knows what is being said can work out the URL without asking
 * the database. That is what lets lecture text play real audio: a lecture is
 * one string in `content.text` and its Japanese is picked out run by run in
 * the browser, so there is nowhere to put a per-run `audio_url`. Deriving the
 * name instead of storing it removes the need for one.
 *
 * `scripts/generate-audio.js` names the files it uploads with exactly this
 * rule. THE TWO MUST AGREE — change one and change the other, or every
 * lecture silently falls back to the browser voice.
 */

const BUCKET = "bakaworks";
const FOLDER = "audio";

/** Codepoints in hex: あ -> "3042.wav", ああ -> "3042-3042.wav". Keeps
 *  Japanese out of filenames and URLs entirely, which Windows mangles. */
export function audioFileName(text: string): string {
    return [...text].map((ch) => ch.codePointAt(0)!.toString(16)).join("-") + ".wav";
}

export function audioUrlFor(text: string): string {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${base}/storage/v1/object/public/${BUCKET}/${FOLDER}/${audioFileName(text)}`;
}
