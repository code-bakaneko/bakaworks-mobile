'use client'

import { useEffect, useRef, useState } from "react";
import { romajiToKana } from "@/app/lib/romaji";

/**
 * A field that turns romaji into kana as you type, the way an IME does —
 * otherwise あ is simply unreachable on a latin keyboard.
 *
 * The raw romaji is kept in state and converted for display, rather than
 * converting in place. Converting the stored value would strip the pending
 * consonant: type "k" for か and it would vanish before the vowel arrived.
 */
export default function KanaInput({
    answer,
    checked,
    onChange,
}: {
    answer: string;
    checked: boolean;
    onChange: (correct: boolean, value: string) => void;
}) {
    const [raw, setRaw] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const display = romajiToKana(raw);
    const settled = romajiToKana(raw, true);
    const isCorrect = settled === answer;

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        onChange(isCorrect, settled);
    }, [isCorrect, settled, onChange]);

    let border = "border-white/15 focus-within:border-brand";
    if (checked) border = isCorrect ? "border-green-500" : "border-red-500";

    return (
        <div className="flex flex-col items-center gap-3 w-full">
            <div
                onClick={() => inputRef.current?.focus()}
                className={`w-full h-24 rounded-sm border-2 bg-slate-950
                    flex items-center justify-center
                    transition-colors cursor-text ${border}`}>
                <span className="text-4xl font-bold tracking-wider">
                    {display || <span className="text-white/25">…</span>}
                </span>
            </div>

            {/* The real field is invisible: it holds romaji, while the box
                above shows the kana it becomes. */}
            <input
                ref={inputRef}
                value={raw}
                onChange={(e) => setRaw(e.target.value.replace(/[^a-zA-Z-]/g, ""))}
                disabled={checked}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                aria-label="Type in romaji"
                className="sr-only" />

            <span className="text-sm text-muted">
                {checked
                    ? isCorrect ? "Correct" : `Answer: ${answer}`
                    : `Type it in romaji — it becomes kana as you go`}
            </span>

            {/* The IME-style tricks, shown by example: ん needs a double n (a
                lone one stays latin until you finish), the hyphen makes the long
                vowel, a doubled consonant makes a small tsu, and an x-prefix
                forces any small kana. */}
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5 text-xs text-white/40">
                <span className="font-mono"><span className="text-white/60">nn</span> → ん</span>
                <span className="font-mono"><span className="text-white/60">-</span> → ー</span>
                <span className="font-mono"><span className="text-white/60">tta</span> → った</span>
                <span className="font-mono"><span className="text-white/60">xya</span> → ゃ</span>
            </div>
        </div>
    );
}
