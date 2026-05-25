import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getUserSafe() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    // "AuthSessionMissingError" = no signed-in user; that's an expected
    // state on a fresh project, not a connection failure.
    const isExpectedNoSession = error?.name === "AuthSessionMissingError";
    return {
      data,
      realError: error && !isExpectedNoSession ? error : null,
    };
  } catch (e) {
    return {
      data: null,
      realError: {
        name: "ClientInitError",
        message: e instanceof Error ? e.message : String(e),
      },
    };
  }
}

export default async function SupabaseCheckPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Only attempt the connection if both env vars are present.
  let data: Awaited<ReturnType<typeof getUserSafe>>["data"] = null;
  let realError: { name: string; message: string } | null = null;

  if (supabaseUrl && hasAnonKey) {
    const result = await getUserSafe();
    data = result.data;
    realError = result.realError;
  }

  return (
    <main className="min-h-screen p-8 font-mono text-sm max-w-2xl mx-auto">
      <h1 className="text-2xl mb-6 font-sans font-bold">
        Supabase Connection Check
      </h1>

      <section className="mb-6">
        <h2 className="font-bold mb-2">Environment</h2>
        <ul className="space-y-1">
          <li>
            NEXT_PUBLIC_SUPABASE_URL:{" "}
            {supabaseUrl ? (
              <span className="text-green-600">✅ set</span>
            ) : (
              <span className="text-red-600">❌ missing</span>
            )}
          </li>
          {supabaseUrl && (
            <li className="text-xs text-zinc-500 break-all">
              → {supabaseUrl}
            </li>
          )}
          <li>
            NEXT_PUBLIC_SUPABASE_ANON_KEY:{" "}
            {hasAnonKey ? (
              <span className="text-green-600">✅ set</span>
            ) : (
              <span className="text-red-600">❌ missing</span>
            )}
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="font-bold mb-2">Connection test</h2>
        <p className="text-xs text-zinc-500 mb-2">
          Calls supabase.auth.getUser() — succeeds on a fresh project (no
          tables required).
        </p>
        {!supabaseUrl || !hasAnonKey ? (
          <div className="text-amber-600">
            <p>⚠️ Skipped — env vars missing (see above)</p>
          </div>
        ) : realError ? (
          <div className="text-red-600">
            <p>❌ Real error: {realError.message}</p>
            <p className="text-xs mt-1">({realError.name})</p>
          </div>
        ) : (
          <div className="text-green-600">
            <p>✅ Connection successful</p>
            <p className="text-zinc-500 text-xs mt-1">
              Current user:{" "}
              {data?.user
                ? data.user.email
                : "(none — expected, no one is signed in yet)"}
            </p>
          </div>
        )}
      </section>

      <p className="text-zinc-400 text-xs mt-12 border-t pt-4 border-zinc-200 dark:border-zinc-800">
        This page verifies Supabase connectivity end-to-end (Phase 1a). It
        will be removed or repurposed once real auth flows are built.
      </p>
    </main>
  );
}
