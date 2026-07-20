import LessonPlayer from "./LessonPlayer";

export default function LessonContent({ lessonId }: { lessonId: string }) {
    const dummySteps = [
        { id: 0, type: "lecture", content: "In Japanese, greetings change by time of day." },
        { id: 1, type: "question", prompt: "How do you say Good Morning?", choices: ["ohaiyo", "konnichiwa", "douzo"] },
    ];

    return <LessonPlayer steps={dummySteps} />;
}
