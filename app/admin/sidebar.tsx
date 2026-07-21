"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Grouped by what the entry actually is: tools you use, then the real
 * tables. Every entry points at a page that exists — dead links in a nav
 * are worse than a short nav.
 */
const TOOLS = [
    { icon: "👁️", name: "Preview", url: "/admin/preview" },
    { icon: "📝", name: "Vocabulary", url: "/admin/vocabulary" },
];

/** The course tree, in the order the data nests. */
const CONTENT_TABLES = [
    { name: "schools", url: "/admin/data/schools" },
    { name: "subjects", url: "/admin/data/subjects" },
    { name: "courses", url: "/admin/data/courses" },
    { name: "units", url: "/admin/data/units" },
    { name: "lessons", url: "/admin/data/lessons" },
    { name: "lesson_sets", url: "/admin/data/lesson_sets" },
    { name: "language_vocabulary", url: "/admin/data/language_vocabulary" },
];

const USER_TABLES = [
    { name: "profiles", url: "/admin/data/profiles" },
    { name: "set_completions", url: "/admin/data/set_completions" },
];

export default function AdminSidebar() {
    const pathname = usePathname();

    const link = (url: string) =>
        `px-3 py-2 rounded-sm transition-all text-sm ${
            pathname === url ? "bg-brand font-bold" : "text-muted hover:text-white hover:bg-brand/30"
        }`;

    return (
        <aside className="sticky top-0 self-start shrink-0
            h-screen w-56 overflow-y-auto
            bg-slate-950 border-r border-white/10 p-2 flex flex-col gap-1">

            <Link href="/learn" className="px-3 py-2 text-sm text-muted hover:text-white transition-colors">
                ← Back to app
            </Link>

            <span className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-[0.2em] text-brand font-bold">
                Tools
            </span>
            {TOOLS.map((item) => (
                <Link key={item.url} href={item.url} className={link(item.url)}>
                    <span className="mr-2">{item.icon}</span>{item.name}
                </Link>
            ))}

            <span className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-[0.2em] text-brand font-bold">
                Content
            </span>
            {CONTENT_TABLES.map((item) => (
                <Link key={item.url} href={item.url} className={`${link(item.url)} font-mono`}>
                    {item.name}
                </Link>
            ))}

            <span className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-[0.2em] text-brand font-bold">
                Users
            </span>
            {USER_TABLES.map((item) => (
                <Link key={item.url} href={item.url} className={`${link(item.url)} font-mono`}>
                    {item.name}
                </Link>
            ))}
        </aside>
    );
}
