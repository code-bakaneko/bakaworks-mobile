"use client"
import { useState } from "react"
import type { Groups, KanaScript, Slot } from "@/app/lib/kana"

const TABS: { key: KanaScript; label: string }[] = [
    { key: "hiragana", label: "Hiragana" },
    { key: "katakana", label: "Katakana" },
    { key: "kanji", label: "Kanji" },
];

const EMPTY: Record<KanaScript, string> = {
    hiragana: "No hiragana yet.",
    katakana: "No katakana yet — they arrive as the course grows.",
    kanji: "No kanji yet — they arrive as the course grows.",
};

export default function CharacterTabs({ groups }: { groups: Groups }) {
    const [active, setActive] = useState<KanaScript>("hiragana");
    const sections = groups[active];
    const real = sections.flatMap((s) => s.rows.flat()).filter((c): c is Slot => c !== null);
    const unlocked = real.filter((s) => s.revealed).length;

    return (
        <div className="w-full px-2 py-4 flex flex-col gap-6">
            <div className="flex flex-col gap-3">
                <div className="flex gap-6 border-b border-white/10">
                    {TABS.map((tab) => (
                        <button key={tab.key} onClick={() => setActive(tab.key)}
                            className={`-mb-px pb-2 border-b-2 text-sm font-bold transition-colors
                                ${active === tab.key
                                    ? "border-brand text-white"
                                    : "border-transparent text-muted hover:text-white"}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {real.length > 0 && (
                    <span className="text-xs uppercase tracking-[0.2em] text-muted font-bold">
                        {unlocked} of {real.length} unlocked
                    </span>
                )}
            </div>

            {real.length === 0 ? (
                <p className="text-muted text-sm py-16 text-center">{EMPTY[active]}</p>
            ) : (
                <div className="flex flex-col gap-8">
                    {sections.map((section, si) => (
                        <div key={si} className="flex flex-col gap-2.5">
                            {section.title && (
                                <h3 className="text-xs uppercase tracking-[0.2em] text-muted font-bold">
                                    {section.title}
                                </h3>
                            )}
                            <div className="grid grid-cols-5 gap-2.5">
                                {section.rows.flat().map((cell, i) =>
                                    cell === null ? (
                                        <div key={`e${i}`} aria-hidden className="aspect-square" />
                                    ) : cell.revealed ? (
                                        <Known key={cell.char} slot={cell} />
                                    ) : (
                                        <Mystery key={cell.char} />
                                    )
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/** A veiled slot: a faint, glowing ？ behind frosted glass that brightens on
 *  hover, hinting there is something to uncover. */
function Mystery() {
    return (
        <div className="group relative aspect-square rounded-sm overflow-hidden
            bg-gradient-to-b from-slate-800/40 to-slate-950
            ring-1 ring-inset ring-white/5
            transition-all duration-300 hover:ring-brand/50 hover:from-slate-800/60">

            <div aria-hidden
                className="pointer-events-none absolute inset-0 opacity-50
                    transition-opacity duration-300 group-hover:opacity-90"
                style={{ background: "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.22), transparent 65%)" }} />

            <div className="absolute inset-0 flex items-center justify-center">
                <span aria-hidden
                    className="select-none text-3xl sm:text-4xl leading-none font-black text-slate-500/70 blur-[2px]
                        transition-all duration-300 group-hover:blur-[1px] group-hover:text-slate-300/80"
                    style={{ textShadow: "0 0 12px rgba(59,130,246,0.5)" }}>
                    ？
                </span>
            </div>

            <span className="absolute inset-x-0 bottom-2 text-center text-[9px] font-bold uppercase tracking-[0.25em] text-slate-600">
                locked
            </span>
        </div>
    );
}

function Known({ slot }: { slot: Slot }) {
    return (
        <div className="group relative aspect-square rounded-sm overflow-hidden
            bg-slate-950 ring-1 ring-inset ring-white/10
            flex flex-col items-center justify-center gap-0.5
            transition-all duration-200 hover:ring-brand hover:-translate-y-0.5">

            {/* Combos are two characters wide, so they run a step smaller. */}
            <span className={`leading-none ${slot.char.length > 1
                ? "text-xl sm:text-2xl"
                : "text-3xl sm:text-4xl"}`}>
                {slot.char}
            </span>
            <span className="max-w-full truncate px-1 text-xs sm:text-sm leading-none text-muted">
                {slot.romaji}
            </span>

            <div className="absolute inset-x-0 bottom-0 h-1 bg-slate-800/80">
                <div className="h-full bg-brand transition-all" style={{ width: `${slot.pct}%` }} />
            </div>
        </div>
    );
}
