import Link from "next/link";

export default function Sidebar() {
    const navButtons = [
        {
            icon: "📚",
            name: "Courses",
            url: "/admin/courses"
        }
    ]
    return (
        <div
            className="
            h-screen p-2 overflow-y-auto
            bg-slate-950
            flex flex-col items-center justify-start">
            {navButtons.map((button) => (
                <Link 
                key={button.name}
                href={button.url}
                className="
                flex flex-col items-center justify-center
                px-2 py-1 rounded-sm
                bg-brand
                border-b-4 border-brand-dark
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