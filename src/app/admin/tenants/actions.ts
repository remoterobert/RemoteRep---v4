"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPlatformAdmin } from "@/lib/is-platform-admin";

const ALLOWED_TIERS = new Set(["free", "premium", "concierge"]);
const ALLOWED_PERIODS = new Set(["monthly", "annual"]);

/**
 * Grant a subscription tier to a tenant. No Stripe yet — this is the
 * admin-only handle we use to comp Premium/Concierge access to
 * partners and testers.
 */
export async function setTenantSubscriptionTier(formData: FormData) {
  const admin = await isPlatformAdmin();
  if (!admin) redirect("/dashboard");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const tenantId = String(formData.get("tenant_id") ?? "").trim();
  const tier = String(formData.get("tier") ?? "").trim();
  const period = String(formData.get("period") ?? "monthly").trim();
  const expiresRaw = String(formData.get("expires_at") ?? "").trim();
  if (!tenantId || !ALLOWED_TIERS.has(tier)) {
    redirect("/admin/tenants?error=invalid");
  }
  const usePeriod = ALLOWED_PERIODS.has(period) ? period : "monthly";

  let expiresAt: string | null = null;
  if (tier !== "free") {
    if (expiresRaw) {
      expiresAt = new Date(expiresRaw).toISOString();
    } else {
      const days = usePeriod === "annual" ? 365 : 30;
      expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("tenants")
    .update({
      subscription_tier: tier,
      subscription_expires_at: expiresAt,
      subscription_period: tier === "free" ? null : usePeriod,
      subscription_updated_by: user.id,
      subscription_updated_at: new Date().toISOString(),
    })
    .eq("id", tenantId);
  if (error) {
    redirect(`/admin/tenants?error=${encodeURIComponent(error.message)}`);
  }

  await adminClient.from("audit_log").insert({
    actor_user_id: user.id,
    action: "subscription_tier_changed",
    target_type: "tenant",
    target_id: tenantId,
    metadata: { new_tier: tier, period: usePeriod, expires_at: expiresAt },
  });

  revalidatePath("/admin/tenants");
  redirect(`/admin/tenants?saved=tier`);
}
