export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }>}) {
    const { lessonId } = await params;
    const dummySteps = [
        { id: 0, type: "lecture", content: "In Japanese, greetings change by time of day." },
        { id: 1, type: "question", prompt: "How do you say Good Morning?", choices: ["ohaiyo", "konnichiwa", "douzo"] },
    ]

    return (
        <div>
            {dummySteps.map((question) => (
                <div key={question.id}>
                    <p>{question.prompt}</p>
                    <div className=" flex gap-2">
                        {question.choices?.map((choice) => (
                            <button key={choice} className="px-4 py-2 bg-brand">{choice}</button>
                        ))}
                    </div>
                </div>
            ))}
            <button className="px-4 py-2 bg-green-600 rounded-sm">Check/Continue</button>
        </div>
    )
}