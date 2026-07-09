import Image from "next/image"
import Link from "next/link"

export default function AdminPage() {

    const dummyCategoryList = [
        {
            id: "0",
            title: "Language",
            sort: "10"
        },
        {
            id: "1",
            title: "Web Development",
            sort: "20"
        }
    ]

    const dummyCourseList = [
        {
            id: "0",
            category_id: "0",
            title: "Japanese",
            blurb: "Learn Japanese like a native",
            icon: "🇯🇵",
            sort: "10"
            
        },
        {
            id: "1",
            category_id: "1",
            title: "HTML",
            blurb: "Learn the basics of structuring web pages with HTML",
            icon: "🤖",
            sort: "10"
        },
        {
            id: "2",
            category_id: "1",
            title: "CSS",
            blurb: "Learn the basics of structuring web pages with HTML",
            icon: "🤖",
            sort: "10"
        },
        {
            id: "3",
            category_id: "1",
            title: "JavaScript",
            blurb: "Learn the basics of structuring web pages with HTML",
            icon: "🤖",
            sort: "10"
        }
    ]
    return (
        <div
            className="mx-auto h-full w-full max-w-4xl">
            <div
                className="flex flex-col">
                {dummyCategoryList.map((category) => (
                    <div key={category.id}
                        className="border-b-2 px-4 py-2">
                        <p>{category.title}</p>
                        <div
                            className="grid grid-cols-6 gap-4">
                            {dummyCourseList.filter((course) => course.category_id === category.id).map((course) => (
                                <Link key={course.id}
                                    href={`/admin`}
                                    className="
                                    flex flex-col items-center justify-center gap-4
                                    aspect-square p-4
                                    bg-brand
                                    border-b-8 border-brand-dark rounded-sm
                                    cursor-pointer
                                    hover:border-b-0 hover:translate-y-0.5
                                    transition-all">
                                    <span
                                        className="text-5xl">
                                        {course.icon}
                                    </span>
                                    <p>{course.title}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}