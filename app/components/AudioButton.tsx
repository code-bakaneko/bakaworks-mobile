'use client'

import { useCallback, useEffect, useState } from "react";
import { speakJapanese } from "@/app/lib/speak";

/**
 * Plays a set's audio. Prefers a real file when `url` is given, otherwise
 * falls back to the browser's Japanese speech synthesis voice so lessons
 * have sound before any audio files exist.
 */
export default function AudioButton({
    text,
    url,
    size = "sm",
    autoPlay = false,
}: {
    text?: string;
    url?: string;
    size?: "sm" | "lg";
    autoPlay?: boolean;
}) {
    const [playing, setPlaying] = useState(false);

    const play = useCallback(() => {
        if (url) {
            const audio = new Audio(url);
            setPlaying(true);
            audio.onended = () => setPlaying(false);
            audio.onerror = () => setPlaying(false);
            audio.play().catch(() => setPlaying(false));
            return;
        }

        if (!text) return;
        if (!speakJapanese(text)) return;

        // speechSynthesis fires onstart/onend inconsistently across browsers,
        // so the pressed state is timed rather than event-driven.
        setPlaying(true);
        window.setTimeout(() => setPlaying(false), 700);
    }, [text, url]);

    // Autoplay is best-effort. Browsers block sound before the page has seen a
    // user gesture, which is exactly why the button is always visible: a
    // blocked autoplay must never leave the question unanswerable.
    useEffect(() => {
        if (!autoPlay) return;
        const timer = setTimeout(play, 250);
        return () => clearTimeout(timer);
    }, [autoPlay, play]);

    if (!text && !url) return null;

    const large = size === "lg";

    return (
        <button
            type="button"
            onClick={play}
            aria-label="Play audio"
            title="Play audio"
            className={`shrink-0 rounded-full
                flex items-center justify-center
                border-2 border-brand bg-brand/10
                hover:bg-brand/25 hover:cursor-pointer transition-all
                ${large ? "w-28 h-28" : "w-14 h-14"}
                ${playing ? "scale-110 bg-brand/30" : ""}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={`text-brand ${large ? "w-12 h-12" : "w-6 h-6"}`}>
                <path d="M11 5 6 9H2v6h4l5 4V5z" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
            </svg>
        </button>
    )
}
