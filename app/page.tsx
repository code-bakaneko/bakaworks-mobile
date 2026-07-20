import Link from "next/link";
import FlashCard from "./components/Flashcard";
import { createClient } from "./lib/supabase/server";
import MultipleChoice from "./components/MultipleChoice";

export default async function Home() {
  const supabase = await createClient();
  const { data: vocabWords } = await supabase.from("language_vocabulary").select();
  const words = vocabWords ?? [];

  return (
    <div className="flex flex-col min-h-screen">

      <header className="sticky top-0 z-50 w-full h-20 flex items-center justify-between px-6 md:px-10
        bg-slate-950/80 backdrop-blur border-b border-white/10">
        <Link href="/" className="flex items-center gap-3">
          <span className="text-xl font-extrabold tracking-tight">BakaWorks</span>
          <span className="text-[10px] uppercase tracking-widest text-brand border border-brand/40
            rounded-full px-2 py-0.5">
            Beta
          </span>
        </Link>
        <Link href="/learn" className="
          bg-brand h-10 px-5 flex items-center rounded-sm font-extrabold border-b-4 border-brand-dark
          hover:border-b-0 hover:translate-y-1 transition-all">
          Log In
        </Link>
      </header>

      <main className="flex-1 w-full">

        <section className="flex flex-col items-center text-center gap-6 px-6 py-32 md:py-40">
          <span className="text-xs uppercase tracking-[0.2em] text-brand font-bold">
            Learn Japanese
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.05]">
            Japanese Without<br />the Boring Parts
          </h1>
          <p className="text-lg md:text-xl text-muted max-w-xl leading-relaxed">
            Flashcards, quizzes, and real vocabulary — built to make you actually stick with it.
          </p>
          <span className="text-white/40 text-sm animate-bounce mt-8">
            ↓ Scroll down to try it ↓
          </span>
        </section>

        <section className="border-t border-white/10 px-6 py-24">
          <div className="max-w-5xl mx-auto flex flex-col items-center gap-12">
            <div className="text-center flex flex-col gap-3">
              <h2 className="text-3xl md:text-4xl font-extrabold">Flashcards</h2>
              <p className="text-muted max-w-lg">
                Guess the translation, flip the card, mark yourself honestly. The deck grows as you go.
              </p>
            </div>
            <FlashCard words={words} />
          </div>
        </section>

        <section className="border-t border-white/10 px-6 py-24">
          <div className="max-w-5xl mx-auto flex flex-col items-center gap-12">
            <div className="text-center flex flex-col gap-3">
              <h2 className="text-3xl md:text-4xl font-extrabold">Multiple Choice</h2>
              <p className="text-muted max-w-lg">
                Four options, one right answer. Fast reps to lock the vocabulary in.
              </p>
            </div>
            <MultipleChoice words={words} />
          </div>
        </section>

        <section className="border-t border-white/10 px-6 py-28">
          <div className="max-w-md mx-auto flex flex-col items-center gap-8">
            <div className="text-center flex flex-col gap-3">
              <h2 className="text-3xl md:text-4xl font-extrabold">Create Your Account</h2>
              <p className="text-muted">
                Free while we&apos;re in beta. Keep your progress across devices.
              </p>
            </div>
            <form className="flex flex-col gap-3 w-full">
              <input name="email" type="email" placeholder="e-mail" required
                className="bg-slate-950 border border-white/15 rounded-sm px-4 h-12
                  placeholder:text-white/30
                  focus:outline-none focus:border-brand transition-colors" />
              <input name="password" type="password" placeholder="password" required
                className="bg-slate-950 border border-white/15 rounded-sm px-4 h-12
                  placeholder:text-white/30
                  focus:outline-none focus:border-brand transition-colors" />
              <button type="submit"
                className="bg-brand h-12 mt-2 rounded-sm font-extrabold border-b-4 border-brand-dark
                  hover:border-b-0 hover:translate-y-1 transition-all">
                Sign Up
              </button>
            </form>
          </div>
        </section>

      </main>

      <footer className="border-t border-white/10 px-6 py-10">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-6">
          <div className="flex gap-8">
            <a href="https://www.youtube.com/@BakaWorks"
              className="opacity-60 hover:opacity-100 transition-opacity">
              <img
                src="https://pdczkqzshxsqkrnbmsmw.supabase.co/storage/v1/object/public/bakaworks/video.png"
                alt="YouTube" className="h-10" />
            </a>
            <a href="https://x.com/bakaworkz"
              className="opacity-60 hover:opacity-100 transition-opacity">
              <img
                src="https://pdczkqzshxsqkrnbmsmw.supabase.co/storage/v1/object/public/bakaworks/twitter.png"
                alt="X" className="h-10" />
            </a>
          </div>
          <p className="text-white/30 text-sm">BakaWorks — Beta</p>
        </div>
      </footer>

    </div>
  );
}
