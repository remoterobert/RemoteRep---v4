import Link from "next/link";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { TIER_LABEL, TIER_PERKS, type SubscriptionTier } from "@/lib/subscriptions";

/**
 * Shown to paid tenants on the dashboard so they can immediately see what their
 * plan unlocked, with a direct link to use the headline feature (AI listing
 * writer). Hidden for Free tenants.
 */
export function PremiumFeaturesCallout({ tier }: { tier: SubscriptionTier }) {
  if (tier === "free") return null;
  const perks = TIER_PERKS[tier];

  return (
    <div className="mb-6 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 to-transparent p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <SparklesIcon className="h-5 w-5 text-primary" />
        <h2 className="text-sm font-bold">
          You&apos;re on {TIER_LABEL[tier]} — here&apos;s what&apos;s unlocked
        </h2>
      </div>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {perks.map((p) => (
          <li
            key={p}
            className="flex items-start gap-2 text-sm text-foreground/90"
          >
            <CheckCircleIcon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            {p}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/company/listings/new"
          className="inline-flex items-center gap-1.5 rounded bg-primary text-white px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          <SparklesIcon className="h-3.5 w-3.5" />
          Write a listing with AI
        </Link>
        <Link
          href="/settings/billing"
          className="inline-flex items-center rounded border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-2 transition-colors"
        >
          Manage plan
        </Link>
      </div>
    </div>
  );
}
