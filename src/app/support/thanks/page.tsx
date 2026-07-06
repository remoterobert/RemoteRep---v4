import Link from "next/link";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

export default function SupportThanksPage() {
  return (
    <main className="flex-1 p-4 md:p-6 max-w-lg mx-auto w-full">
      <div className="rounded-2xl border border-border bg-surface-2 p-8 text-center mt-8">
        <div className="mx-auto h-14 w-14 rounded-full bg-success/15 flex items-center justify-center mb-4">
          <CheckCircleIcon className="h-8 w-8 text-success" />
        </div>
        <h1 className="text-xl font-semibold mb-2">Message sent</h1>
        <p className="text-sm text-light-grey mb-6">
          Our team just picked it up. We&apos;ll follow up at the email you
          provided, usually within a business day.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded bg-primary text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Back to dashboard
          </Link>
          <Link
            href="/support"
            className="text-sm text-light-grey hover:text-primary transition-colors"
          >
            Send another
          </Link>
        </div>
      </div>
    </main>
  );
}
