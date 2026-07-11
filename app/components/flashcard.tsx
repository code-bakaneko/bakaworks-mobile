"use client"
import { useState } from "react";
import { Tables } from "@/app/lib/database.types"

type Vocab = Tables<"language_vocabulary">;

export default function FlashCard({ words }: { words: Vocab[] }) {
    if (words.length === 0) {
        return <div>No Words Yet</div>
    }
    const [flipped, setFlipped] = useState(false);
    const [index, setIndex] = useState(0);
    const [limit, setLimit] = useState(2);

    function next() {
        setFlipped(false);
        if(index === limit) {
            setIndex(0);
            setLimit(limit => limit + 2);
        } else {
            setIndex(index => index + 1);
        }
    }

    return(
            <div>
                <div className="scene w-48 h-64">
                    <div className={`${flipped? "flip":""} card-inner w-full h-full bg-slate-500`}
                        onClick={() => setFlipped(flip => !flip)}>
                        <div
                            className="
                            flex flex-col
                            front-face inset-0">
                            <span>{words[index].romanized}</span>
                            <span>{words[index].reading}</span>
                            <span>{words[index].foreign_word}</span>
                        </div>
                        <div
                            className="
                            flex flex-col
                            back-face inset-0">
                            <span>{words[index].english_word}</span>
                            <span>{words[index].explanation}</span>
                        </div>
                    </div>
                </div>
                <div
                    className="flex gap-2">
                    <button
                        onClick={next}
                        className="bg-red-500 px-4 py-1 rounded-xs">
                        Incorrect
                    </button>
                    <button
                        onClick={next}
                        className="bg-brand px-4 py-1 rounded-xs">
                        Correct
                    </button>
                </div>
            </div>
    )
}