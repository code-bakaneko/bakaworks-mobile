import LessonContent from "@/app/components/LessonContent";

/**
 * Plays one specific set in preview mode. Reachable only under /admin, which
 * proxy.ts already gates on the admin role.
 */
export default async function PreviewSetPage({
    params,
}: {
    params: Promise<{ lessonId: string; setNumber: string }>
}) {
    const { lessonId, setNumber } = await params;

    return (
        <LessonContent
            lessonId={lessonId}
            forceSet={Number(setNumber)}
            preview
        />
    );
}
