import Link from "next/link";
import { requestPasswordReset } from "../actions";
import AuthShell from "../AuthShell";

export const dynamic = "force-dynamic";

const FIELD =
  "w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

type SearchParams = Promise<{ error?: string; sent?: string; email?: string }>;

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const sent = params.sent === "1";

  return (
    <AuthShell
      active="login"
      title={sent ? "Check your email" : "Reset your password"}
      subtitle={
        sent
          ? undefined
          : "Enter the email you signed up with and we'll send you a link to choose a new password."
      }
      error={params.error}
    >
      {sent ? (
        <div className="space-y-4">
          <div
            role="status"
            className="rounded-lg border border-success/40 bg-success/5 p-4 text-sm"
          >
            If an account exists for{" "}
            <span className="font-medium">{params.email ?? "that email"}</span>,
            we&apos;ve sent a link to reset your password. It expires soon, so
            use it in the next few minutes.
          </div>
          <p className="text-sm text-foreground/60">
            Didn&apos;t get it? Check your spam folder, or{" "}
            <Link href="/forgot-password" className="font-medium text-primary hover:underline">
              send another link
            </Link>
            .
          </p>
        </div>
      ) : (
        <form action={requestPasswordReset} className="space-y-4">
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
              defaultValue={params.email}
              className={FIELD}
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-gradient-to-r from-primary to-primary-blue px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 active:scale-[0.99]"
          >
            Email me a reset link
          </button>
        </form>
      )}

      <p className="mt-6 text-sm text-foreground/60">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
