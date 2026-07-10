import FlashCard from "../../components/flashcard"
import { supabaseAdmin } from "@/app/lib/supabase/admin"

export default async function AdminFlashCardPage() {


    async function addVocabularyWord(formData: FormData) {
        "use server"
        const english_word = formData.get("english-word") as string;
        const foreign_word = formData.get("foreign-word") as string;
        const reading = formData.get("reading") as string;
        const romanized = formData.get("romanized") as string;
        const explanation = formData.get("explanation") as string;
        const { error } = await supabaseAdmin.from("language_vocabulary").insert({english_word, foreign_word, reading, romanized, explanation});
        if (error) console.log(error);

    }

    const { data: vocabData, error } = await supabaseAdmin.from("language_vocabulary").select();

    return(
        <div>
            <form action={addVocabularyWord}>
                <input name="english-word" placeholder="english word" required/>
                <input name="foreign-word" placeholder="foreign word" required/>
                <input name="reading" placeholder="reading" />
                <input name="romanized" placeholder="romanization" />
                <input name="explanation" placeholder="explanation"/>
                <button type="submit">Add Word</button>
            </form>
            <FlashCard/>
            <div>
                <button>Incorrect</button>
                <button>Correct</button>
            </div>
            <div>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>English</th>
                            <th>Foreign</th>
                            <th>Reading</th>
                            <th>Romanized</th>
                            <th>Explanation</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vocabData?.map((vocab) => (
                            <tr key={vocab.id}>
                                <td>{vocab.id}</td>
                                <td>{vocab.english_word}</td>
                                <td>{vocab.foreign_word}</td>
                                <td>{vocab.reading}</td>
                                <td>{vocab.romanized}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}