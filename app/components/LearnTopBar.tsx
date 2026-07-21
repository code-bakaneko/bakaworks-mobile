import { createClient } from "@/app/lib/supabase/server";

// TODO: streak is still hardcoded — needs streak tracking before it means anything.
const STREAK = 5;

export default async function LearnTopBar() {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims.sub;

    const { data: profile } = await supabase
        .from("profiles")
        .select("gold")
        .eq("id", userId ?? "")
        .single();
    const gold = profile?.gold ?? 0;

    return (
        <header className="sticky top-0 z-40 h-16 shrink-0
            bg-slate-950/80 backdrop-blur border-b border-white/10">
            <div className="h-full max-w-3xl mx-auto px-6 flex items-center justify-end gap-6">

                <div className="flex items-center gap-2" title={`${STREAK} day streak`}>
                    <span className="text-2xl leading-none">🔥</span>
                    <span className="font-extrabold text-lg tabular-nums">{STREAK}</span>
                </div>

                <div className="flex items-center gap-2" title={`${gold} gold`}>
                    <span className="text-2xl leading-none">🪙</span>
                    <span className="font-extrabold text-lg tabular-nums">{gold}</span>
                </div>

            </div>
        </header>
    )
}
