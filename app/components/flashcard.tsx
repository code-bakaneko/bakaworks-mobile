"use client"
import { useState } from "react";
import { Tables } from "@/app/lib/database.types"
import { setupFsCheck } from "next/dist/server/lib/router-utils/filesystem";

type Vocab = Tables<"language_vocabulary">;

export default function FlashCard({ words }: { words: Vocab[] }) {
    const [flipped, setFlipped] = useState(false);
    const [index, setIndex] = useState(0);
    const [limit, setLimit] = useState(() => Math.min(2, words.length - 1));
    const [round, setRound] = useState(1);
    const [correct, setCorrect] = useState(0);
    const [incorrect, setIncorrect] = useState(0);

    if (words.length === 0) {
        return <div>No Words Yet</div>
    }

    function next(wasCorrect: boolean) {

        if(wasCorrect) {
            setCorrect(correct => correct + 1)
        } else {
            setIncorrect(incorrect => incorrect + 1)
        }

        setFlipped(false);
        
        if ( index === limit) {
            setIndex(0);
            setRound(round => round + 1)
            if (limit < words.length - 1) {
                if(limit + 2 > words.length - 1) {
                    setLimit(words.length - 1)
                } else {
                    setLimit(limit => limit + 2)
                }
            }
        } else {
            setIndex(index => index + 1)
        }

    }

    return(
            <div className="w-96 h-128 flex flex-col">
                <span>{`Round: ${round}`}</span>
                <span>{`Correct: ${correct} Incorrect: ${incorrect}`}</span>
                <div className="scene w-full h-full">
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
                        onClick={() => next(false)}
                        className="bg-red-500 px-4 py-2 rounded-xs w-[49%] border-b-4 border-red-700 h-15
                        hover:border-b-0 hover:cursor-pointer hover:translate-y-1">
                        Incorrect
                    </button>
                    <button
                        onClick={() => next(true)}
                        className="bg-brand px-4 py-2 rounded-xs w-[49%] border-b-4 border-brand-dark h-15
                        hover:border-b-0 hover:cursor-pointer hover:translate-y-1">
                        Correct
                    </button>
                </div>
            </div>
    )
}