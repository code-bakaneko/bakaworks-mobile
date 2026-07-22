'use client'

import { useRef, useState } from "react";
import AudioButton from "./AudioButton";

/** How far off the guide a finger may stray, in viewBox units. Generous on
 *  purpose — this teaches stroke ORDER and DIRECTION, not penmanship. */
const TOLERANCE = 14;

/** Fraction of the guide stroke that must be covered to accept it. */
const REQUIRED_COVERAGE = 0.8;

/** Points sampled along each guide stroke when checking a drawing. */
const SAMPLES = 40;

type Point = { x: number; y: number };

export default function KanaTracer({
    character,
    romaji,
    strokes,
    viewBox = "0 0 109 109",
    guides,
    audio,
    onComplete,
}: {
    character: string;
    romaji?: string;
    strokes: string[];
    viewBox?: string;
    /** Overrides what is spoken. Defaults to the character itself. */
    audio?: string;
    /** How many strokes still show their guide, counting from the first.
     *  Lower it across repetitions to strip the scaffolding away. Defaults to
     *  all of them. */
    guides?: number;
    onComplete?: () => void;
}) {
    const svgRef = useRef<SVGSVGElement>(null);
    const guideRef = useRef<SVGPathElement>(null);

    const [strokeIndex, setStrokeIndex] = useState(0);
    const [drawing, setDrawing] = useState<Point[]>([]);
    const [wrong, setWrong] = useState(false);

    const done = strokeIndex >= strokes.length;

    const guideCount = guides ?? strokes.length;
    const showGuide = strokeIndex < guideCount;
    const fromMemory = guideCount === 0;

    /** Pointer position in viewBox units, not screen pixels. */
    function toSvgPoint(event: React.PointerEvent): Point | null {
        const svg = svgRef.current;
        if (!svg) return null;

        const matrix = svg.getScreenCTM();
        if (!matrix) return null;

        const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
        return { x: point.x, y: point.y };
    }

    /**
     * Walks the guide stroke from start to finish and checks the drawing
     * visits it in order. A single pass over the samples means a stroke drawn
     * backwards fails even though it covers the same pixels.
     */
    function isStrokeCorrect(points: Point[]): boolean {
        const guide = guideRef.current;
        if (!guide || points.length < 2) return false;

        const length = guide.getTotalLength();
        let matched = 0;
        let cursor = 0;

        for (let i = 0; i <= SAMPLES; i++) {
            const target = guide.getPointAtLength((i / SAMPLES) * length);

            // Only look forward through the drawing, never back.
            for (let j = cursor; j < points.length; j++) {
                const dx = points[j].x - target.x;
                const dy = points[j].y - target.y;

                if (Math.hypot(dx, dy) <= TOLERANCE) {
                    matched++;
                    cursor = j;
                    break;
                }
            }
        }

        return matched / (SAMPLES + 1) >= REQUIRED_COVERAGE;
    }

    function start(event: React.PointerEvent) {
        if (done) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        setWrong(false);

        const point = toSvgPoint(event);
        setDrawing(point ? [point] : []);
    }

    function move(event: React.PointerEvent) {
        if (done || drawing.length === 0) return;

        const point = toSvgPoint(event);
        if (point) setDrawing((drawing) => [...drawing, point]);
    }

    function end() {
        if (done || drawing.length === 0) return;

        if (isStrokeCorrect(drawing)) {
            const next = strokeIndex + 1;
            setStrokeIndex(next);
            if (next >= strokes.length) onComplete?.();
        } else {
            setWrong(true);
        }

        setDrawing([]);
    }

    function reset() {
        setStrokeIndex(0);
        setDrawing([]);
        setWrong(false);
    }

    const drawnPath = drawing.length > 0
        ? "M" + drawing.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L")
        : "";

    return (
        <div className="flex flex-col items-center gap-4">

            {/* Hearing the sound while drawing binds the shape to the sound
                rather than to its romaji spelling. Plays on load, and stays
                tappable since autoplay can be blocked. */}
            <div className="flex items-center gap-4">
                <AudioButton text={audio ?? character} autoPlay />
            </div>

            {/* The romaji and the kana it spells, side by side — the reference
                for what you are drawing. */}
            <div className="flex items-baseline gap-3">
                {romaji && <span className="text-3xl font-bold text-brand">{romaji}</span>}
                <span className="text-4xl font-bold leading-none">{character}</span>
                {fromMemory && (
                    <span className="self-center text-xs uppercase tracking-[0.2em] text-brand font-bold">
                        From memory
                    </span>
                )}
            </div>

            <svg
                ref={svgRef}
                viewBox={viewBox}
                onPointerDown={start}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
                className={`w-72 h-72 rounded-lg bg-slate-950 touch-none select-none
                    border-2 transition-colors
                    ${wrong ? "border-red-500" : done ? "border-green-500" : "border-white/15"}`}>

                {/* Faint grid, the way practice paper is ruled. */}
                <line x1="54.5" y1="0" x2="54.5" y2="109" strokeWidth="0.5"
                    strokeDasharray="3 3" className="stroke-white/10" />
                <line x1="0" y1="54.5" x2="109" y2="54.5" strokeWidth="0.5"
                    strokeDasharray="3 3" className="stroke-white/10" />

                {/* Ghosted guides, only as many as this repetition allows. */}
                {strokes.slice(0, guideCount).map((d, i) => (
                    <path key={`ghost-${i}`} d={d} fill="none" strokeWidth="6"
                        strokeLinecap="round" strokeLinejoin="round"
                        className="stroke-white/10" />
                ))}

                {/* Strokes already drawn correctly. */}
                {strokes.slice(0, strokeIndex).map((d, i) => (
                    <path key={`done-${i}`} d={d} fill="none" strokeWidth="6"
                        strokeLinecap="round" strokeLinejoin="round"
                        className="stroke-brand" />
                ))}

                {/* The stroke being asked for, and the path every drawing is
                    measured against. It must stay in the DOM even when hidden —
                    getPointAtLength needs the geometry — so it is made
                    invisible with stroke-opacity rather than removed. */}
                {!done && (
                    <path ref={guideRef} d={strokes[strokeIndex]} fill="none" strokeWidth="6"
                        strokeLinecap="round" strokeLinejoin="round"
                        strokeOpacity={showGuide ? undefined : 0}
                        className="stroke-brand/40" />
                )}

                {/* Where to begin this stroke — hidden along with its guide. */}
                {!done && showGuide && guideRef.current && (
                    <circle
                        r="4"
                        cx={guideRef.current.getPointAtLength(0).x}
                        cy={guideRef.current.getPointAtLength(0).y}
                        className="fill-brand animate-pulse" />
                )}

                {/* The finger's trail. */}
                {drawnPath && (
                    <path d={drawnPath} fill="none" strokeWidth="6"
                        strokeLinecap="round" strokeLinejoin="round"
                        className="stroke-white/70" />
                )}
            </svg>

            <div className="h-6 flex items-center">
                {wrong && (
                    <span className="text-red-400 text-sm font-bold">
                        {showGuide
                            ? "Follow the highlighted stroke from the dot."
                            : "Not quite — mind the stroke order."}
                    </span>
                )}
                {done && (
                    <span className="text-green-400 text-sm font-bold">
                        {character} — correct.
                    </span>
                )}
            </div>

            <button
                type="button"
                onClick={reset}
                className="text-sm text-muted hover:text-white transition-colors hover:cursor-pointer">
                Start over
            </button>

        </div>
    )
}
