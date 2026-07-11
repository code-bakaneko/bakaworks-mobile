import FlashCard from "./components/flashcard";
import { createClient } from "./lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: vocabWords } = await supabase.from("language_vocabulary").select();
  return (
    <div
      className="mx-auto flex px-4 gap-10 mt-10">
        <aside className="">
          <p>Upcoming Updates:</p>
          <ol>
            <li></li>
          </ol>
        </aside>
        <main className="flex-1 flex flex-col items-center justify-center">
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
          <footer>
            {/*Advertisement */}
          </footer>
        </main>
    </div>
  );
}
