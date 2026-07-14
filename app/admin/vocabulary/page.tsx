import { revalidatePath } from "next/cache";
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
        revalidatePath("/admin/vocabulary")
    }

    async function deleteVocabularyWord(formData: FormData) {
        "use server"
        const id = Number(formData.get("id"));
        const { error } = await supabaseAdmin.from("language_vocabulary").delete().eq("id", id);

        if(error) console.log(error);
        revalidatePath("/admin/vocabulary")
    }

    const { data: vocabData } = await supabaseAdmin.from("language_vocabulary").select();

    return(
        <div
            className="flex flex-col gap-5 p-4">
            <div>
                <form action={addVocabularyWord}
                    className="flex flex-wrap gap-2">
                    <input name="english-word" placeholder="english word" required
                        className="bg-background text-white border border-brand rounded-sm p-2"/>
                    <input name="foreign-word" placeholder="foreign word" required
                        className="bg-background text-white border border-brand rounded-sm p-2"/>
                    <input name="reading" placeholder="reading"
                        className="bg-background text-white border border-brand rounded-sm p-2"/>
                    <input name="romanized" placeholder="romanization"
                        className="bg-background text-white border border-brand rounded-sm p-2"/>
                    <input name="explanation" placeholder="explanation"
                        className="bg-background text-white border border-brand rounded-sm p-2"/>
                    <button type="submit"
                        className="
                            h-11 text-white border-b-4 px-4 py-2 rounded-sm bg-brand border-brand-dark
                            hover:cursor-pointer hover:translate-y-2 hover:border-b-0
                            transition-all">
                        Add Word
                    </button>
                </form>
            </div>
            <div
                className="flex-1">
                <FlashCard
                    words={vocabData? vocabData : []}/>
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
                                <th>Action</th>
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
                                    <td>{vocab.explanation}</td>
                                    <td>
                                        <form action={deleteVocabularyWord}>
                                            <input type="hidden" name="id" value={vocab.id}/>
                                            <button 
                                                type="submit"
                                                className="px-2 py-1 bg-red-500 border-b-2 border-red-700">
                                                Delete
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}