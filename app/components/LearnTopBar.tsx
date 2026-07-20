// TODO: both values are hardcoded — needs a user_progress table before they mean anything.
const STREAK = 5;
const COINS = 120;

export default function LearnTopBar() {
    return (
        <header className="sticky top-0 z-40 h-16 shrink-0
            bg-slate-950/80 backdrop-blur border-b border-white/10">
            <div className="h-full max-w-3xl mx-auto px-6 flex items-center justify-end gap-6">

                <div className="flex items-center gap-2" title={`${STREAK} day streak`}>
                    <span className="text-2xl leading-none">🔥</span>
                    <span className="font-extrabold text-lg tabular-nums">{STREAK}</span>
                </div>

                <div className="flex items-center gap-2" title={`${COINS} coins`}>
                    <span className="text-2xl leading-none">🪙</span>
                    <span className="font-extrabold text-lg tabular-nums">{COINS}</span>
                </div>

            </div>
        </header>
    )
}
