import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

/**
 * Read-only browser for the project's tables.
 *
 * The whitelist is the point: `table` comes from the URL, so without it any
 * string could be passed to .from(). Everything here is admin-gated by
 * proxy.ts, but a route that reads an arbitrary caller-named table is worth
 * refusing on principle.
 */
const TABLES = [
    "schools",
    "subjects",
    "courses",
    "units",
    "lessons",
    "lesson_sets",
    "language_vocabulary",
    "profiles",
    "set_completions",
] as const;

type Table = (typeof TABLES)[number];

const isTable = (value: string): value is Table =>
    (TABLES as readonly string[]).includes(value);

/** Long values get truncated so one jsonb blob cannot swallow the table. */
function cell(value: unknown): string {
    if (value === null || value === undefined) return "—";
    const text = typeof value === "object" ? JSON.stringify(value) : String(value);
    return text.length > 120 ? text.slice(0, 120) + "…" : text;
}

export default async function AdminTablePage({
    params,
}: {
    params: Promise<{ table: string }>
}) {
    const { table } = await params;
    if (!isTable(table)) notFound();

    const { data: rows, error } = await supabaseAdmin
        .from(table)
        .select("*")
        .limit(500);

    if (error) {
        return (
            <div className="p-10 text-red-400">
                Could not read {table}: {error.message}
            </div>
        );
    }

    const columns = rows && rows.length > 0 ? Object.keys(rows[0]) : [];

    return (
        <div className="min-h-screen px-6 py-10">
            <div className="max-w-full flex flex-col gap-6">

                <header className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-[0.2em] text-brand font-bold">
                        Table
                    </span>
                    <h1 className="text-3xl font-extrabold font-mono">{table}</h1>
                    <p className="text-sm text-muted">
                        {rows?.length ?? 0} row(s){(rows?.length ?? 0) === 500 && " — showing the first 500"}
                    </p>
                </header>

                {columns.length === 0 ? (
                    <p className="text-muted">This table is empty.</p>
                ) : (
                    /* The table scrolls inside its own box rather than pushing
                       the page sideways. */
                    <div className="overflow-x-auto border border-white/10 rounded-sm">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-950">
                                <tr>
                                    {columns.map((column) => (
                                        <th key={column}
                                            className="text-left font-bold px-3 py-2
                                                whitespace-nowrap border-b border-white/10">
                                            {column}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows?.map((row, i) => (
                                    <tr key={i} className="odd:bg-white/[0.02] hover:bg-brand/10">
                                        {columns.map((column) => (
                                            <td key={column}
                                                className="px-3 py-2 align-top whitespace-nowrap
                                                    text-muted font-mono text-xs">
                                                {cell((row as Record<string, unknown>)[column])}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
