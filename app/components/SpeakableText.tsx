'use client'

import { useState } from "react";
import { speakJapanese, JAPANESE_RUN } from "@/app/lib/speak";

/**
 * Renders text with every run of Japanese made tappable, so a lecture that
 * mentions あ lets the learner hear あ without any extra authoring — the
 * lecture stays a plain string in the database.
 *
 * Click, not hover: hover does not exist on touch, fires by accident while
 * reading, and is invisible to keyboards and screen readers. Hover only
 * highlights.
 */
export default function SpeakableText({ text }: { text: string }) {
    const [speaking, setSpeaking] = useState<number | null>(null);

    function speak(run: string, key: number) {
        if (!speakJapanese(run)) return;
        setSpeaking(key);
        window.setTimeout(() => setSpeaking(null), 600);
    }

    // split() with a capturing group keeps the separators, so the Japanese
    // runs land on odd indices and the surrounding text on even ones.
    const parts = text.split(JAPANESE_RUN);

    return (
        <>
            {parts.map((part, i) =>
                i % 2 === 1 ? (
                    <button
                        key={i}
                        type="button"
                        onClick={() => speak(part, i)}
                        aria-label={`Play ${part}`}
                        className={`font-bold rounded-sm px-0.5
                            underline decoration-dotted decoration-brand underline-offset-4
                            hover:bg-brand/20 hover:cursor-pointer transition-colors
                            ${speaking === i ? "bg-brand/30 text-white" : "text-brand"}`}>
                        {part}
                    </button>
                ) : (
                    part
                )
            )}
        </>
    );
}
