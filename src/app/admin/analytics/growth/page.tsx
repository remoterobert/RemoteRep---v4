import { createClient } from "@/lib/supabase/server";
import {
  ArrowTrendingUpIcon,
  UsersIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import {
  bucketCounts,
  bucketByCategory,
  computeDelta,
  parseRangeFromSearchParams,
} from "@/lib/analytics";
import { SignupsChart, StackedActivityChart, CumulativeChart } from "../Charts";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function GrowthPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const range = parseRangeFromSearchParams(params);
  const userType =
    typeof params.user_type === "string" ? params.user_type : "all";

  // Fetch signup rows (respecting user type filter)
  let signupQuery = supabase
    .from("users")
    .select("id, created_at")
    .gte("created_at", `${range.since}T00:00:00Z`)
    .lte("created_at", `${range.until}T23:59:59Z`)
    .order("created_at", { ascending: true })
    .limit(50000);

  if (userType === "candidate") {
    const { data: cids } = await supabase
      .from("candidate_profiles")
      .select("user_id");
    const ids = (cids ?? []).map((c) => c.user_id as string);
    if (ids.length > 0) signupQuery = signupQuery.in("id", ids);
  } else if (userType === "hiring") {
    const { data: mems } = await supabase
      .from("tenant_members")
      .select("user_id, role")
      .in("role", [
        "client_admin",
        "client_member",
        "agency_admin",
        "agency_member",
      ]);
    const ids = Array.from(
      new Set((mems ?? []).map((m) => m.user_id as string)),
    );
    if (ids.length > 0) signupQuery = signupQuery.in("id", ids);
  }

  const { data: signupRows } = await signupQuery;
  const signupSeries = bucketCounts(
    (signupRows ?? []) as { created_at: string }[],
    range.bucket,
  );

  // Cumulative
  let running = 0;
  const cumulativeSeries = signupSeries.map((r) => {
    running += r.count;
    return { date: r.date, count: running };
  });

  // Growth rate (period-over-period)
  const priorSince = shiftDate(range.since, range.until);
  const [{ count: currentSignups }, { count: priorSignups }] =
    await Promise.all([
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .gte("created_at", `${range.since}T00:00:00Z`)
        .lte("created_at", `${range.until}T23:59:59Z`),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .gte("created_at", `${priorSince}T00:00:00Z`)
        .lt("created_at", `${range.since}T00:00:00Z`),
    ]);
  const growthDelta = computeDelta(currentSignups ?? 0, priorSignups ?? 0);

  // Signup breakdown by user type
  const [
    { data: candidateSignups },
    { data: hiringSignups },
  ] = await Promise.all([
    supabase
      .from("candidate_profiles")
      .select("user_id, users!inner(created_at)")
      .gte("users.created_at", `${range.since}T00:00:00Z`)
      .lte("users.created_at", `${range.until}T23:59:59Z`)
      .limit(50000),
    supabase
      .from("tenant_members")
      .select("user_id, role, users!inner(created_at)")
      .in("role", [
        "client_admin",
        "client_member",
        "agency_admin",
        "agency_member",
      ])
      .gte("users.created_at", `${range.since}T00:00:00Z`)
      .lte("users.created_at", `${range.until}T23:59:59Z`)
      .limit(50000),
  ]);

  type NestedUser = {
    users: { created_at: string } | { created_at: string }[];
  };
  const flattenCreatedAt = (row: NestedUser): string => {
    const u = Array.isArray(row.users) ? row.users[0] : row.users;
    return u?.created_at ?? "";
  };
  const candidateWithDate = (candidateSignups ?? []).map((r) => ({
    type: "Candidate",
    created_at: flattenCreatedAt(r as unknown as NestedUser),
  }));
  const hiringWithDate = (hiringSignups ?? []).map((r) => ({
    type: "Hiring",
    created_at: flattenCreatedAt(r as unknown as NestedUser),
  }));
  const combined = [...candidateWithDate, ...hiringWithDate].filter(
    (r) => r.created_at,
  );
  const byTypePivot = bucketByCategory(combined, range.bucket, "type");

  // Time-to-activation: median days from signup → first candidate profile or listing
  const { data: activationEvents } = await supabase
    .from("candidate_profiles")
    .select("user_id, onboarding_completed_at, users!inner(created_at)")
    .not("onboarding_completed_at", "is", null)
    .gte("users.created_at", `${range.since}T00:00:00Z`)
    .lte("users.created_at", `${range.until}T23:59:59Z`)
    .limit(5000);
  type Act = {
    onboarding_completed_at: string;
    users: { created_at: string } | { created_at: string }[];
  };
  const daysBetween = ((activationEvents ?? []) as unknown as Act[])
    .map((a) => {
      const u = Array.isArray(a.users) ? a.users[0] : a.users;
      const signup = new Date(u.created_at).getTime();
      const done = new Date(a.onboarding_completed_at).getTime();
      return (done - signup) / (1000 * 60 * 60 * 24);
    })
    .filter((d) => d >= 0)
    .sort((a, b) => a - b);
  const medianTta =
    daysBetween.length > 0
      ? daysBetween[Math.floor(daysBetween.length / 2)]
      : null;

  return (
    <div className="space-y-4">
      {/* Top-line KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi
          icon={<UserPlusIcon className="h-4 w-4" />}
          label="Signups (period)"
          value={currentSignups ?? 0}
          delta={growthDelta}
        />
        <Kpi
          icon={<UsersIcon className="h-4 w-4" />}
          label="Candidates gained"
          value={candidateWithDate.length}
        />
        <Kpi
          icon={<UsersIcon className="h-4 w-4" />}
          label="Hiring users gained"
          value={hiringWithDate.length}
        />
        <Kpi
          icon={<ArrowTrendingUpIcon className="h-4 w-4" />}
          label="Median time-to-activate"
          value={medianTta != null ? `${medianTta.toFixed(1)}d` : "—"}
        />
      </div>

      {/* Signups + cumulative */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-2xl border border-border bg-surface-2 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
            New signups per bucket
          </h2>
          {signupSeries.length === 0 ? (
            <p className="text-sm text-light-grey">
              No signups in the selected range.
            </p>
          ) : (
            <SignupsChart data={signupSeries} label="New signups" />
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface-2 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
            Cumulative users
          </h2>
          {cumulativeSeries.length === 0 ? (
            <p className="text-sm text-light-grey">
              No data in the selected range.
            </p>
          ) : (
            <CumulativeChart data={cumulativeSeries} label="Cumulative" />
          )}
        </section>
      </div>

      {/* Breakdown by user type */}
      <section className="rounded-2xl border border-border bg-surface-2 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
          Signups by user type
        </h2>
        {byTypePivot.categories.length === 0 ? (
          <p className="text-sm text-light-grey">
            No signups categorized in this range.
          </p>
        ) : (
          <StackedActivityChart
            data={byTypePivot.data}
            categories={byTypePivot.categories}
          />
        )}
      </section>
    </div>
  );
}

// ------------- helpers -------------

function Kpi({
  icon,
  label,
  value,
  delta,
}: {
  icon: React.ReactNode;
  label: string | React.ReactNode;
  value: number | string;
  delta?: { absolute: number; percent: number | null };
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
      {delta && delta.percent !== null && (
        <div
          className={`text-[11px] mt-0.5 font-medium ${
            delta.absolute > 0
              ? "text-success"
              : delta.absolute < 0
                ? "text-danger"
                : "text-light-grey"
          }`}
        >
          {delta.absolute > 0 ? "+" : ""}
          {delta.percent}% vs prior period
        </div>
      )}
    </div>
  );
}

function shiftDate(since: string, until: string): string {
  const s = new Date(since);
  const u = new Date(until);
  const days = Math.max(
    1,
    Math.round((u.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const priorSince = new Date(s);
  priorSince.setDate(priorSince.getDate() - days);
  return priorSince.toISOString().slice(0, 10);
}
