'use client'

import { useState } from "react";
import { playJapanese, JAPANESE_RUN } from "@/app/lib/speak";
import { toRomajiTokens } from "@/app/lib/romaji";

/**
 * Renders text with every run of Japanese tappable, so a lecture that
 * mentions あ lets the learner hear あ without any extra authoring — the
 * lecture stays a plain string in the database.
 *
 * The reading appears in a popup on hover, and also while the audio is
 * playing: hover does not exist on touch, so without the second trigger
 * phone users would never see a reading at all.
 */
export default function SpeakableText({ text }: { text: string }) {
    const [speaking, setSpeaking] = useState<number | null>(null);

    function speak(run: string, key: number) {
        playJapanese(run);
        setSpeaking(key);
        window.setTimeout(() => setSpeaking(null), 1400);
    }

    // split() with a capturing group keeps the separators, so the Japanese
    // runs land on odd indices and the surrounding text on even ones.
    const parts = text.split(JAPANESE_RUN);

    return (
        <>
            {parts.map((part, i) => {
                if (i % 2 === 0) return part;

                const tokens = toRomajiTokens(part);
                const active = speaking === i;
                const label = tokens?.map((t) => t.romaji).join("");

                return (
                    <span key={i} className="relative inline-block group">
                        <button
                            type="button"
                            onClick={() => speak(part, i)}
                            aria-label={`Play ${part}${label ? ` (${label})` : ""}`}
                            className={`font-bold rounded-sm px-0.5
                                underline decoration-dotted decoration-brand/60 underline-offset-4
                                hover:bg-brand/20 hover:cursor-pointer transition-colors
                                ${active ? "bg-brand/30 text-white" : "text-brand"}`}>
                            {part}
                        </button>

                        {tokens && (
                            <span
                                role="tooltip"
                                className={`pointer-events-none absolute z-20 bottom-full left-1/2
                                    -translate-x-1/2 mb-1.5 px-3 py-2
                                    rounded-sm whitespace-nowrap
                                    bg-slate-950 border border-brand/40
                                    flex items-end gap-2
                                    transition-opacity duration-150
                                    ${active ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                                {/* Each character with its own reading directly
                                    above it, so the mapping is visible rather
                                    than left to be worked out from one string. */}
                                {tokens.map((token, k) => (
                                    <span key={k} className="flex flex-col items-center leading-none">
                                        <span className="text-[0.6em] text-brand font-bold mb-1">
                                            {token.romaji}
                                        </span>
                                        <span className="text-base font-bold text-white">
                                            {token.text}
                                        </span>
                                    </span>
                                ))}
                            </span>
                        )}
                    </span>
                );
            })}
        </>
    );
}
