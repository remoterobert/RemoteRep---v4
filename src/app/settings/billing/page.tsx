import Link from "next/link";
import { CreditCardIcon, SparklesIcon } from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

export default function BillingPage() {
  return (
    <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
      <Link
        href="/settings"
        className="text-xs text-light-grey hover:text-primary transition-colors mb-3 inline-block"
      >
        ← All settings
      </Link>
      <h1 className="text-2xl font-semibold mb-1">Billing</h1>
      <p className="text-sm text-light-grey mb-6">
        Subscription, invoices, and payment methods.
      </p>

      <div className="rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#101a37] p-8 text-center">
        <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <CreditCardIcon className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Free during beta</h2>
        <p className="text-sm text-light-grey max-w-sm mx-auto mb-6">
          RemoteRep is free while we&apos;re onboarding early users. Payment,
          plans, and invoicing land here when we roll out paid tiers.
        </p>
        <div className="inline-flex items-center gap-1.5 text-xs text-primary bg-primary/10 rounded-full px-3 py-1 font-semibold">
          <SparklesIcon className="h-3.5 w-3.5" />
          You&apos;re in the free beta
        </div>
      </div>
    </main>
  );
}
