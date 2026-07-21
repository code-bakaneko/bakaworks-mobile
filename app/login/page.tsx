import Link from "next/link";
import { signIn } from "../lib/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="starfield lesson-enter min-h-screen flex flex-col">

      <header className="flex items-center px-6 py-4 max-w-md w-full mx-auto">
        <Link href="/"
          className="text-muted hover:text-white transition-colors text-2xl leading-none">
          ✕
        </Link>
      </header>

      <main className="flex-1 flex flex-col justify-center items-center px-6 pb-20">
        <div className="max-w-md w-full flex flex-col gap-8">

          <div className="text-center flex flex-col gap-3">
            <span className="text-xs uppercase tracking-[0.2em] text-brand font-bold">
              Welcome back
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold">Log In</h1>
            <p className="text-muted">Pick up right where you left off.</p>
          </div>

          <form action={signIn} className="flex flex-col gap-3 w-full">
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30
                rounded-sm px-4 py-3">
                {error}
              </p>
            )}
            <input name="email" type="email" placeholder="e-mail" required
              className="bg-slate-950 border border-white/15 rounded-sm px-4 h-12
                placeholder:text-white/30
                focus:outline-none focus:border-brand transition-colors" />
            <input name="password" type="password" placeholder="password" required
              className="bg-slate-950 border border-white/15 rounded-sm px-4 h-12
                placeholder:text-white/30
                focus:outline-none focus:border-brand transition-colors" />
            <button type="submit"
              className="bg-brand h-12 mt-2 rounded-sm font-extrabold border-b-4 border-brand-dark
                hover:border-b-0 hover:translate-y-1 transition-all">
              Log In
            </button>
            <Link href="/#signup" className="text-sm text-muted hover:text-white text-center mt-1
              transition-colors">
              Need an account? Sign up
            </Link>
          </form>

        </div>
      </main>

    </div>
  );
}
