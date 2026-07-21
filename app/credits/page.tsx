import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Credits — BakaWorks",
    description: "The work this app is built on, and the people it belongs to.",
};

/**
 * Attribution for everything in the app that someone else made.
 *
 * This page is not decoration. Both entries below are REQUIRED by the terms
 * the material is licensed under, and both licences are satisfied only while
 * this credit is publicly visible. Removing an entry means losing the right
 * to ship what it covers.
 *
 * Reachable without logging in on purpose: a credit nobody can see is not a
 * credit. `proxy.ts` gates /learn, /lesson and friends — /credits is
 * deliberately absent from that list.
 */

type Credit = {
    what: string;
    title: string;
    holder: string;
    licence: string;
    href: string;
    /** Exactly what the terms oblige, in plain words. */
    obligation: string;
};

const CREDITS: Credit[] = [
    {
        what: "Stroke order data",
        title: "KanjiVG",
        holder: "Copyright © Ulrich Apel",
        licence: "CC BY-SA 3.0",
        href: "http://kanjivg.tagaini.net",
        obligation:
            "Every character you trace follows stroke paths from KanjiVG. The licence " +
            "requires visible attribution, and requires that anything derived from the " +
            "data is shared under the same terms.",
    },
    {
        what: "Voice — the characters",
        title: "VOICEVOX:東北イタコ",
        holder: "東北イタコ",
        licence: "Free for commercial and non-commercial use, with credit",
        href: "https://voicevox.hiroshiba.jp/",
        obligation:
            "Every single character you hear — every kana, in every drill and every " +
            "trace — is spoken by 東北イタコ through VOICEVOX. Her credit is not " +
            "optional: commercial use without it requires a paid licence.",
    },
    {
        what: "Voice — the words",
        title: "VOICEVOX:冥鳴ひまり",
        holder: "冥鳴ひまり",
        licence: "Free for commercial and non-commercial use, with credit",
        href: "https://voicevox.hiroshiba.jp/",
        obligation:
            "The words — ああ, いい, あい — and the Japanese read aloud inside lectures " +
            "are spoken by 冥鳴ひまり. A character alone is a specimen and a word is " +
            "speech; they are read differently, and no one voice was best at both. " +
            "Her terms permit commercial use freely, asking only that this is shown.",
    },
];

export default function CreditsPage() {
    return (
        <div className="starfield min-h-screen px-6 py-16">
            <div className="max-w-2xl mx-auto flex flex-col gap-12">

                <header className="flex flex-col gap-3">
                    <Link href="/"
                        className="text-muted hover:text-white transition-colors text-sm w-fit">
                        ← Back
                    </Link>
                    <span className="text-xs uppercase tracking-[0.2em] text-brand font-bold">
                        Attribution
                    </span>
                    <h1 className="text-4xl font-extrabold tracking-tight">Credits</h1>
                    <p className="text-muted leading-relaxed">
                        BakaWorks is built on work that other people made and chose to share.
                        This page names them, because that is the condition on which they
                        shared it.
                    </p>
                </header>

                <div className="flex flex-col gap-6">
                    {CREDITS.map((credit) => (
                        <section key={credit.title}
                            className="bg-slate-950/60 border border-white/10 rounded-lg p-6
                                flex flex-col gap-3">

                            <span className="text-[10px] uppercase tracking-[0.2em] text-muted font-bold">
                                {credit.what}
                            </span>

                            <a href={credit.href}
                                target="_blank"
                                rel="noreferrer"
                                className="text-2xl font-extrabold text-brand
                                    hover:underline underline-offset-4 w-fit">
                                {credit.title}
                            </a>

                            <p className="text-sm text-muted">{credit.holder}</p>

                            <p className="leading-relaxed">{credit.obligation}</p>

                            <span className="text-xs text-muted border border-white/15
                                rounded-full px-3 py-1 w-fit">
                                {credit.licence}
                            </span>
                        </section>
                    ))}
                </div>

                <footer className="border-t border-white/10 pt-6 flex flex-col gap-2">
                    <p className="text-sm text-muted leading-relaxed">
                        Japanese speech by{" "}
                        <a href="https://voicevox.hiroshiba.jp/"
                            target="_blank" rel="noreferrer"
                            className="text-brand hover:underline underline-offset-4">
                            VOICEVOX
                        </a>
                        {" — VOICEVOX:東北イタコ and VOICEVOX:冥鳴ひまり. "}
                        Stroke data from{" "}
                        <a href="http://kanjivg.tagaini.net"
                            target="_blank" rel="noreferrer"
                            className="text-brand hover:underline underline-offset-4">
                            KanjiVG
                        </a>
                        , licensed CC BY-SA 3.0.
                    </p>
                    <p className="text-white/30 text-sm">BakaWorks — Beta</p>
                </footer>

            </div>
        </div>
    );
}
