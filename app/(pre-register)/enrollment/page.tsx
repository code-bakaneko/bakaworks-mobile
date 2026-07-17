import { createClient } from "@/app/lib/supabase/server"
export default async function PreRegisterCoursePage() {
    const supabase = await createClient();

    const { data: schools, error} = await supabase.from("schools").select();

    return (
        <div>
            <section>
                Select Course
            </section>
            {schools?.map((school) => (
                <section key={school.id}
                    className="flex flex-col text-center justify-center mt-20">
                    <h2>{school.name}</h2>
                    <p className="text-sm
                     text-muted">{school.blurb}</p>
                </section>
            ))}
        </div>
    )
}