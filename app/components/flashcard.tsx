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
    const [round, setRound] = useState(1);

    function next() {
        setFlipped(false);
        if (index === words.length){
            setIndex(0)
            setRound(round => round + 1)
        } else {
            if(index === limit) {
                setIndex(0);
                setRound(round => round + 1)
                setLimit(limit => limit + 2);
                if (limit >= words.length) {
                    setLimit(words.length)
                }
            } else {
                setIndex(index => index + 1);
            }
        }
    }

    return(
            <div>
                <span>{`Round: ${round}`}</span>
                <div className="scene w-96 h-128">
                    <div className={`${flipped? "flip":""} card-inner w-full h-full bg-slate-950 p-2 
                        border border-brand rounded-sm
                        hover:cursor-pointer`}
                        onClick={() => setFlipped(flip => !flip)}>
                        <div
                            className="
                            flex flex-col p-2
                            front-face inset-0">
                            <span className="text-muted">{`${index}/${words.length}`}</span>
                            <span>Japanese</span>
                            <div className="flex-1 flex flex-col gap-2 items-center justify-center">
                                <span>{words[index].romanized}</span>
                                <span>{words[index].reading}</span>
                                <span>{words[index].foreign_word}</span>
                            </div>
                        </div>
                        <div
                            className="
                            flex flex-col
                            back-face inset-0">
                            <span>English</span>
                            <div className="flex-1 flex flex-col justify-center items-center">
                                <span>{words[index].english_word}</span>
                                <span>{words[index].explanation}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    className="flex gap-2 items-center justify-center mt-2">
                    <button
                        onClick={next}
                        className="bg-red-500 px-4 py-2 rounded-xs w-[49%] border-b-4 border-red-700 h-15
                        hover:border-b-0 hover:cursor-pointer hover:translate-y-1">
                        Incorrect
                    </button>
                    <button
                        onClick={next}
                        className="bg-brand px-4 py-2 rounded-xs w-[49%] border-b-4 border-brand-dark h-15
                        hover:border-b-0 hover:cursor-pointer hover:translate-y-1">
                        Correct
                    </button>
                </div>
            </div>
    )
}