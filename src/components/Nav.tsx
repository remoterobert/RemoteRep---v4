import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-dark-background">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/v3-logo.svg"
            alt="RemoteRep"
            width={28}
            height={32}
            className="dark:hidden"
            priority
          />
          <Image
            src="/v3-white-logo.svg"
            alt="RemoteRep"
            width={28}
            height={32}
            className="hidden dark:block"
            priority
          />
          <span className="font-semibold text-dark-foreground dark:text-white">
            RemoteRep
          </span>
        </Link>

        <div className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-light-grey hover:text-primary dark:hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <span className="text-xs text-light-grey hidden sm:inline">
                {user.email}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-light-grey hover:text-primary dark:hover:text-white transition-colors"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-light-grey hover:text-primary dark:hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded bg-primary text-white px-4 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity"
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
