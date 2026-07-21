'use client'

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tables } from "@/app/lib/database.types";
import AudioButton from "./AudioButton";
import KanaTracer from "./KanaTracer";
import SpeakableText from "./SpeakableText";
import { completeSet } from "@/app/lib/actions";

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
    // trace sets
    character?: string;
    romaji?: string;
    strokes?: string[];
    viewBox?: string;
    guides?: number;
};

export default function LessonPlayer(props: {
    lessonId: number;
    lessonName: string;
    setNumber: number;
    setPosition: number;
    setTotal: number;
    isReplay: boolean;
    sets: LessonSet[];
}) {
    // Freeze what this session is playing. Completing a set fires a server
    // action, and a server action refreshes the current route — which hands
    // this component the NEXT set's props while `index` is still at the end
    // of the old one. That instantly looked "finished" and auto-completed
    // every remaining set. Capturing on mount makes later props inert.
    const [session] = useState(() => props);
    const { lessonId, lessonName, setNumber, setPosition, setTotal, isReplay, sets } = session;

    const [index, setIndex] = useState(0);
    const [selected, setSelected] = useState<string | null>(null);
    const [checked, setChecked] = useState(false);
    const [score, setScore] = useState(0);
    const [traced, setTraced] = useState(false);

    const set = sets[index];
    const content = (set?.content ?? {}) as SetContent;
    const progress = (index / sets.length) * 100;
    // Both are graded the same way; only the prompt differs — text for one,
    // a played sound for the other.
    const isQuestion = set?.type === "multiple_choice" || set?.type === "listen";
    const isListen = set?.type === "listen";
    const isTrace = set?.type === "trace";
    const isCorrect = checked && selected === content.answer;
    const finished = index >= sets.length;
    // Replaying an already-finished set never "completes the lesson".
    const lastSet = setPosition === setTotal && !isReplay;

    const [reward, setReward] = useState<{ earned: number; balance: number | null } | null>(null);

    // Record this set once the player reaches the end. The lesson only counts
    // as complete — and the next star only unlocks — when every set is done.
    useEffect(() => {
        if (!finished) return;

        let cancelled = false;
        completeSet(lessonId, setNumber).then((result) => {
            if (!cancelled && result) setReward(result);
        });

        return () => { cancelled = true };
    }, [finished, lessonId, setNumber]);

    function advance() {
        if (isQuestion && !checked) {
            if (selected === content.answer) setScore((score) => score + 1);
            setChecked(true);
            return;
        }

        setSelected(null);
        setChecked(false);
        setTraced(false);
        setIndex((index) => index + 1);
    }

    if (index >= sets.length) {
        const questionCount = sets.filter((s) => s.type === "multiple_choice").length;

        return (
            <div className="starfield lesson-enter min-h-screen
                flex flex-col items-center justify-center gap-6 text-center px-6">
                <span className="text-6xl">{lastSet ? "🌟" : "✨"}</span>
                <h2 className="text-3xl font-extrabold">
                    {lastSet ? "Lesson Complete" : `Set ${setPosition} Complete`}
                </h2>
                <p className="text-muted">
                    {lastSet
                        ? `${lessonName} — all ${setTotal} sets finished.`
                        : `${setTotal - setPosition} more ${setTotal - setPosition === 1 ? "set" : "sets"} in ${lessonName}. Come back in to keep going.`}
                </p>
                {questionCount > 0 && (
                    <p className="text-muted">
                        You got <span className="text-brand font-bold">{score}</span> of {questionCount} right.
                    </p>
                )}

                {/* Reserve the height so the layout does not jump when the
                    award lands a moment after the screen renders. */}
                <div className="h-24 flex flex-col items-center justify-center gap-1">
                    {reward && (
                        <>
                            <div className="lesson-enter flex items-center gap-3
                                bg-brand/10 border-2 border-brand rounded-lg px-6 py-3">
                                <span className="text-3xl leading-none">🪙</span>
                                <span className="text-2xl font-extrabold text-brand tabular-nums">
                                    +{reward.earned}
                                </span>
                            </div>
                            {reward.balance !== null && (
                                <span className="text-sm text-muted tabular-nums">
                                    {reward.balance} gold total
                                </span>
                            )}
                        </>
                    )}
                </div>
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
            </header>

            <main className="flex-1 flex flex-col justify-center max-w-2xl w-full mx-auto px-6 py-10">

                {set.type === "lecture" && (
                    <div className="flex flex-col gap-4">
                        <span className="text-xs uppercase tracking-[0.2em] text-brand font-bold">
                            {lessonName}
                        </span>
                        <p className="text-xl md:text-2xl leading-relaxed">
                            <SpeakableText text={content.text ?? ""} />
                        </p>
                        <span className="text-sm text-muted">
                            Tap any Japanese to hear it.
                        </span>
                    </div>
                )}

                {isQuestion && (
                    <div className="flex flex-col gap-8">

                        {isListen ? (
                            /* The sound IS the question. No text prompt, so the
                               character binds to the sound rather than to an
                               English spelling of it. */
                            <div className="flex flex-col items-center gap-4">
                                <AudioButton
                                    key={set.id}
                                    text={content.audio}
                                    url={content.audio_url}
                                    size="lg"
                                    autoPlay />
                                <span className="text-sm text-muted">Tap to hear it again</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <span className="text-xs uppercase tracking-[0.2em] text-brand font-bold">
                                    Question
                                </span>
                                <div className="flex items-center gap-4">
                                    <AudioButton text={content.audio} url={content.audio_url} />
                                    <p className="text-3xl md:text-4xl font-bold">{content.prompt}</p>
                                </div>
                            </div>
                        )}

                        <div className={isListen ? "grid grid-cols-2 gap-3" : "grid gap-3"}>
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
                                        className={`rounded-sm font-bold border-2
                                            transition-all hover:cursor-pointer
                                            disabled:cursor-default ${style}
                                            ${isListen
                                                ? "h-28 text-5xl flex items-center justify-center"
                                                : "px-5 h-14 text-left"}`}>
                                        {choice}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {set.type === "trace" && content.strokes && (
                    <div className="flex flex-col gap-6 items-center">
                        <div className="flex flex-col gap-2 text-center">
                            <span className="text-xs uppercase tracking-[0.2em] text-brand font-bold">
                                Trace it
                            </span>
                            <p className="text-lg text-muted">
                                Draw each stroke in order, following the highlighted guide.
                            </p>
                        </div>
                        <KanaTracer
                            key={set.id}
                            character={content.character ?? ""}
                            romaji={content.romaji}
                            strokes={content.strokes}
                            viewBox={content.viewBox}
                            guides={content.guides}
                            audio={content.audio}
                            onComplete={() => setTraced(true)} />
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
                        disabled={(isQuestion && selected === null) || (isTrace && !traced)}
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
