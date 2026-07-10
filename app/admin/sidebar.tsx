import Link from "next/link";

export default function AdminSidebar() {
    const navButtons = [
        {
            icon: "📚",
            name: "Category",
            url: "/admin/categories"
        },
        {
            icon: "📚",
            name: "Courses",
            url: "/admin/courses"
        },
        {
            icon: "📚",
            name: "Units",
            url: "/admin/courses"
        },
        {
            icon: "📚",
            name: "Quizzes",
            url: "/admin/courses"
        },
        
        {
            icon: "📚",
            name: "Lessons",
            url: "/admin/courses"
        },
        {
            icon: "📚",
            name: "Questions",
            url: "/admin/questions"
        },
        {
            icon: "📚",
            name: "Vocabulary",
            url: "/admin/vocabulary"
        }
    ]
    return (
        <div
            className="
            h-screen p-2 overflow-y-auto
            bg-slate-950
            flex flex-col items-center justify-start gap-2">
            {navButtons.map((button) => (
                <Link 
                key={button.name}
                href={button.url}
                className="
                flex flex-col items-center justify-center
                px-2 py-1 rounded-sm
                border-b-4 border-white/10
                cursor-pointer
                hover:border-b-0 hover:translate-y-1
                transition-all">
                <span>{button.icon}</span>
                <p>{button.name}</p>
            </Link>
            ))}
        </div>
    )
}