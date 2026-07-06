import Link from "next/link";
import { ArrowUpCircleIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { TIER_LABEL, type SubscriptionTier } from "@/lib/subscriptions";

/**
 * Small upgrade CTA rendered in headers on hiring-side pages. Hides
 * itself for tenants that are already on the top tier (Concierge). For
 * Free tenants it suggests Premium; for Premium tenants it suggests
 * Concierge. Always links to /settings/billing where the real pricing
 * lives.
 */
export function UpgradeButton({
  currentTier,
  variant = "solid",
}: {
  currentTier: SubscriptionTier;
  variant?: "solid" | "ghost";
}) {
  if (currentTier === "concierge") return null;

  const targetLabel = currentTier === "free" ? "Premium" : "Concierge";

  const base =
    "inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-opacity";
  const style =
    variant === "solid"
      ? "bg-primary text-white hover:opacity-90"
      : "border border-primary/40 text-primary hover:bg-primary/5";

  return (
    <Link href="/settings/billing" className={`${base} ${style}`}>
      {variant === "solid" ? (
        <SparklesIcon className="h-3.5 w-3.5" />
      ) : (
        <ArrowUpCircleIcon className="h-3.5 w-3.5" />
      )}
      <span>
        Upgrade to {targetLabel}
        <span className="text-[10px] font-normal opacity-70 ml-1.5">
          · currently {TIER_LABEL[currentTier]}
        </span>
      </span>
    </Link>
  );
}
