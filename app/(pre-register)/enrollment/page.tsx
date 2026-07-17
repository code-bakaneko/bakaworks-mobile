import { createClient } from "@/app/lib/supabase/server"
export default async function PreRegisterCoursePage() {
    const supabase = await createClient();

    const { data: schools, error} = await supabase.from("schools").select("*, subjects(*)");

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
                                {}
                        </section>
                    ))}
                </section>
            ))}
        </div>
    )
}