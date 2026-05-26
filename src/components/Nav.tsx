import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold">
          RemoteRep v4
        </Link>

        <div className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Dashboard
              </Link>
              <span className="text-xs text-zinc-400">{user.email}</span>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-1.5 text-xs font-medium"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
