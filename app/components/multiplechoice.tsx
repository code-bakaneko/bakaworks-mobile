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
    
    return (
        <div>
            <p>Score: {score}</p>
            <p>{words[index].foreign_word}</p>
            {choices.map((choice) => (
                <button key={choice.id}>
                    {choice.english_word}
                </button>
            ))}
        </div>
    )
}