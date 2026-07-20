'use client'

import { useState } from "react";
import Link from "next/link";

type Step = {
    id: number;
    type: string;
    content?: string;
    prompt?: string;
    choices?: string[];
};

export default function LessonPlayer({ steps }: { steps: Step[] }) {
    const [index, setIndex] = useState(0);
    const [selected, setSelected] = useState<string | null>(null);

    const step = steps[index];
    const progress = (index / steps.length) * 100;

    function next() {
        setSelected(null);
        setIndex((index) => index + 1);
    }

    if (index >= steps.length) {
        return (
            <div className="flex flex-col items-center justify-center gap-6 min-h-[60vh] text-center px-6">
                <span className="text-6xl">🌟</span>
                <h2 className="text-3xl font-extrabold">Lesson Complete</h2>
                <p className="text-muted">You finished all {steps.length} steps.</p>
                <Link href="/learn"
                    className="bg-brand px-8 h-12 flex items-center rounded-sm font-extrabold
                        border-b-4 border-brand-dark
                        hover:border-b-0 hover:translate-y-1 transition-all">
                    Back to the map
                </Link>
            </div>
        )
    }

    return (
        <div className="starfield lesson-enter flex flex-col min-h-screen">

            <header className="flex items-center gap-4 px-6 py-4 max-w-2xl w-full mx-auto">
                <Link href="/learn"
                    className="text-muted hover:text-white transition-colors text-2xl leading-none">
                    ✕
                </Link>
                <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-brand rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }} />
                </div>
                <span className="text-sm text-muted tabular-nums">
                    {index + 1}/{steps.length}
                </span>
            </header>

            <main className="flex-1 flex flex-col justify-center max-w-2xl w-full mx-auto px-6 py-10">

                {step.type === "lecture" && (
                    <div className="flex flex-col gap-4">
                        <span className="text-xs uppercase tracking-[0.2em] text-brand font-bold">
                            Lesson
                        </span>
                        <p className="text-2xl md:text-3xl leading-relaxed">{step.content}</p>
                    </div>
                )}

                {step.type === "question" && (
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col gap-3">
                            <span className="text-xs uppercase tracking-[0.2em] text-brand font-bold">
                                Question
                            </span>
                            <p className="text-2xl md:text-3xl font-bold">{step.prompt}</p>
                        </div>

                        <div className="grid gap-3">
                            {step.choices?.map((choice) => (
                                <button
                                    key={choice}
                                    onClick={() => setSelected(choice)}
                                    className={`px-5 h-14 rounded-sm text-left font-bold border-2
                                        transition-all hover:cursor-pointer
                                        ${selected === choice
                                            ? "border-brand bg-brand/15 text-white"
                                            : "border-white/15 hover:border-white/40 hover:bg-white/5"}`}>
                                    {choice}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

            </main>

            <footer className="border-t border-white/10 bg-slate-950/50">
                <div className="max-w-2xl w-full mx-auto px-6 py-5 flex justify-end">
                    <button
                        onClick={next}
                        disabled={step.type === "question" && selected === null}
                        className="bg-brand px-10 h-12 rounded-sm font-extrabold
                            border-b-4 border-brand-dark
                            hover:border-b-0 hover:translate-y-1 transition-all hover:cursor-pointer
                            disabled:opacity-40 disabled:pointer-events-none disabled:translate-y-0">
                        Continue
                    </button>
                </div>
            </footer>

        </div>
    )
}
