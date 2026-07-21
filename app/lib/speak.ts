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
