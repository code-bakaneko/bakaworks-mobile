import { audioUrlFor } from "./audio";

/**
 * Speaks Japanese text with the browser's ja-JP voice.
 *
 * Shared by the audio button and the tappable text in lectures so both sound
 * identical — same voice, same rate. Returns false when speech is
 * unavailable, which happens when the machine has no Japanese voice
 * installed.
 */
export function speakJapanese(text: string, rate = 0.8): boolean {
    if (typeof window === "undefined" || !window.speechSynthesis) return false;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = rate;

    const japaneseVoice = window.speechSynthesis
        .getVoices()
        .find((voice) => voice.lang.startsWith("ja"));
    if (japaneseVoice) utterance.voice = japaneseVoice;

    window.speechSynthesis.speak(utterance);
    return true;
}

/** Hiragana, katakana, and kanji — everything worth reading aloud. */
export const JAPANESE_RUN = /([぀-ヿ一-鿿]+)/g;

/**
 * Says a piece of Japanese, preferring a real recording.
 *
 * The recording is the point: `speechSynthesis` is silent on any machine
 * without a Japanese voice installed, which is most machines belonging to
 * people who do not speak Japanese — precisely this app's users. It stays as
 * a fallback for text nobody has recorded yet.
 *
 * A missing file is not an error worth surfacing. It means "not recorded",
 * and the browser voice covers it.
 */
export function playJapanese(text: string): void {
    if (typeof window === "undefined") return;

    // Cancel any synth still going, or a fallback from the last tap talks
    // over this one.
    window.speechSynthesis?.cancel();

    const audio = new Audio(audioUrlFor(text));
    audio.onerror = () => speakJapanese(text);
    audio.play().catch(() => speakJapanese(text));
}
