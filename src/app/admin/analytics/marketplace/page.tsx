import { createClient } from "@/lib/supabase/server";
import {
  ArrowsRightLeftIcon,
  ClockIcon,
  CheckBadgeIcon,
  ChartPieIcon,
  EnvelopeIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { parseRangeFromSearchParams } from "@/lib/analytics";
import {
  ConversionFunnel,
  DistributionBar,
  DonutChart,
  TopNBar,
} from "../Charts";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const range = parseRangeFromSearchParams(params);

  // ============================================================
  // Application-lifecycle counts for the funnel
  // ============================================================
  const [
    { count: totalApps },
    { count: interviewingCount },
    { count: hiredCount },
    { count: rejectedCount },
    { count: withdrawnCount },
    { count: totalListings },
    { count: liveListings },
    { count: publicCandidates },
    { data: apps },
    { data: statusRows },
  ] = await Promise.all([
    supabase.from("applications").select("id", { count: "exact", head: true }),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .in("status", ["interviewing", "shortlisted", "applied"]),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "hired"),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "rejected"),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "withdrawn"),
    supabase.from("listings").select("id", { count: "exact", head: true }),
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("candidate_profiles")
      .select("user_id", { count: "exact", head: true })
      .eq("visibility", "public"),
    supabase
      .from("applications")
      .select("listing_id, status, applied_at, last_status_change_at")
      .gte("last_status_change_at", `${range.since}T00:00:00Z`)
      .lte("last_status_change_at", `${range.until}T23:59:59Z`)
      .limit(20000),
    supabase.from("applications").select("status").limit(50000),
  ]);

  // ============================================================
  // Time-to-hire distribution
  // ============================================================
  const hiredApps = ((apps ?? []) as Array<{
    status: string;
    applied_at: string | null;
    last_status_change_at: string;
  }>).filter((a) => a.status === "hired" && a.applied_at);

  const timeToHireDays = hiredApps
    .map((a) => {
      const applied = new Date(a.applied_at as string).getTime();
      const hired = new Date(a.last_status_change_at).getTime();
      return Math.round((hired - applied) / (1000 * 60 * 60 * 24));
    })
    .filter((d) => d >= 0)
    .sort((a, b) => a - b);

  const medianTth =
    timeToHireDays.length > 0
      ? timeToHireDays[Math.floor(timeToHireDays.length / 2)]
      : null;

  // Bucket time-to-hire into 0-7, 8-14, 15-30, 31-60, 61-90, 90+
  const tthBuckets = [
    { label: "0–7d", value: 0 },
    { label: "8–14d", value: 0 },
    { label: "15–30d", value: 0 },
    { label: "31–60d", value: 0 },
    { label: "61–90d", value: 0 },
    { label: "90d+", value: 0 },
  ];
  for (const d of timeToHireDays) {
    const b =
      d <= 7 ? 0 : d <= 14 ? 1 : d <= 30 ? 2 : d <= 60 ? 3 : d <= 90 ? 4 : 5;
    tthBuckets[b].value += 1;
  }

  // ============================================================
  // Applications per listing (fill rate)
  // ============================================================
  const { data: listingsWithApps } = await supabase
    .from("listings")
    .select("id, title, applications(id, status)")
    .eq("status", "published")
    .limit(500);

  type L = {
    id: string;
    title: string;
    applications: Array<{ id: string; status: string }>;
  };
  const listingsData = (listingsWithApps ?? []) as unknown as L[];

  const withAtLeastOneApp = listingsData.filter(
    (l) => (l.applications ?? []).length > 0,
  ).length;
  const withAtLeastOneHire = listingsData.filter((l) =>
    (l.applications ?? []).some((a) => a.status === "hired"),
  ).length;

  const fillRateApps =
    listingsData.length > 0
      ? Math.round((withAtLeastOneApp / listingsData.length) * 100)
      : 0;
  const fillRateHires =
    listingsData.length > 0
      ? Math.round((withAtLeastOneHire / listingsData.length) * 100)
      : 0;

  const appsPerListing =
    listingsData.length > 0
      ? Math.round(
          ((totalApps ?? 0) / listingsData.length) * 10,
        ) / 10
      : 0;

  // Top listings by apps
  const topByApps = listingsData
    .map((l) => ({
      id: l.id,
      label: l.title.slice(0, 40),
      value: (l.applications ?? []).length,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // ============================================================
  // Status distribution (all-time)
  // ============================================================
  const statusCounts = new Map<string, number>();
  for (const s of (statusRows ?? []) as { status: string }[]) {
    statusCounts.set(s.status, (statusCounts.get(s.status) ?? 0) + 1);
  }
  const statusData = Array.from(statusCounts.entries()).map(
    ([name, value]) => ({ name, value }),
  );

  // Application → hire conversion rate
  const conversion =
    (totalApps ?? 0) > 0
      ? Math.round(((hiredCount ?? 0) / (totalApps ?? 0)) * 100)
      : 0;

  // Supply vs demand
  const supplyDemand =
    (liveListings ?? 0) > 0
      ? Math.round(((publicCandidates ?? 0) / (liveListings ?? 0)) * 10) / 10
      : 0;

  // Funnel data
  const funnel = [
    { name: "Applications", value: totalApps ?? 0 },
    { name: "In progress", value: interviewingCount ?? 0 },
    { name: "Hired", value: hiredCount ?? 0 },
  ];

  return (
    <div className="space-y-4">
      {/* Top-line KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi
          icon={<ArrowsRightLeftIcon className="h-4 w-4" />}
          label="Total applications"
          value={totalApps ?? 0}
        />
        <Kpi
          icon={<CheckBadgeIcon className="h-4 w-4" />}
          label="Application → hire"
          value={`${conversion}%`}
        />
        <Kpi
          icon={<ClockIcon className="h-4 w-4" />}
          label="Median time-to-hire"
          value={medianTth != null ? `${medianTth}d` : "—"}
        />
        <Kpi
          icon={<ChartPieIcon className="h-4 w-4" />}
          label="Fill rate (any app)"
          value={`${fillRateApps}%`}
        />
        <Kpi
          icon={<ClipboardDocumentListIcon className="h-4 w-4" />}
          label="Listings live / total"
          value={`${liveListings ?? 0} / ${totalListings ?? 0}`}
        />
        <Kpi
          icon={<EnvelopeIcon className="h-4 w-4" />}
          label="Avg apps per listing"
          value={appsPerListing}
        />
        <Kpi
          icon={<CheckBadgeIcon className="h-4 w-4" />}
          label="Fill rate (hired)"
          value={`${fillRateHires}%`}
        />
        <Kpi
          icon={<ArrowsRightLeftIcon className="h-4 w-4" />}
          label="Candidates ÷ listings"
          value={supplyDemand}
        />
      </div>

      {/* Funnel + status donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-2xl border border-border bg-surface-2 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
            Hire funnel
          </h2>
          {(totalApps ?? 0) === 0 ? (
            <p className="text-sm text-light-grey">No applications yet.</p>
          ) : (
            <ConversionFunnel data={funnel} />
          )}
          <p className="text-[11px] text-light-grey mt-2">
            Applications → in-progress → hired.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-surface-2 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
            Application status mix
          </h2>
          {statusData.length === 0 ? (
            <p className="text-sm text-light-grey">No applications yet.</p>
          ) : (
            <DonutChart data={statusData} />
          )}
        </section>
      </div>

      {/* Time-to-hire distribution */}
      <section className="rounded-2xl border border-border bg-surface-2 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
          Time-to-hire distribution
        </h2>
        {timeToHireDays.length === 0 ? (
          <p className="text-sm text-light-grey">
            No hires in the selected range.
          </p>
        ) : (
          <DistributionBar data={tthBuckets} />
        )}
      </section>

      {/* Top listings by apps */}
      <section className="rounded-2xl border border-border bg-surface-2 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
          Top listings by application volume
        </h2>
        {topByApps.length === 0 ? (
          <p className="text-sm text-light-grey">No listings with applications yet.</p>
        ) : (
          <TopNBar data={topByApps} />
        )}
      </section>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-4">
      <div className="flex items-center gap-1.5 text-xs text-light-grey uppercase tracking-wider mb-1">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}
