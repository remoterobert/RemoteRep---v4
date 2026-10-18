import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { setNewPassword } from "../actions";
import AuthShell from "../AuthShell";

export const dynamic = "force-dynamic";

const FIELD =
  "w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

type SearchParams = Promise<{ error?: string }>;

// Reached from a password-reset email via /auth/confirm, which signs the user
// in. Without that session there's nothing to reset, so we point them back.
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AuthShell
        active="login"
        title="This link has expired"
        subtitle="Reset links work once and only for a short time."
      >
        <Link
          href="/forgot-password"
          className="block w-full rounded-lg bg-gradient-to-r from-primary to-primary-blue px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
        >
          Send me a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      active="login"
      title="Choose a new password"
      subtitle={`For ${user.email}. At least 8 characters.`}
      error={params.error}
    >
      <form action={setNewPassword} className="space-y-4">
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="confirm_password" className="mb-1.5 block text-sm font-medium">
            Confirm new password
          </label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={FIELD}
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-gradient-to-r from-primary to-primary-blue px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 active:scale-[0.99]"
        >
          Save new password
        </button>
      </form>
    </AuthShell>
  );
}
