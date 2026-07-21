'use client'

import { useState } from "react";
import Link from "next/link";
import { Tables } from "@/app/lib/database.types";
import AudioButton from "./AudioButton";

type LessonSet = Tables<"lesson_sets">;

// `content` is jsonb, so its shape follows `type`. Narrow it once here.
type SetContent = {
    text?: string;
    prompt?: string;
    choices?: string[];
    answer?: string;
    url?: string;
    // Audio is opt-in: the speaker button only renders when one of these is set.
    audio?: string;      // text spoken with the browser's Japanese voice
    audio_url?: string;  // a real audio file, takes priority when present
};

export default function LessonPlayer({
    lessonName,
    sets,
}: {
    lessonName: string;
    sets: LessonSet[];
}) {
    const [index, setIndex] = useState(0);
    const [selected, setSelected] = useState<string | null>(null);
    const [checked, setChecked] = useState(false);
    const [score, setScore] = useState(0);

    const set = sets[index];
    const content = (set?.content ?? {}) as SetContent;
    const progress = (index / sets.length) * 100;
    const isQuestion = set?.type === "multiple_choice";
    const isCorrect = checked && selected === content.answer;

    function advance() {
        if (isQuestion && !checked) {
            if (selected === content.answer) setScore((score) => score + 1);
            setChecked(true);
            return;
        }

        setSelected(null);
        setChecked(false);
        setIndex((index) => index + 1);
    }

    if (index >= sets.length) {
        const questionCount = sets.filter((s) => s.type === "multiple_choice").length;

        return (
            <div className="starfield lesson-enter min-h-screen
                flex flex-col items-center justify-center gap-6 text-center px-6">
                <span className="text-6xl">🌟</span>
                <h2 className="text-3xl font-extrabold">Lesson Complete</h2>
                {questionCount > 0 && (
                    <p className="text-muted">
                        You got <span className="text-brand font-bold">{score}</span> of {questionCount} right.
                    </p>
                )}
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
                    {index + 1}/{sets.length}
                </span>
            </header>

            <main className="flex-1 flex flex-col justify-center max-w-2xl w-full mx-auto px-6 py-10">

                {set.type === "lecture" && (
                    <div className="flex flex-col gap-4">
                        <span className="text-xs uppercase tracking-[0.2em] text-brand font-bold">
                            {lessonName}
                        </span>
                        <p className="text-xl md:text-2xl leading-relaxed">{content.text}</p>
                    </div>
                )}

                {isQuestion && (
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col gap-3">
                            <span className="text-xs uppercase tracking-[0.2em] text-brand font-bold">
                                Question
                            </span>
                            <div className="flex items-center gap-4">
                                <AudioButton text={content.audio} url={content.audio_url} />
                                <p className="text-3xl md:text-4xl font-bold">{content.prompt}</p>
                            </div>
                        </div>

                        <div className="grid gap-3">
                            {content.choices?.map((choice) => {
                                const isAnswer = choice === content.answer;
                                const isPicked = choice === selected;

                                let style = "border-white/15 hover:border-white/40 hover:bg-white/5";
                                if (checked && isAnswer) {
                                    style = "border-green-500 bg-green-500/15";
                                } else if (checked && isPicked) {
                                    style = "border-red-500 bg-red-500/15";
                                } else if (isPicked) {
                                    style = "border-brand bg-brand/15";
                                }

                                return (
                                    <button
                                        key={choice}
                                        onClick={() => !checked && setSelected(choice)}
                                        disabled={checked}
                                        className={`px-5 h-14 rounded-sm text-left font-bold border-2
                                            transition-all hover:cursor-pointer
                                            disabled:cursor-default ${style}`}>
                                        {choice}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {(set.type === "video" || set.type === "audio") && (
                    <p className="text-muted">
                        {set.type} steps are not supported yet — {content.url}
                    </p>
                )}

            </main>

            <footer className="border-t border-white/10 bg-slate-950/50">
                <div className="max-w-2xl w-full mx-auto px-6 py-5
                    flex items-center justify-between gap-4">

                    {checked ? (
                        <span className={`font-extrabold
                            ${isCorrect ? "text-green-400" : "text-red-400"}`}>
                            {isCorrect ? "Correct" : `Answer: ${content.answer}`}
                        </span>
                    ) : <span />}

                    <button
                        onClick={advance}
                        disabled={isQuestion && selected === null}
                        className="bg-brand px-10 h-12 rounded-sm font-extrabold
                            border-b-4 border-brand-dark
                            hover:border-b-0 hover:translate-y-1 transition-all hover:cursor-pointer
                            disabled:opacity-40 disabled:pointer-events-none disabled:translate-y-0">
                        {isQuestion && !checked ? "Check" : "Continue"}
                    </button>
                </div>
            </footer>

        </div>
    )
}
