import { createClient } from "@/lib/supabase/server";

export type SubscriptionTier = "free" | "premium" | "concierge";

export const TIER_LABEL: Record<SubscriptionTier, string> = {
  free: "Free",
  premium: "Premium",
  concierge: "Concierge",
};

/**
 * What each paid tier unlocks *beyond the previous one* — used to tell paid
 * users exactly what they got, so they aren't guessing about new features.
 */
export const TIER_PERKS: Record<SubscriptionTier, string[]> = {
  free: [
    "Unlimited job listings",
    "Kanban ATS + chat",
    "Browse the candidate directory",
  ],
  premium: [
    "AI listing writer (Default / Repel / Inclusive styles)",
    "AI profile assist (coming soon)",
    "Priority support",
  ],
  concierge: [
    "AI sources + invites your best-fit candidates 24/7",
    "AI replies to candidate messages and offers to book interviews",
    "Every action logged; final hiring decisions stay with your team",
    "No listing cap",
  ],
};

export const TIER_PRICE_MONTHLY: Record<SubscriptionTier, number | null> = {
  free: null,
  premium: 59,
  concierge: 299,
};

export const TIER_PRICE_ANNUAL: Record<SubscriptionTier, number | null> = {
  free: null,
  premium: null,
  concierge: 2874, // $299 * 12 * 0.8 (20% off)
};

const TIER_LEVEL: Record<SubscriptionTier, number> = {
  free: 0,
  premium: 1,
  concierge: 2,
};

export function tierMeets(current: SubscriptionTier, required: SubscriptionTier) {
  return TIER_LEVEL[current] >= TIER_LEVEL[required];
}

/**
 * Load tier + expiry for a specific tenant. Uses the caller's Supabase
 * session — RLS on tenants already lets members read their own row.
 */
export async function getTenantSubscription(tenantId: string): Promise<{
  tier: SubscriptionTier;
  expiresAt: string | null;
  period: "monthly" | "annual" | null;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenants")
    .select("subscription_tier, subscription_expires_at, subscription_period")
    .eq("id", tenantId)
    .maybeSingle();
  if (!data)
    return { tier: "free", expiresAt: null, period: null };
  const tier = (data as { subscription_tier: SubscriptionTier }).subscription_tier;
  const expiresAt = (data as { subscription_expires_at: string | null })
    .subscription_expires_at;
  const period = (data as { subscription_period: "monthly" | "annual" | null })
    .subscription_period;
  // Expired subscription behaves as free.
  if (expiresAt && new Date(expiresAt) < new Date()) {
    return { tier: "free", expiresAt, period };
  }
  return { tier, expiresAt, period };
}

/**
 * Convenience for the current signed-in user's primary hiring tenant.
 * Returns { tenantId, tier } — falls back to free if no tenant.
 */
export async function getCurrentHiringSubscription(): Promise<{
  tenantId: string | null;
  tier: SubscriptionTier;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { tenantId: null, tier: "free" };

  const { data: memb } = await supabase
    .from("tenant_members")
    .select("tenant_id, tenants!inner(type, subscription_tier, subscription_expires_at)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", [
      "client_admin",
      "client_member",
      "agency_admin",
      "agency_member",
    ])
    .limit(1)
    .maybeSingle();
  if (!memb) return { tenantId: null, tier: "free" };
  const row = memb as unknown as {
    tenant_id: string;
    tenants: {
      type: string;
      subscription_tier: SubscriptionTier;
      subscription_expires_at: string | null;
    };
  };
  const expiresAt = row.tenants.subscription_expires_at;
  const effectiveTier: SubscriptionTier =
    expiresAt && new Date(expiresAt) < new Date()
      ? "free"
      : row.tenants.subscription_tier;
  return { tenantId: row.tenant_id, tier: effectiveTier };
}

export function hasAiAccess(tier: SubscriptionTier) {
  return tierMeets(tier, "premium");
}

export function hasConciergeAccess(tier: SubscriptionTier) {
  return tierMeets(tier, "concierge");
}

// -------- Featured listing --------

export const FEATURED_LISTING_PRICE_MONTHLY = 59;

export function isFeaturedListing(listing: {
  featured_until: string | null;
}): boolean {
  if (!listing.featured_until) return false;
  return new Date(listing.featured_until) > new Date();
}
