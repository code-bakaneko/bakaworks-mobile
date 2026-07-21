'use client'

import { useState } from "react";
import Link from "next/link";

export type MapLesson = {
    id: number;
    name: string;
    x: number;
    y: number;
    done: number;
    total: number;
    locked: boolean;
    /** A lecture set has been finished, so there is something to re-read. */
    hasGuide: boolean;
};

const STAR_PATH =
    "M0,-10 L2.35,-3.24 L9.51,-3.09 L3.8,1.24 L5.88,8.09 L0,4 L-5.88,8.09 L-3.8,1.24 L-9.51,-3.09 L-2.35,-3.24 Z";

/** viewBox is 100x200 rendered at 320x640, so one unit is 3.2 screen px. */
const SCALE = 3.2;

/** Seeded pseudo-random in [0,1). Deterministic so server and client agree. */
function noise(seed: number): number {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
}

const SPARKS = Array.from({ length: 16 }, (_, i) => {
    const angle = Math.PI + ((i + noise(i) * 0.9) / 15) * Math.PI;
    const distance = 1.6 + noise(i + 40) * 1.6;

    return {
        dx: +(Math.cos(angle) * distance).toFixed(2),
        dy: +(Math.sin(angle) * distance).toFixed(2),
        r: +(0.13 + noise(i + 80) * 0.16).toFixed(3),
        delay: +(noise(i + 120) * 0.42).toFixed(2),
        duration: +(0.42 + noise(i + 160) * 0.3).toFixed(2),
    };
});

const STREAKS = Array.from({ length: 7 }, (_, i) => {
    const angle = Math.PI + ((i + noise(i + 200) * 0.9) / 6) * Math.PI;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const inner = 0.5 + noise(i + 240) * 0.5;
    const length = 0.8 + noise(i + 280) * 1.0;
    const travel = 1.7 + noise(i + 320) * 1.5;

    return {
        x1: +(cos * inner).toFixed(2), y1: +(sin * inner).toFixed(2),
        x2: +(cos * (inner + length)).toFixed(2), y2: +(sin * (inner + length)).toFixed(2),
        dx: +(cos * travel).toFixed(2), dy: +(sin * travel).toFixed(2),
        width: +(0.09 + noise(i + 360) * 0.07).toFixed(3),
        delay: +(noise(i + 400) * 0.4).toFixed(2),
        duration: +(0.45 + noise(i + 440) * 0.28).toFixed(2),
    };
});

