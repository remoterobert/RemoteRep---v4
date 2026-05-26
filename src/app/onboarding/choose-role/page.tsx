import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ChooseRolePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // If already onboarded, send them to dashboard.
  const { data: existing } = await supabase
    .from("tenant_members")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (existing) redirect("/dashboard");

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-semibold tracking-tight mb-2 text-center">
          What brings you to RemoteRep?
        </h1>
        <p className="text-zinc-500 mb-10 text-center">
          Choose one to continue. You can change this later if needed.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/onboarding/hiring"
            className="block border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 hover:border-zinc-900 dark:hover:border-zinc-100 transition-colors"
          >
            <div className="text-3xl mb-3">🏢</div>
            <h2 className="text-lg font-semibold mb-1">I&apos;m hiring</h2>
            <p className="text-sm text-zinc-500">
              I represent a company looking to hire remote sales talent.
            </p>
          </Link>

          <Link
            href="/onboarding/candidate"
            className="block border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 hover:border-zinc-900 dark:hover:border-zinc-100 transition-colors"
          >
            <div className="text-3xl mb-3">💼</div>
            <h2 className="text-lg font-semibold mb-1">
              I&apos;m a sales rep
            </h2>
            <p className="text-sm text-zinc-500">
              I&apos;m looking for new remote sales opportunities.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
