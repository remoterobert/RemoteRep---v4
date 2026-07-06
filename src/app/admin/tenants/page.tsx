import { createClient } from "@/lib/supabase/server";
import { TIER_LABEL, type SubscriptionTier } from "@/lib/subscriptions";
import { setTenantSubscriptionTier } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ saved?: string; error?: string }>;

export default async function AdminTenantsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: tenants } = await supabase
    .from("tenants")
    .select(
      "id, name, slug, type, status, created_at, subscription_tier, subscription_expires_at, subscription_period",
    )
    .order("created_at", { ascending: false });

  const { data: memberships } = await supabase
    .from("tenant_members")
    .select("tenant_id");

  const countByTenant = new Map<string, number>();
  memberships?.forEach((m) => {
    countByTenant.set(m.tenant_id, (countByTenant.get(m.tenant_id) ?? 0) + 1);
  });

  type Row = {
    id: string;
    name: string;
    slug: string;
    type: string;
    status: string;
    created_at: string;
    subscription_tier: SubscriptionTier;
    subscription_expires_at: string | null;
    subscription_period: "monthly" | "annual" | null;
  };
  const rows = (tenants ?? []) as Row[];

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-semibold">Tenants</h2>
        <span className="text-xs text-light-grey">{rows.length} total</span>
      </div>

      {params.saved && (
        <div className="mb-3 rounded border border-success/40 bg-success/5 p-2 text-xs text-success">
          Subscription tier updated.
        </div>
      )}
      {params.error && (
        <div className="mb-3 rounded border border-danger/40 bg-danger/5 p-2 text-xs text-danger">
          {params.error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded">
          <thead className="bg-zinc-50 dark:bg-zinc-900 text-left text-xs uppercase text-light-grey">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Type</th>
              <th className="p-3">Tier</th>
              <th className="p-3">Expires</th>
              <th className="p-3">Members</th>
              <th className="p-3">Grant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {rows.map((t) => (
              <tr key={t.id}>
                <td className="p-3">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-[11px] text-light-grey font-mono">
                    {t.slug}
                  </div>
                </td>
                <td className="p-3">
                  <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5">
                    {t.type}
                  </span>
                </td>
                <td className="p-3">
                  <TierBadge tier={t.subscription_tier} />
                </td>
                <td className="p-3 text-xs text-light-grey">
                  {t.subscription_expires_at
                    ? new Date(
                        t.subscription_expires_at,
                      ).toLocaleDateString()
                    : "—"}
                </td>
                <td className="p-3">{countByTenant.get(t.id) ?? 0}</td>
                <td className="p-3">
                  <form
                    action={setTenantSubscriptionTier}
                    className="flex items-center gap-1"
                  >
                    <input type="hidden" name="tenant_id" value={t.id} />
                    <select
                      name="tier"
                      defaultValue={t.subscription_tier}
                      className="text-xs rounded border border-border bg-surface-2 px-1.5 py-1"
                    >
                      <option value="free">Free</option>
                      <option value="premium">Premium</option>
                      <option value="concierge">Concierge</option>
                    </select>
                    <select
                      name="period"
                      defaultValue={t.subscription_period ?? "monthly"}
                      className="text-xs rounded border border-border bg-surface-2 px-1.5 py-1"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="annual">Annual</option>
                    </select>
                    <button
                      type="submit"
                      className="text-xs rounded bg-primary text-white px-2 py-1 font-semibold hover:opacity-90"
                    >
                      Grant
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <p className="text-sm text-light-grey mt-4">No tenants yet.</p>
      )}
    </div>
  );
}

function TierBadge({ tier }: { tier: SubscriptionTier }) {
  const styles: Record<SubscriptionTier, string> = {
    free: "bg-surface-3 text-light-grey",
    premium: "bg-primary/15 text-primary ring-1 ring-primary/30",
    concierge: "bg-warning/15 text-warning ring-1 ring-warning/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles[tier]}`}
    >
      {TIER_LABEL[tier]}
    </span>
  );
}