export default function StarMap({ lessons }: { lessons: MapLesson[] }) {
    const [openId, setOpenId] = useState<number | null>(null);
    const open = lessons.find((l) => l.id === openId) ?? null;

    return (
        <div className="relative w-[320px] h-[640px]">
            <svg viewBox="0 0 100 200" className="w-full h-full overflow-visible">

                {/* Each segment doubles as the progress bar for the lesson it
                    leaves, and takes its colour from the two stars it joins. */}
                {lessons.slice(1).map((lesson, i) => {
                    const prev = lessons[i];
                    const fromDone = prev.done >= prev.total;

                    const fromFraction = prev.total > 0 ? prev.done / prev.total : 0;
                    const toFraction = lesson.total > 0 ? lesson.done / lesson.total : 0;
                    const fromColor = `color-mix(in srgb, var(--brand) ${fromFraction * 100}%, #ffffff)`;
                    const toColor = `color-mix(in srgb, var(--brand) ${toFraction * 100}%, #ffffff)`;

                    const length = Math.hypot(lesson.x - prev.x, lesson.y - prev.y);
                    const gradientId = `path-${prev.id}-${lesson.id}`;

                    // One chunk per set, so the path shows how many sets the
                    // lesson has and how many are done.
                    const GAP = 2.5;
                    const chunks = Math.max(prev.total, 1);
                    const chunkLength = (length - GAP * (chunks - 1)) / chunks;

                    const segments = Array.from({ length: chunks }, (_, k) => {
                        const startAt = k * (chunkLength + GAP);
                        const t0 = startAt / length;
                        const t1 = (startAt + chunkLength) / length;
                        return {
                            lit: k < prev.done,
                            x1: prev.x + (lesson.x - prev.x) * t0,
                            y1: prev.y + (lesson.y - prev.y) * t0,
                            x2: prev.x + (lesson.x - prev.x) * t1,
                            y2: prev.y + (lesson.y - prev.y) * t1,
                        };
                    });

                    return (
                        <g key={lesson.id}>
                            {/* userSpaceOnUse spans the whole line, so each chunk
                                picks up the colour at its own position along it. */}
                            <defs>
                                <linearGradient id={gradientId} gradientUnits="userSpaceOnUse"
                                    x1={prev.x} y1={prev.y} x2={lesson.x} y2={lesson.y}>
                                    <stop offset="0%" stopColor={fromColor} />
                                    <stop offset="100%" stopColor={toColor} />
                                </linearGradient>
                            </defs>

                            {fromDone ? (
                                <line
                                    x1={prev.x} y1={prev.y} x2={lesson.x} y2={lesson.y}
                                    strokeWidth="1.6" strokeLinecap="round"
                                    stroke={`url(#${gradientId})`} />
                            ) : (
                                segments.map((seg, k) => (
                                    <line key={k}
                                        x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
                                        strokeLinecap="round"
                                        strokeWidth={seg.lit ? 1.6 : 1.2}
                                        stroke={seg.lit ? `url(#${gradientId})` : "#ffffff"}
                                        strokeOpacity={seg.lit ? 1 : 0.2} />
                                ))
                            )}

                            {/* Sparkler at the leading edge of progress. */}
                            {!fromDone && prev.done > 0 && (
                                <g transform={`translate(${segments[prev.done - 1].x2}, ${segments[prev.done - 1].y2})`}>
                                    {SPARKS.map((spark, k) => (
                                        <circle key={k} r={spark.r}
                                            className={`spark-particle ${k % 3 === 0 ? "fill-brand" : "fill-white"}`}
                                            style={{
                                                "--dx": `${spark.dx}px`, "--dy": `${spark.dy}px`,
                                                animationDelay: `${spark.delay}s`,
                                                animationDuration: `${spark.duration}s`,
                                            } as React.CSSProperties} />
                                    ))}
                                    {STREAKS.map((streak, k) => (
                                        <line key={`s${k}`}
                                            x1={streak.x1} y1={streak.y1} x2={streak.x2} y2={streak.y2}
                                            strokeWidth={streak.width} strokeLinecap="round"
                                            stroke={k % 3 === 0 ? "var(--brand)" : "#ffffff"}
                                            className="spark-particle"
                                            style={{
                                                "--dx": `${streak.dx}px`, "--dy": `${streak.dy}px`,
                                                animationDelay: `${streak.delay}s`,
                                                animationDuration: `${streak.duration}s`,
                                            } as React.CSSProperties} />
                                    ))}
                                    <circle r="0.7" className="spark-core fill-white" />
                                </g>
                            )}
                        </g>
                    );
                })}

                {lessons.map((lesson, lessonIndex) => {
                    const finished = lesson.done >= lesson.total;
                    const active = openId === lesson.id;

                    const glow = lesson.locked
                        ? ""
                        : finished ? "star-glow" : "star-glow is-white";
                    const fill = lesson.locked
                        ? "fill-slate-600"
                        : finished ? "fill-brand" : "fill-white";

                    return (
                        <g key={lesson.id}
                            onClick={() => setOpenId(active ? null : lesson.id)}
                            className={lesson.locked ? "cursor-not-allowed" : "cursor-pointer"}>
                            {/* Invisible disc so the tap target is bigger than
                                the star's thin points. */}
                            <circle cx={lesson.x} cy={lesson.y} r="9" fill="transparent" />
                            <g
                                transform={`translate(${lesson.x}, ${lesson.y}) scale(${active ? 0.75 : 0.6})`}
                                className={glow}
                                style={lesson.locked ? undefined : { animationDelay: `${(lessonIndex % 5) * 0.8}s` }}>
                                {/* One child only. <title> is a raw text element, so
                                    React's separator comment would break hydration. */}
                                <title>{lesson.locked ? `${lesson.name} (locked)` : lesson.name}</title>
                                <path d={STAR_PATH} className={fill} />
                            </g>
                        </g>
                    );
                })}
            </svg>

            {/* Popup, positioned over the star in screen pixels. */}
            {open && (
                <>
                    {/* Tapping anywhere else closes it. */}
                    <button
                        aria-label="Close"
                        onClick={() => setOpenId(null)}
                        className="fixed inset-0 z-10 cursor-default" />

                    <div
                        style={{
                            left: open.x * SCALE,
                            top: open.y * SCALE - 24,
                        }}
                        className="absolute z-20 -translate-x-1/2 -translate-y-full
                            w-56 p-4 rounded-lg
                            bg-slate-950 border-2 border-brand/50 shadow-xl
                            flex flex-col gap-3 text-center">

                        <span className="text-3xl font-bold leading-none">{open.name}</span>

                        {open.locked ? (
                            <span className="text-sm text-muted">
                                Finish the lesson before this one first.
                            </span>
                        ) : (
                            <>
                                {/* Only once a lecture has actually been played.
                                    Nothing to review before then. */}
                                {open.hasGuide && (
                                    <Link
                                        href={`/lesson/${open.id}/guide`}
                                        className="h-11 rounded-sm font-extrabold
                                            flex items-center justify-center gap-2
                                            border-2 border-brand text-brand
                                            hover:bg-brand/15 transition-colors">
                                        📖 Guide
                                    </Link>
                                )}

                                <Link
                                    href={`/lesson/${open.id}`}
                                    className="bg-brand h-11 rounded-sm font-extrabold
                                        flex items-center justify-center
                                        border-b-4 border-brand-dark
                                        hover:border-b-0 hover:translate-y-1 transition-all">
                                    Start lesson
                                </Link>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
