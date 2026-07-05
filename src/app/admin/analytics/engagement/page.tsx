import { createClient } from "@/lib/supabase/server";
import { StubMetricGrid } from "../StubMetricGrid";
import { StackedActivityChart, SignupsChart } from "../Charts";
import {
  bucketByCategory,
  bucketCounts,
  parseRangeFromSearchParams,
} from "@/lib/analytics";
import { BoltIcon, ClockIcon, UsersIcon } from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function EngagementPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const range = parseRangeFromSearchParams(params);

  // Real data we can compute today: DAU proxy from events, activity mix
  const { data: eventRows } = await supabase
    .from("events")
    .select("event_type, actor_user_id, created_at")
    .gte("created_at", `${range.since}T00:00:00Z`)
    .lte("created_at", `${range.until}T23:59:59Z`)
    .not("actor_user_id", "is", null)
    .limit(50000);

  type E = {
    event_type: string;
    actor_user_id: string;
    created_at: string;
  };
  const events = (eventRows ?? []) as E[];

  // Compute DAU per day
  const dauByDay = new Map<string, Set<string>>();
  for (const e of events) {
    const day = e.created_at.slice(0, 10);
    if (!dauByDay.has(day)) dauByDay.set(day, new Set());
    dauByDay.get(day)!.add(e.actor_user_id);
  }
  const dauSeries = Array.from(dauByDay.entries())
    .map(([date, users]) => ({ date, count: users.size }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Activity mix by event type
  const activityPivot = bucketByCategory(events, range.bucket, "event_type");

  // Average events per active user
  const uniqueActors = new Set(events.map((e) => e.actor_user_id));
  const eventsPerUser =
    uniqueActors.size > 0
      ? Math.round((events.length / uniqueActors.size) * 10) / 10
      : 0;

  // Total events (period)
  const totalEvents = events.length;

  // Placeholder — activity per bucket for the line chart (already have)
  const activityBuckets = bucketCounts(events, range.bucket);

  return (
    <div className="space-y-4">
      {/* Real KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi
          icon={<UsersIcon className="h-4 w-4" />}
          label="Active users (period)"
          value={uniqueActors.size}
        />
        <Kpi
          icon={<BoltIcon className="h-4 w-4" />}
          label="Total actions"
          value={totalEvents}
        />
        <Kpi
          icon={<BoltIcon className="h-4 w-4" />}
          label="Actions / active user"
          value={eventsPerUser}
        />
        <Kpi
          icon={<ClockIcon className="h-4 w-4" />}
          label="Days with activity"
          value={dauByDay.size}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-2xl border border-border bg-surface-2 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
            Daily active users (unique actors)
          </h2>
          {dauSeries.length === 0 ? (
            <p className="text-sm text-light-grey">
              No activity in the selected range.
            </p>
          ) : (
            <SignupsChart data={dauSeries} label="DAU" />
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface-2 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
            Action volume per bucket
          </h2>
          {activityBuckets.length === 0 ? (
            <p className="text-sm text-light-grey">No events yet.</p>
          ) : (
            <SignupsChart data={activityBuckets} label="Actions" />
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-surface-2 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
          Activity mix by event type
        </h2>
        {activityPivot.categories.length === 0 ? (
          <p className="text-sm text-light-grey">No events yet.</p>
        ) : (
          <StackedActivityChart
            data={activityPivot.data}
            categories={activityPivot.categories}
          />
        )}
      </section>

      <StubMetricGrid
        title="Deeper engagement metrics"
        intro="These need per-session tracking or richer time-on-platform data. Ship when we wire up client-side session pings."
        blocker="Client-side session heartbeat + a `sessions` table."
        metrics={[
          {
            label: "MAU",
            description:
              "Monthly active users — unique users with any action in the last 30 days.",
          },
          {
            label: "WAU",
            description:
              "Weekly active users — unique users with any action in the last 7 days.",
          },
          {
            label: "DAU / MAU ratio",
            description:
              "The classic 'stickiness' metric. Above 20% is healthy.",
          },
          {
            label: "Avg session length",
            description:
              "Median minutes per session — proxy for engagement depth.",
            blocker: "Session heartbeats",
          },
          {
            label: "Sessions per user",
            description:
              "How often the median user comes back within the period.",
            blocker: "Session heartbeats",
          },
          {
            label: "Feature adoption %",
            description:
              "Share of users who've used a given feature (e.g., AI writer, filters).",
          },
        ]}
      />
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
