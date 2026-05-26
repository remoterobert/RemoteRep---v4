import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-semibold mb-3">Check your email</h1>
        <p className="text-sm text-zinc-500 mb-6">
          We sent you a verification link. Click it to finish creating your
          account.
        </p>
        <p className="text-xs text-zinc-400 mb-8">
          Didn&apos;t get it? Check your spam folder. Email delivery during
          development uses Supabase&apos;s default service, which is
          rate-limited.
        </p>
        <Link href="/login" className="text-sm underline">
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
