'use client'

import { useCallback, useEffect, useState } from "react";
import { playJapanese } from "@/app/lib/speak";

/**
 * Plays a set's audio, in order of preference:
 *
 *   1. `url`, when the set stores one explicitly
 *   2. the recording of `text`, found by deriving its filename
 *   3. the browser's Japanese voice
 *
 * Step 2 is what makes this work everywhere without plumbing. A trace set
 * carries `character` and `audio_url` but no `audio`, so passing only the
 * character used to mean the browser voice spoke it — silently, on any
 * machine without a Japanese voice installed. Deriving the URL from the text
 * means anything that knows WHAT is being said gets the recording, whether
 * or not whoever wired it up remembered to pass a URL.
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
        playJapanese(text);

        // The recording and the synth report progress differently, and
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
