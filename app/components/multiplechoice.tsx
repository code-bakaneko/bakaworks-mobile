"use client"
import { useState, useMemo } from "react";
import { Tables } from "../lib/database.types";
type Vocab = Tables<"language_vocabulary">;

export default function MultipleChoice({ words }: { words:Vocab[] }) {
    const [index, setIndex] = useState(0);
    const [score, setScore] = useState(0);

    const choices = useMemo(() => {
        const correct = words[index];
        const others = words
            .filter((word) => word.id !== correct.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
            return [correct, ...others].sort(() => Math.random() - 0.5);
    }, [index, words]);

    if (words.length === 0) return <div>No words to use multiple choice</div>;

    function answer (choice: Vocab) {
        if(choice.id === words[index].id) {
            setScore((score) => score + 1)
        }
        setIndex((index) => (index + 1) % words.length)
    }
    
    return (
        <div className="bg-slate-950 p-10 border rounded-sm">
            <div className="flex flex-col gap-10">
                <p>Score: {score}</p>
                <div>
                    <p>{words[index].romanized}</p>
                    <p>{words[index].reading}</p>
                    <p>{words[index].foreign_word}</p>
                </div>
                <div className="flex gap-5">
                    {choices.map((choice) => (
                        <button key={choice.id} onClick={() => answer(choice)}
                            className="bg-brand px-4 py-2 h-10 rounded-sm border-b-4 border-brand-dark">
                            {choice.english_word}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}