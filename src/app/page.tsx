import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-semibold tracking-tight mb-3">
          RemoteRep v4
        </h1>
        <p className="text-zinc-500 mb-8">
          Connecting remote sales talent with companies hiring.
        </p>

        {user ? (
          <Link
            href="/dashboard"
            className="inline-block rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-2.5 text-sm font-medium"
          >
            Go to dashboard
          </Link>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/signup"
              className="rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-2.5 text-sm font-medium"
            >
              Create account
            </Link>
            <Link
              href="/login"
              className="rounded border border-zinc-300 dark:border-zinc-700 px-5 py-2.5 text-sm font-medium"
            >
              Sign in
            </Link>
          </div>
        )}

        <p className="text-xs text-zinc-400 mt-12">
          v4 is in active development.{" "}
          <Link href="/supabase-check" className="underline">
            System check
          </Link>
        </p>
      </div>
    </main>
  );
}
