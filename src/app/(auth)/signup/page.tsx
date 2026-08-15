import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signup } from "../actions";
import AuthShell from "../AuthShell";

export const dynamic = "force-dynamic";

const FIELD =
  "w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

type SearchParams = Promise<{ error?: string }>;

export default async function SignupPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Already signed in? No need to see the signup form.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const params = await searchParams;

  return (
    <AuthShell
      active="signup"
      title="Create your account"
      subtitle="Join RemoteRep — it's free to get started."
      error={params.error}
    >
      <form action={signup} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            className={FIELD}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className={FIELD}
          />
        </div>

        <div>
          <label
            htmlFor="confirm_password"
            className="mb-1.5 block text-sm font-medium"
          >
            Confirm password
          </label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Re-type your password"
            className={FIELD}
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-gradient-to-r from-primary to-primary-blue px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 active:scale-[0.99]"
        >
          Create account
        </button>
      </form>

      <p className="mt-6 text-sm text-foreground/60">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
