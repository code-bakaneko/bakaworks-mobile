import { createClient } from "@/app/lib/supabase/server"
import { Tables } from "@/app/lib/database.types"

export default async function VocabularyPage() {

    const supabase = await createClient();

    const {data: vocabularyWords, error } = await supabase.from("language_vocabulary").select();

    if (error) return;

    return (
        <div>
            <section className="max-w-3xl mx-auto">
                <h2>あ - Word List</h2>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2 p-2">
                    {vocabularyWords?.map((word) => (
                        <div key={word.id}
                            className="
                                bg-gray-950 min-h-35 p-2 rounded-sm flex flex-col gap-2 items-center justify-center
                                border-2 border-slate-800
                                hover:border-white hover:cursor-pointer hover:translate-y-2 transition-all">
                            <span>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                <path d="M11 5 6 9H2v6h4l5 4V5z" />
                                <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
                                </svg>
                            </span>
                            <span className="text-center">{word.romanized}</span>
                            <span className="text-center text-brand">{word.foreign_word}</span>
                            <span className="text-center text-muted text-sm">{word.english_word}</span>
                            <div className="w-full h-2 bg-slate-800 rounded-xs overflow-hidden">
                                <div className="h-full bg-brand" style={{ width: `${50}%`}}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            <section className="max-w-3xl mx-auto">
                <h2>い - Word List</h2>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2 p-2">
                    {vocabularyWords?.map((word) => (
                        <div key={word.id}
                            className="
                                bg-gray-950 min-h-35 p-2 rounded-sm flex flex-col gap-2 items-center justify-center
                                border-2 border-slate-800
                                hover:border-white hover:cursor-pointer hover:translate-y-2 transition-all">
                            <span>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                <path d="M11 5 6 9H2v6h4l5 4V5z" />
                                <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
                                </svg>
                            </span>
                            <span className="text-center">{word.romanized}</span>
                            <span className="text-center text-brand">{word.foreign_word}</span>
                            <span className="text-center text-muted text-sm">{word.english_word}</span>
                            <div className="w-full h-2 bg-slate-800 rounded-xs overflow-hidden">
                                <div className="h-full bg-brand" style={{ width: `${50}%`}}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}