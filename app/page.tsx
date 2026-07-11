import FlashCard from "./components/flashcard";
import { createClient } from "./lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: vocabWords } = await supabase.from("language_vocabulary").select();
  return (
    <div>
      <FlashCard
        words={vocabWords? vocabWords : []}
      />
    </div>
  );
}
