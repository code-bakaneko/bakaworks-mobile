'use client'

import { useState } from "react";

/**
 * Plays a set's audio. Prefers a real file when `url` is given, otherwise
 * falls back to the browser's Japanese speech synthesis voice so lessons
 * have sound before any audio files exist.
 */
export default function AudioButton({ text, url }: { text?: string; url?: string }) {
    const [playing, setPlaying] = useState(false);

    if (!text && !url) return null;

    function play() {
        if (playing) return;

        if (url) {
            const audio = new Audio(url);
            setPlaying(true);
            audio.onended = () => setPlaying(false);
            audio.onerror = () => setPlaying(false);
            audio.play().catch(() => setPlaying(false));
            return;
        }

        if (typeof window === "undefined" || !window.speechSynthesis) return;

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ja-JP";
        utterance.rate = 0.8;

        const japaneseVoice = window.speechSynthesis
            .getVoices()
            .find((voice) => voice.lang.startsWith("ja"));
        if (japaneseVoice) utterance.voice = japaneseVoice;

        utterance.onstart = () => setPlaying(true);
        utterance.onend = () => setPlaying(false);
        utterance.onerror = () => setPlaying(false);

        window.speechSynthesis.speak(utterance);
    }

    return (
        <button
            type="button"
            onClick={play}
            aria-label="Play audio"
            title="Play audio"
            className={`shrink-0 w-14 h-14 rounded-full
                flex items-center justify-center
                border-2 border-brand bg-brand/10
                hover:bg-brand/25 hover:cursor-pointer transition-all
                ${playing ? "scale-110 bg-brand/30" : ""}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="w-6 h-6 text-brand">
                <path d="M11 5 6 9H2v6h4l5 4V5z" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
            </svg>
        </button>
    )
}
