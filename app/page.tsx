import FlashCard from "./components/flashcard";
import { createClient } from "./lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: vocabWords } = await supabase.from("language_vocabulary").select();
  return (
    <div
      className="flex flex-col items-center p-4">
        <header
          className="h-20">

        </header>
      <FlashCard
        words={vocabWords? vocabWords : []}
      />
    </div>
  );
}
