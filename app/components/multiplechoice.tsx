"use client"
import { useState, useEffect } from "react";
import { Tables } from "../lib/database.types";
type Vocab = Tables<"language_vocabulary">;

export default function MultipleChoice({ words }: { words:Vocab[] }) {
    const [index, setIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [choices, setChoices] = useState<Vocab[]>([]);

    useEffect(() => {
        const correct = words[index];
        const others = words
            .filter((word) => word.id !== correct.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        setChoices([correct, ...others].sort(() => Math.random() - 0.5));
    }, [index, words]);

   
    if (words.length === 0) return <div>No words to use multiple choice</div>;

    function answer (choice: Vocab) {
        setRevealed(true);
        if(choice.id === words[index].id) {
            setScore((score) => score + 1)
        }
        setTimeout(() => {
            setIndex((index) => (index + 1) % words.length)
            setRevealed(false);
        }, 1000);
    }
    
    return (
        <div className="w-96 bg-slate-950 p-10 border border-slate-800 rounded-sm">
            <div className="flex flex-col gap-10">
                <p className="text-muted">Score: {score}</p>
                <div className="flex flex-col items-center gap-2">
                    <p>{words[index].romanized}</p>
                    <p>{words[index].reading}</p>
                    <p className="text-2xl font-bold">{words[index].foreign_word}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {choices.map((choice) => (
                        <button key={choice.id} onClick={() => answer(choice)}
                            className={`
                                ${revealed && choice.id === words[index].id ? "bg-green-500 border-green-700": "bg-brand border-brand-dark"} px-4 py-2 min-h-10 rounded-sm border-b-4
                                hover:cursor-pointer hover:translate-y-1 transition-all hover:border-0`}>
                            {choice.english_word}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}