'use client'

import { useState } from "react";

type Step = {
    id: number; 
    type: string;
    content?: string;
    prompt?: string;
    choices?: string[];
};

export default function LessonPlayer ({ steps }: { steps: Step[] }) {
    const [index, setIndex] = useState(0);
    const step = steps[index];

    if(index >= steps.length) {
        return <div>Lesson Complete</div>
    }

    return (
        <div>
            {step.type === "lecture" && (
                <p>{step.content}</p>
            )}

            {step.type === "question" && (
                <div>
                    <p>{step.prompt}</p>
                    <div>
                        {step.choices?.map((choice) => (
                            <button key={choice}>{choice}</button>
                        ))}
                    </div>
                </div>
            )}
            <button>Continue</button>
        </div>
    )
}