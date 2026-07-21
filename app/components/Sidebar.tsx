"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, resetProgress } from "../lib/actions"

export default function LearnSidebar({ isAdmin = false }: { isAdmin?: boolean }) {
    const pathname = usePathname();

    const links = [
        { name: "Learn", url: "/learn"},
        { name: "Vocabulary", url: "/vocabulary"},
        { name: "Characters", url: "/characters"}
    ]
    return (
        <aside className="sticky top-0 self-start shrink-0
            h-screen w-56 overflow-y-auto
            bg-slate-950 border-r border-white/10 p-2 flex flex-col gap-2">
            {links.map((link) => (
                <Link key={link.name} href={link.url}
                    className={`px-3 py-2 rounded-sm transition-all
                     ${pathname === link.url? "bg-brand font-bold" : "hover:bg-brand/50" }`}>
                    {link.name}
                </Link>
            ))}

            {isAdmin && (
                <div className="mt-auto flex flex-col gap-2 pt-2 border-t border-white/10">
                    <span className="px-3 text-[10px] uppercase tracking-[0.2em] text-muted font-bold">
                        Admin
                    </span>
                    <Link href="/admin/preview"
                        className="px-3 py-2 rounded-sm transition-all text-muted
                            hover:text-white hover:bg-brand/30">
                        Content Preview
                    </Link>
                    <Link href="/admin/vocabulary"
                        className="px-3 py-2 rounded-sm transition-all text-muted
                            hover:text-white hover:bg-brand/30">
                        Admin Panel
                    </Link>
                    <form action={resetProgress}>
                        <button type="submit"
                            className="w-full text-left px-3 py-2 rounded-sm transition-all
                                text-muted hover:text-white hover:bg-amber-500/20 hover:cursor-pointer">
                            Reset Progress
                        </button>
                    </form>
                </div>
            )}

            <form action={signOut} className={isAdmin ? "" : "mt-auto"}>
                <button type="submit"
                    className="w-full text-left px-3 py-2 rounded-sm transition-all
                        text-muted hover:text-white hover:bg-red-500/20 hover:cursor-pointer">
                    Log Out
                </button>
            </form>
        </aside>
    )
}
