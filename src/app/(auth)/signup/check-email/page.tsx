import Link from "next/link";
import { resendVerification } from "../../actions";

type SearchParams = Promise<{
  email?: string;
  error?: string;
  resent?: string;
  unverified?: string;
}>;

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const email = sp.email ?? "";
  const unverified = sp.unverified === "1";
  const resent = sp.resent === "1";

  const heading = unverified ? "Please verify your email" : "Check your email";
  const body = unverified
    ? "This account exists, but the email hasn't been verified yet. Click the link we sent to finish signing in."
    : "We sent you a verification link. Click it to finish creating your account.";

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-semibold mb-3">{heading}</h1>
        <p className="text-sm text-zinc-500 mb-2">{body}</p>
        {email && (
          <p className="text-sm mb-6">
            Sent to <span className="font-medium">{email}</span>
          </p>
        )}

        {sp.error && (
          <div
            role="alert"
            className="mb-4 rounded border border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-900 p-3 text-xs text-red-800 dark:text-red-200 text-left"
          >
            {sp.error}
          </div>
        )}
        {resent && (
          <div
            role="status"
            className="mb-4 rounded border border-success/40 bg-success/5 p-3 text-xs text-success"
          >
            Verification link resent. Check your inbox.
          </div>
        )}

        <p className="text-xs text-light-grey mb-6">
          Didn&apos;t get it? Give it a minute, then check your spam folder.
        </p>

        {email && (
          <form action={resendVerification} className="mb-6">
            <input type="hidden" name="email" value={email} />
            <button
              type="submit"
              className="w-full rounded bg-primary text-white px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Resend verification email
            </button>
          </form>
        )}

        <Link href="/login" className="text-sm underline">
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
