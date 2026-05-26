import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { completeHiringOnboarding } from "../actions";
import { SALES_ROLES } from "@/lib/sales-roles";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string }>;

export default async function HiringOnboardingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // If already onboarded, send to dashboard.
  const { data: existing } = await supabase
    .from("tenant_members")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (existing) redirect("/dashboard");

  const params = await searchParams;
  const error = params.error;

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <Link
          href="/onboarding/choose-role"
          className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-3 inline-block"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-semibold mb-2">
          Tell us about your hiring
        </h1>
        <p className="text-sm text-zinc-500 mb-6">
          Three quick fields and you&apos;ll see matched candidates.
        </p>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded border border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-900 p-3 text-sm text-red-800 dark:text-red-200"
          >
            {error}
          </div>
        )}

        <form action={completeHiringOnboarding} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="first_name"
                className="block text-sm font-medium mb-1"
              >
                First name
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                autoComplete="given-name"
                className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="last_name"
                className="block text-sm font-medium mb-1"
              >
                Last name
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                required
                autoComplete="family-name"
                className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="company_name"
              className="block text-sm font-medium mb-1"
            >
              Company name
            </label>
            <input
              id="company_name"
              name="company_name"
              type="text"
              required
              autoComplete="organization"
              className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            />
          </div>

          <fieldset>
            <legend className="text-sm font-medium mb-2">
              What roles are you hiring for? (choose all that apply)
            </legend>
            <div className="space-y-1">
              {SALES_ROLES.map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-2 text-sm py-1 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    name="hiring_for"
                    value={r}
                    className="rounded"
                  />
                  {r}
                </label>
              ))}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              You can change these later.
            </p>
          </fieldset>

          <button
            type="submit"
            className="w-full rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-2 text-sm font-medium hover:opacity-90"
          >
            See matched candidates →
          </button>
        </form>
      </div>
    </main>
  );
}
