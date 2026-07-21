'use client'

import { useState } from "react";
import { speakJapanese, JAPANESE_RUN } from "@/app/lib/speak";
import { toRomaji } from "@/app/lib/romaji";

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
            {parts.map((part, i) => {
                if (i % 2 === 0) return part;

                const reading = toRomaji(part);

                return (
                    <button
                        key={i}
                        type="button"
                        onClick={() => speak(part, i)}
                        aria-label={`Play ${part}${reading ? ` (${reading})` : ""}`}
                        className={`font-bold rounded-sm px-0.5
                            hover:bg-brand/20 hover:cursor-pointer transition-colors
                            ${speaking === i ? "bg-brand/30 text-white" : "text-brand"}`}>
                        {/* <ruby> is what furigana is made of — the browser
                            positions <rt> above the base text on its own. No
                            reading means no <rt>: a wrong guess above a
                            character someone is learning is worse than none. */}
                        <ruby>
                            {part}
                            {reading && (
                                <rt className="text-[0.5em] font-normal text-muted tracking-wide">
                                    {reading}
                                </rt>
                            )}
                        </ruby>
                    </button>
                );
            })}
        </>
    );
}
