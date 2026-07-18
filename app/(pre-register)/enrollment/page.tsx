import { createClient } from "@/app/lib/supabase/server"
export default async function PreRegisterCoursePage() {
    const supabase = await createClient();

    const { data: schools, error} = await supabase.from("schools").select("*, subjects(*, courses(*))");
    if(error) return <div>Failure to load Courses</div>;

    return (
        <div>
            <section>
                Select Course
            </section>
            {schools?.map((school) => (
                <section key={school.id}
                    className="
                        flex flex-col text-center justify-center mt-20 max-w-4xl mx-auto">
                    <h2>{school.name}</h2>
                    <p className="text-sm
                     text-muted">{school.blurb}</p>
                    <span className="
                        border-b-2 border-white/10"></span>
                    {school.subjects?.map((subject) => (
                        <section key={subject.id}>
                                <h3>{subject.name}</h3>
                                <p>{subject.blurb}</p>
                                <div className="grid grid-cols-6">
                                    {subject.courses?.map((course) => (
                                        <button key={course.id}
                                            className="
                                            border border-white/30 border-b-4 border-b-brand rounded-sm
                                            flex flex-col items-center justify-center aspect-square
                                            hover:border-white hover:border-b-1 hover:translate-y-1 hover:cursor-pointer
                                            transition-all">
                                            {course.name}
                                        </button>
                                    ))}
                                </div>
                        </section>
                    ))}
                </section>
            ))}
        </div>
    )
}