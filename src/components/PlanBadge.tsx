import Link from "next/link";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { TIER_LABEL, type SubscriptionTier } from "@/lib/subscriptions";
import { UpgradeButton } from "./UpgradeButton";

/**
 * Header plan indicator. Free tenants get the upgrade CTA; paid tenants get a
 * clear "Premium"/"Concierge" badge so it's obvious their plan is active
 * (with a subtle nudge to Concierge for Premium tenants).
 */
export function PlanBadge({ currentTier }: { currentTier: SubscriptionTier }) {
  if (currentTier === "free") {
    return <UpgradeButton currentTier="free" />;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400/25 to-primary/10 ring-1 ring-primary/40 text-primary px-3 py-1.5 text-sm font-bold">
        <SparklesIcon className="h-4 w-4" />
        {TIER_LABEL[currentTier]}
      </span>
      {currentTier === "premium" && (
        <Link
          href="/settings/billing"
          className="text-xs text-light-grey hover:text-primary transition-colors whitespace-nowrap"
        >
          Upgrade to Concierge
        </Link>
      )}
    </div>
  );
}
