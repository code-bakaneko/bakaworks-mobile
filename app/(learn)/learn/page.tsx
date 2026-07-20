import { createClient } from "@/app/lib/supabase/server"
import Link from "next/link";

export default async function LearnPage() {
    const supabase = await createClient();
    const STAR_PATH =
    "M0,-10 L2.35,-3.24 L9.51,-3.09 L3.8,1.24 L5.88,8.09 L0,4 L-5.88,8.09 L-3.8,1.24 L-9.51,-3.09 L-2.35,-3.24 Z";


    const {data: units, error} = await supabase.from("units").select("*, lessons(*)").eq("course_id", 1);
    return (
        <div>
            {units?.map((unit) => (
                <section key={unit.id}>
                    <h2>{unit.name}</h2>
                    <p>{unit.blurb}</p>
                    <svg viewBox="0 0 250 500" className="min-w-500 w-full">
                        <polyline points={unit.lessons.map((path) => `${path.x},${path.y}`).join(" ")} fill="none" strokeWidth=".3" className="stroke-white/20" />
                        {unit.lessons.map((lesson) => (
                            <Link key={lesson.id} href={`/learn/${lesson.id}`}>
                                <g transform={`translate(${lesson.x}, ${lesson.y})`}>
                                    <path d={STAR_PATH}
                                     transform="scale(0.25)" className="fill-brand" ></path>
                                </g>
                            </Link>
                        ))}
                    </svg>
                </section>
            ))}
        </div>
    )
}