import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/is-platform-admin";
import {
  UsersIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  ClipboardDocumentListIcon,
  BookmarkIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import {
  bucketCounts,
  bucketByCategory,
  computeDelta,
  parseRangeFromSearchParams,
} from "@/lib/analytics";
import { RangePicker } from "./RangePicker";
import { SignupsChart, StackedActivityChart, TopNBar } from "./Charts";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = await isPlatformAdmin();
  if (!admin) redirect("/dashboard");

  const params = await searchParams;
  const range = parseRangeFromSearchParams(params);
  const userType =
    typeof params.user_type === "string" ? params.user_type : "all";

  // ============================================================
  // KPIs (current + prior period)
  // ============================================================
  const priorSince = shiftDate(range.since, range.until);

  const [
    { count: totalUsers },
    { count: totalCandidates },
    { count: totalCompanies },
    { count: liveListings },
    { count: totalBookmarks },
    { count: totalApplications },
    { count: totalChats },
    { count: totalHires },
    { count: priorUsers },
    { count: priorApplications },
    { count: priorHires },
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase
      .from("candidate_profiles")
      .select("user_id", { count: "exact", head: true }),
    supabase
      .from("tenants")
      .select("id", { count: "exact", head: true })
      .in("type", ["client_company", "agency"]),
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase.from("bookmarks").select("id", { count: "exact", head: true }),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true }),
    supabase.from("chats").select("id", { count: "exact", head: true }),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "hired"),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .lte("created_at", range.since),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .lte("created_at", range.since),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "hired")
      .lte("last_status_change_at", range.since),
  ]);

  // ============================================================
  // Time series — signups per bucket
  // ============================================================
  let signupQuery = supabase
    .from("users")
    .select("id, created_at")
    .gte("created_at", `${range.since}T00:00:00Z`)
    .lte("created_at", `${range.until}T23:59:59Z`)
    .order("created_at", { ascending: true })
    .limit(50000);

  let userIds: string[] | null = null;
  if (userType === "candidate") {
    const { data: cids } = await supabase
      .from("candidate_profiles")
      .select("user_id");
    userIds = (cids ?? []).map((c) => c.user_id as string);
    if (userIds.length > 0) signupQuery = signupQuery.in("id", userIds);
    else return renderEmpty(range, userType, priorSince);
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
    userIds = Array.from(
      new Set((mems ?? []).map((m) => m.user_id as string)),
    );
    if (userIds.length > 0) signupQuery = signupQuery.in("id", userIds);
    else return renderEmpty(range, userType, priorSince);
  }

  const { data: signupRows } = await signupQuery;
  const signupSeries = bucketCounts(
    (signupRows ?? []) as { created_at: string }[],
    range.bucket,
  );

  // ============================================================
  // Events by type over time (activity chart)
  // ============================================================
  const { data: eventRows } = await supabase
    .from("events")
    .select("event_type, created_at")
    .gte("created_at", `${range.since}T00:00:00Z`)
    .lte("created_at", `${range.until}T23:59:59Z`)
    .limit(50000);

  const eventsPivot = bucketByCategory(
    (eventRows ?? []) as { event_type: string; created_at: string }[],
    range.bucket,
    "event_type",
  );

  // ============================================================
  // Top listings by combined score (views + bookmarks + applications)
  // ============================================================
  const [
    { data: viewEvents },
    { data: listingBookmarks },
    { data: applicationRows },
    { data: allListings },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("entity_id")
      .eq("event_type", "listing.viewed")
      .not("entity_id", "is", null)
      .limit(50000),
    supabase
      .from("bookmarks")
      .select("target_id")
      .eq("target_type", "listing")
      .limit(50000),
    supabase.from("applications").select("listing_id").limit(50000),
    supabase
      .from("listings")
      .select("id, title, tenants(name)")
      .eq("status", "published")
      .limit(500),
  ]);

  type L = {
    id: string;
    title: string;
    tenants: { name: string } | { name: string }[] | null;
  };
  const listings = (allListings ?? []) as unknown as L[];

  const viewCounts = countBy(viewEvents ?? [], (r) => r.entity_id);
  const bookmarkCounts = countBy(listingBookmarks ?? [], (r) => r.target_id);
  const appCounts = countBy(applicationRows ?? [], (r) => r.listing_id);

  const topListings = listings
    .map((l) => {
      const v = viewCounts.get(l.id) ?? 0;
      const b = bookmarkCounts.get(l.id) ?? 0;
      const a = appCounts.get(l.id) ?? 0;
      const tenant = Array.isArray(l.tenants) ? l.tenants[0] : l.tenants;
      return {
        id: l.id,
        label: `${l.title} · ${tenant?.name ?? ""}`.slice(0, 40),
        value: v + b * 2 + a * 3,
        v,
        b,
        a,
      };
    })
    .sort((x, y) => y.value - x.value)
    .slice(0, 10);

  // ============================================================
  // Top candidate profiles (by views + bookmarks + invitations)
  // ============================================================
  const [
    { data: profileViewEvents },
    { data: profileBookmarks },
    { data: profileInvites },
    { data: publicProfiles },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("entity_id")
      .eq("event_type", "profile.viewed")
      .not("entity_id", "is", null)
      .limit(50000),
    supabase
      .from("bookmarks")
      .select("target_id")
      .eq("target_type", "candidate")
      .limit(50000),
    supabase
      .from("applications")
      .select("candidate_user_id")
      .eq("status", "invited")
      .limit(50000),
    supabase
      .from("candidate_profiles")
      .select("user_id, headline, users!inner(first_name, last_name, email)")
      .eq("visibility", "public")
      .limit(500),
  ]);

  type P = {
    user_id: string;
    headline: string | null;
    users:
      | { first_name: string | null; last_name: string | null; email: string }
      | Array<{
          first_name: string | null;
          last_name: string | null;
          email: string;
        }>;
  };
  const profiles = (publicProfiles ?? []) as unknown as P[];

  const pViewCounts = countBy(profileViewEvents ?? [], (r) => r.entity_id);
  const pBookmarkCounts = countBy(profileBookmarks ?? [], (r) => r.target_id);
  const pInviteCounts = countBy(
    profileInvites ?? [],
    (r) => r.candidate_user_id,
  );

  const topProfiles = profiles
    .map((p) => {
      const u = Array.isArray(p.users) ? p.users[0] : p.users;
      const name =
        u.first_name || u.last_name
          ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()
          : u.email;
      const v = pViewCounts.get(p.user_id) ?? 0;
      const b = pBookmarkCounts.get(p.user_id) ?? 0;
      const i = pInviteCounts.get(p.user_id) ?? 0;
      return {
        id: p.user_id,
        label: name.slice(0, 32),
        value: v + b * 2 + i * 3,
        v,
        b,
        i,
      };
    })
    .sort((x, y) => y.value - x.value)
    .slice(0, 10);

  // ============================================================
  // Render
  // ============================================================
  const usersDelta = computeDelta(totalUsers ?? 0, priorUsers ?? 0);
  const appsDelta = computeDelta(
    totalApplications ?? 0,
    priorApplications ?? 0,
  );
  const hiresDelta = computeDelta(totalHires ?? 0, priorHires ?? 0);

  return (
    <main className="flex-1 w-full">
      <div className="mb-4">
        <Link
          href="/admin"
          className="text-xs text-light-grey hover:text-primary transition-colors inline-block"
        >
          ← Admin
        </Link>
        <h1 className="text-2xl font-semibold mt-1">Platform analytics</h1>
        <p className="text-sm text-light-grey mt-0.5">
          KPIs, activity trends, and top performers. Filter by date range,
          bucket, and user type.
        </p>
      </div>

      <RangePicker />

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Kpi
          icon={<UsersIcon className="h-4 w-4" />}
          label="Total users"
          value={totalUsers ?? 0}
          delta={usersDelta}
        />
        <Kpi
          icon={<UserGroupIcon className="h-4 w-4" />}
          label="Candidates"
          value={totalCandidates ?? 0}
        />
        <Kpi
          icon={<BuildingOffice2Icon className="h-4 w-4" />}
          label="Companies"
          value={totalCompanies ?? 0}
        />
        <Kpi
          icon={<ClipboardDocumentListIcon className="h-4 w-4" />}
          label="Live listings"
          value={liveListings ?? 0}
        />
        <Kpi
          icon={<BookmarkIcon className="h-4 w-4" />}
          label="Bookmarks"
          value={totalBookmarks ?? 0}
        />
        <Kpi
          icon={<EnvelopeIcon className="h-4 w-4" />}
          label="Applications"
          value={totalApplications ?? 0}
          delta={appsDelta}
        />
        <Kpi
          icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
          label="Chats"
          value={totalChats ?? 0}
        />
        <Kpi
          icon={<CheckBadgeIcon className="h-4 w-4" />}
          label="Hires"
          value={totalHires ?? 0}
          delta={hiresDelta}
        />
      </div>

      {/* Signups over time */}
      <section className="rounded-2xl border border-border bg-surface-2 p-5 mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
          Signups over time
        </h2>
        {signupSeries.length === 0 ? (
          <p className="text-sm text-light-grey">
            No signups in the selected range.
          </p>
        ) : (
          <SignupsChart data={signupSeries} label="New signups" />
        )}
      </section>

      {/* Activity chart */}
      <section className="rounded-2xl border border-border bg-surface-2 p-5 mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
          Activity by event type
        </h2>
        {eventsPivot.categories.length === 0 ? (
          <p className="text-sm text-light-grey">
            No events logged in the selected range.
          </p>
        ) : (
          <StackedActivityChart
            data={eventsPivot.data}
            categories={eventsPivot.categories}
          />
        )}
      </section>

      {/* Top lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <section className="rounded-2xl border border-border bg-surface-2 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
            Top listings
          </h2>
          {topListings.length === 0 ? (
            <p className="text-sm text-light-grey">No listings yet.</p>
          ) : (
            <TopNBar data={topListings} />
          )}
          <p className="text-xs text-light-grey mt-2">
            Score = views + 2× bookmarks + 3× applications.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-surface-2 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
            Top candidate profiles
          </h2>
          {topProfiles.length === 0 ? (
            <p className="text-sm text-light-grey">
              No public candidate profiles yet.
            </p>
          ) : (
            <TopNBar data={topProfiles} />
          )}
          <p className="text-xs text-light-grey mt-2">
            Score = views + 2× bookmarks + 3× invitations.
          </p>
        </section>
      </div>
    </main>
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
  label: string;
  value: number;
  delta?: { absolute: number; percent: number | null };
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-4">
      <div className="flex items-center gap-1.5 text-xs text-light-grey uppercase tracking-wider mb-1">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold tabular-nums">
        {value.toLocaleString()}
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

function countBy<T>(
  rows: T[],
  key: (row: T) => string | null | undefined,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = key(r);
    if (!k) continue;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

function renderEmpty(
  range: { since: string; until: string; bucket: string },
  userType: string,
  priorSince: string,
) {
  return (
    <main className="flex-1 w-full">
      <h1 className="text-2xl font-semibold mb-1">Platform analytics</h1>
      <p className="text-sm text-light-grey mb-6">
        No users match the selected user type ({userType}).
      </p>
      <RangePicker />
      <input type="hidden" value={JSON.stringify({ range, priorSince })} />
    </main>
  );
}
