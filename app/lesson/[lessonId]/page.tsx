import LessonContent from "@/app/components/LessonContent";

export default async function LessonPage({
    params,
}: {
    params: Promise<{ lessonId: string }>
}) {
    const { lessonId } = await params;

    return <LessonContent lessonId={lessonId} />;
}
