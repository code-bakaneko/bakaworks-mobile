import LearnSidebar from "../components/Sidebar";
import LearnTopBar from "../components/LearnTopBar";
import { createClient } from "../lib/supabase/server";

export default async function LearnLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims.sub;

    // Only used to decide whether to render the admin tools. The reset action
    // re-checks the role itself — this is presentation, not authorization.
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId ?? "")
        .maybeSingle();

    return (
        <div className="flex">
            <LearnSidebar isAdmin={profile?.role === "admin"} />
            <div className="flex-1 flex flex-col min-w-0">
                <LearnTopBar />
                <main className="flex-1">{children}</main>
            </div>
        </div>
    )
}
