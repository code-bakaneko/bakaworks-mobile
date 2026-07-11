import Link from "next/link";
import FlashCard from "./components/flashcard";
import { createClient } from "./lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: vocabWords } = await supabase.from("language_vocabulary").select();
  return (
    <div
      className="flex flex-col gap-10 h-screen items-center">
        <header className="w-full bg-slate-950 h-10 flex items-center justify-center">
          BakaWorks BETA - Public Access
        </header>
        <main className="flex-1 flex gap-10 px-20 w-full">
          <aside className="flex flex-col items-start justify-start">
            <p>Upcoming Updates:</p>
            <ol className="list-decimal">
              <li>Add correct and incorrect flash card tracking</li>
              <li>Expand Flash Card Vocabulary Listing</li>
              <li>Multiple choice questions</li>
              <li>Flash Card Sets</li>
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
