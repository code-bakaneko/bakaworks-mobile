import Link from "next/link";
import FlashCard from "./components/flashcard";
import { createClient } from "./lib/supabase/server";
import MultipleChoice from "./components/multiplechoice";

export default async function Home() {
  const supabase = await createClient();
  const { data: vocabWords } = await supabase.from("language_vocabulary").select();
  return (
    <div
      className="flex flex-col gap-10 h-screen items-center">
        <header className="w-full bg-slate-950 h-20 flex items-center justify-between px-10">
          <span>BakaWorks BETA - Public Access</span>
          <button className="
          bg-brand h-10 px-4 py-2 rounded-sm font-extrabold border-b-4 border-brand-dark
          hover:border-b-0 hover:translate-y-1 transition-all hover:cursor-pointer">
            Log In
          </button>
        </header>
        <main className="flex-1 flex flex-col gap-10 px-20 w-full">
          <section className="w-full flex flex-col items-center gap-6 py-24">
            <h1 className="text-5xl font-extrabold">Japanese Without the Boring Parts</h1>
            <p className="text-lg text-white/70 max-w-xl">
              Flashcards, quizzes, and real vocabulary - built to make you actually stick with it.
            </p>
            <span className="text-white/50 text-sm animate-bounce mt-4">↓ Scroll down to try it ↓</span>
          </section>
          <span>Scroll Down To Access Test Features</span>
          <section className="flex">
            <aside className="flex flex-col items-start justify-start">
              <p>Upcoming Updates:</p>
              <ol className="list-decimal">
                <li>Flash Card Sets</li>
                <li>Create Basic Home Page</li>
              </ol>
            </aside>
            <div className="flex-1 flex flex-col items-center">
              <div className="p-2">
                <p>Instructions:</p>
                <ol className="list-decimal">
                  <li>Guess/remember the translation</li>
                  <li>Click the card to flip</li>
                  <li>Answer correct if you got the translation correct</li>
                </ol>
              </div>
              <FlashCard
                words={vocabWords? vocabWords : []}
              />
            </div> 
          </section>
          <section className="flex flex-col items-center justify-center py-24">
            <MultipleChoice
              words={vocabWords? vocabWords : []}
            />
          </section>
          <section className="w-full flex flex-col items-center gap-6 py-24">
            <h2 className="text-3xl font-extrabold">Create Your Account</h2>
            <form className="flex flex-col gap-3 w-full max-w-sm">
              <input name="email" type="email" placeholder="e-mail" required
                className="bg-background border border-brand rounded-sm p-2"/>
              <input name="password" type="password" placeholder="password" required
                className="bg-background border border-brand rounded-sm p-2" />
              <button type="submit"
                className="bg-brand h-10 rounded-sm font-extrabold border-b-4 border-brand-dark
                hover:border-b-0 hover:translate-y-1 transition-all hover:cursor-pointer">
                Sign Up
              </button>
            </form>
          </section>
        </main>
        <footer className="h-20 flex gap-10 w-full items-center justify-center border-t-4 border-white/10">
            <a href="https://www.youtube.com/@BakaWorks">
              <img src="https://pdczkqzshxsqkrnbmsmw.supabase.co/storage/v1/object/public/bakaworks/video.png" className="h-14"/>
            </a>
            <a href="https://x.com/bakaworkz" className="hover:bg-white">
              <img src="https://pdczkqzshxsqkrnbmsmw.supabase.co/storage/v1/object/public/bakaworks/twitter.png" className="h-14"/>
            </a>
        </footer>
    </div>
  );
}
