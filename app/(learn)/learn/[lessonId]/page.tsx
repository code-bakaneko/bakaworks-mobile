import LessonPlayer from "@/app/components/LessonPlayer";

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }>}) {
    const { lessonId } = await params;
    const dummySteps = [
        { id: 0, type: "lecture", content: "In Japanese, greetings change by time of day." },
        { id: 1, type: "question", prompt: "How do you say Good Morning?", choices: ["ohaiyo", "konnichiwa", "douzo"] },
    ]

    return (
        <div>
            <LessonPlayer steps={dummySteps}/>
        </div>
    )
}