"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function LearnSidebar() {
    const pathname = usePathname();

    const links = [
        { name: "Learn", url: "/learn"},
        { name: "Vocabulary", url: "/vocabulary"}
    ]
    return (
        <aside className="h-screen w-56 bg-slate-950 p-2 flex flex-col gap-2">
            {links.map((link) => (
                <Link key={link.name} href={link.url}
                    className={`px-3 py-2 rounded-sm transition-all
                     ${pathname === link.url? "bg-brand font-bold" : "hover:bg-brand/50" }`}>
                    {link.name}
                </Link>
            ))}
        </aside>
    )
}