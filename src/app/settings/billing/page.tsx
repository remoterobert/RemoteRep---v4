import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CheckCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentHiringSubscription,
  TIER_LABEL,
  TIER_PRICE_MONTHLY,
  TIER_PRICE_ANNUAL,
  type SubscriptionTier,
} from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

const PLANS: Array<{
  tier: SubscriptionTier;
  headline: string;
  perks: string[];
}> = [
  {
    tier: "free",
    headline: "The basics — post listings, chat with reps, browse candidates.",
    perks: [
      "Unlimited job listings",
      "Kanban ATS + chat",
      "Browse the candidate directory",
    ],
  },
  {
    tier: "premium",
    headline: "AI copywriting for listings and profile helpers.",
    perks: [
      "Everything in Free",
      "AI listing writer (Default / Repel / Inclusive styles)",
      "AI profile assist (coming soon)",
      "Priority support",
    ],
  },
  {
    tier: "concierge",
    headline:
      "A real AI hiring agent that sources, invites, chats, and books.",
    perks: [
      "Everything in Premium",
      "AI sources + invites your best-fit candidates 24/7",
      "AI replies to candidate messages and offers to book interviews",
      "Every action logged; final hiring decisions stay with your team",
      "No listing cap",
    ],
  },
];

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { tier: currentTier } = await getCurrentHiringSubscription();

  return (
    <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
      <Link
        href="/settings"
        className="text-xs text-light-grey hover:text-primary transition-colors mb-3 inline-block"
      >
        ← All settings
      </Link>
      <h1 className="text-2xl font-semibold mb-1">Billing &amp; plans</h1>
      <p className="text-sm text-light-grey mb-6">
        Your plan controls which features are available to your team.
      </p>

      <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/[0.03] p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <SparklesIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider font-semibold text-light-grey mb-0.5">
            Current plan
          </div>
          <div className="text-lg font-semibold">{TIER_LABEL[currentTier]}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PLANS.map((p) => (
          <PlanCard
            key={p.tier}
            tier={p.tier}
            current={p.tier === currentTier}
            headline={p.headline}
            perks={p.perks}
          />
        ))}
      </div>

      <p className="text-[11px] text-light-grey mt-4 leading-relaxed">
        Payments open when Stripe checkout goes live. Until then, contact
        <a
          href="mailto:sales@remoterep.com"
          className="text-primary hover:opacity-80 ml-1"
        >
          sales@remoterep.com
        </a>{" "}
        to be granted Premium or Concierge access — we&apos;ll do it manually
        for now.
      </p>
    </main>
  );
}

function PlanCard({
  tier,
  current,
  headline,
  perks,
}: {
  tier: SubscriptionTier;
  current: boolean;
  headline: string;
  perks: string[];
}) {
  const monthly = TIER_PRICE_MONTHLY[tier];
  const annual = TIER_PRICE_ANNUAL[tier];

  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col ${
        current
          ? "border-primary bg-primary/[0.04]"
          : "border-border bg-surface-2"
      }`}
    >
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-base font-semibold">{TIER_LABEL[tier]}</h2>
        {current && (
          <span className="text-[10px] rounded-full bg-primary text-white px-2 py-0.5 font-semibold uppercase">
            Current
          </span>
        )}
      </div>
      <div className="mb-2">
        <span className="text-2xl font-semibold tabular-nums">
          {monthly === null ? "Free" : `$${monthly}`}
        </span>
        {monthly !== null && (
          <span className="text-xs text-light-grey ml-1">/mo</span>
        )}
      </div>
      {annual !== null && (
        <div className="text-[11px] text-light-grey mb-2">
          or <span className="font-semibold">${annual.toLocaleString()}/yr</span>{" "}
          (~20% off)
        </div>
      )}
      <p className="text-xs text-light-grey mb-3 leading-snug">{headline}</p>
      <ul className="space-y-1.5 mb-4 text-xs flex-1">
        {perks.map((p) => (
          <li key={p} className="flex items-start gap-1.5">
            <CheckCircleIcon className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      {current ? (
        <div className="text-[11px] text-light-grey italic text-center py-1.5 border-t border-border">
          Your active plan
        </div>
      ) : tier === "free" ? (
        <a
          href="mailto:sales@remoterep.com?subject=Downgrade to Free"
          className="text-center rounded border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-3"
        >
          Contact us to downgrade
        </a>
      ) : (
        <a
          href={`mailto:sales@remoterep.com?subject=Upgrade to ${TIER_LABEL[tier]}`}
          className="text-center rounded bg-primary text-white px-3 py-1.5 text-xs font-semibold hover:opacity-90"
        >
          Contact us to upgrade
        </a>
      )}
    </div>
  );
}
