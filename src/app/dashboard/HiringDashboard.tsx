import Link from "next/link";
import {
  UserGroupIcon,
  EnvelopeIcon,
  ClipboardDocumentListIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";
import { computeCompanyCompletion } from "@/lib/company-completion";
import { Kanban, type KanbanCardData, type ColumnId } from "./Kanban";
import { ClosedToggle } from "./ClosedToggle";
import { ListingFilter } from "./ListingFilter";
import { QuickStartCard, type QuickStartStep } from "./QuickStartCard";
import { PlanBadge } from "@/components/PlanBadge";
import { PremiumFeaturesCallout } from "@/components/PremiumFeaturesCallout";
import { getTenantSubscription } from "@/lib/subscriptions";

const KANBAN_STAGES: ColumnId[] = [
  "invited",
  "applied",
  "interviewing",
  "shortlisted",
  "hired",
  "rejected",
  "withdrawn",
];

export async function HiringDashboard({
  userId,
  tenantId,
  tenantName,
  firstName,
  selectedListingId,
  showClosed,
}: {
  userId: string;
  tenantId: string;
  tenantName: string;
  firstName: string | null | undefined;
  selectedListingId: string | null;
  showClosed: boolean;
}) {
  const supabase = await createClient();

  // Load listings for the filter dropdown (all statuses, most recent first).
  const { data: listingsRaw } = await supabase
    .from("listings")
    .select("id, title, status, published_at, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  type ListingRow = {
    id: string;
    title: string;
    status: string;
    published_at: string | null;
    created_at: string;
  };
  const listings = (listingsRaw ?? []) as ListingRow[];
  const selected = selectedListingId
    ? listings.find((l) => l.id === selectedListingId) ?? null
    : null;

  // Build the application query. Filter by listing if selected.
  let appQuery = supabase
    .from("applications")
    .select(
      "id, status, listing_id, candidate_user_id, applied_at, last_status_change_at, message, users!inner(first_name, last_name, email), listings(id, title), chats(id)",
    )
    .eq("tenant_id", tenantId)
    .in("status", KANBAN_STAGES);
  if (selectedListingId) {
    appQuery = appQuery.eq("listing_id", selectedListingId);
  }
  const { data: appsRaw } = await appQuery.order("last_status_change_at", {
    ascending: false,
  });

  type AppRow = {
    id: string;
    status: string;
    listing_id: string | null;
    candidate_user_id: string;
    applied_at: string | null;
    last_status_change_at: string;
    message: string | null;
    users: {
      first_name: string | null;
      last_name: string | null;
      email: string;
    };
    listings: { id: string; title: string } | { id: string; title: string }[] | null;
    chats: { id: string } | { id: string }[] | null;
  };
  const apps = (appsRaw ?? []) as unknown as AppRow[];

  // Candidate bookmarks (owned by the current user — the sidebar of "reps
  // I want to reach out to"). Only shown when the "All listings" filter is
  // active — a bookmark isn't tied to a listing.
  let bookmarksRaw: unknown[] = [];
  if (!selectedListingId) {
    const { data } = await supabase
      .from("bookmarks")
      .select(
        "id, target_id, created_at, note",
      )
      .eq("owner_user_id", userId)
      .eq("target_type", "candidate")
      .order("created_at", { ascending: false });
    bookmarksRaw = data ?? [];
  }
  type BookmarkRow = {
    id: string;
    target_id: string;
    created_at: string;
    note: string | null;
  };
  const bookmarks = bookmarksRaw as BookmarkRow[];

  // Fetch candidate identities for bookmarks (users table isn't inline
  // because bookmarks.target_id doesn't have a FK PostgREST can auto-join).
  const bookmarkUsers = new Map<
    string,
    { first_name: string | null; last_name: string | null; email: string }
  >();
  if (bookmarks.length > 0) {
    const targetIds = bookmarks.map((b) => b.target_id);
    const { data: userRows } = await supabase
      .from("users")
      .select("id, first_name, last_name, email")
      .in("id", targetIds);
    for (const u of (userRows ?? []) as Array<{
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string;
    }>) {
      bookmarkUsers.set(u.id, {
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
      });
    }
  }

  // --------- Build Kanban cards ---------
  const cards: KanbanCardData[] = [];

  // Bookmarked candidates (only when All Listings)
  for (const bm of bookmarks) {
    const u = bookmarkUsers.get(bm.target_id);
    const name =
      (u?.first_name || u?.last_name
        ? `${u?.first_name ?? ""} ${u?.last_name ?? ""}`.trim()
        : u?.email) || "Candidate";
    cards.push({
      id: `bm:${bm.id}`,
      columnId: "bookmarked",
      title: name,
      subtitle: u?.email,
      href: `/candidates/${bm.target_id}`,
      avatarInitials: initialsFrom(u?.first_name, u?.last_name, u?.email),
      kind: "bookmark_candidate",
      bookmarkTargetId: bm.target_id,
    });
  }

  // Applications
  for (const a of apps) {
    const listing = Array.isArray(a.listings) ? a.listings[0] : a.listings;
    const chat = Array.isArray(a.chats) ? a.chats[0] : a.chats;
    const name =
      (a.users.first_name || a.users.last_name
        ? `${a.users.first_name ?? ""} ${a.users.last_name ?? ""}`.trim()
        : a.users.email) || "Candidate";
    const subtitleParts: string[] = [];
    if (listing?.title && !selectedListingId) {
      subtitleParts.push(listing.title);
    }
    subtitleParts.push(new Date(a.last_status_change_at).toLocaleDateString());

    cards.push({
      id: `app:${a.id}`,
      columnId: a.status as ColumnId,
      title: name,
      subtitle: subtitleParts.join(" · "),
      href: `/candidates/${a.candidate_user_id}`,
      chatHref: chat?.id ? `/chats/${chat.id}` : undefined,
      avatarInitials: initialsFrom(
        a.users.first_name,
        a.users.last_name,
        a.users.email,
      ),
      kind: "application",
      applicationId: a.id,
    });
  }

  // --------- KPIs (respect selectedListingId) ---------
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const totalApplicants = apps.length;
  const newThisWeek = apps.filter(
    (a) => a.applied_at && a.applied_at >= weekAgo,
  ).length;
  const interviewingCount = apps.filter(
    (a) => a.status === "interviewing" || a.status === "shortlisted",
  ).length;
  const hiredCount = apps.filter((a) => a.status === "hired").length;

  const { tier: currentTier } = await getTenantSubscription(tenantId);

  // --------- Company profile completion ---------
  const { data: clientProfile } = await supabase
    .from("client_profiles")
    .select(
      "about, hiring_pitch, website_url, industry_slug, headcount, founded_year, visibility, logo_url",
    )
    .eq("tenant_id", tenantId)
    .maybeSingle();
  const { data: intents } = await supabase
    .from("tenant_hiring_intents")
    .select("sales_role")
    .eq("tenant_id", tenantId)
    .eq("status", "active");
  const completion = computeCompanyCompletion({
    ...(clientProfile ?? {}),
    tenant_name: tenantName,
    hiring_intent_count: intents?.length ?? 0,
  });

  const kpiSubtitle = selected
    ? `Filtered to "${selected.title}"`
    : "Across all listings";

  // --------- Quick start steps ---------
  const quickStartSteps: QuickStartStep[] = [
    {
      key: "company_profile",
      done: completion.percent >= 60,
      title: "Complete your company profile",
      description:
        "Reps skip companies with no context. Two minutes gets you a real About + logo.",
      ctaLabel: "Edit company",
      ctaHref: "/company/edit",
    },
    {
      key: "first_listing",
      done: listings.length > 0,
      title: "Post your first listing",
      description:
        "Draft one in about 60 seconds with the AI writer. Attracts the right reps.",
      ctaLabel: "New listing",
      ctaHref: "/company/listings/new",
    },
    {
      key: "candidates",
      done: apps.length > 0,
      title: "Browse candidates",
      description:
        "Invite anyone who fits — they get an email and an in-app notification.",
      ctaLabel: "Browse talent",
      ctaHref: "/candidates",
    },
  ];

  return (
    <main className="flex-1 p-4 md:p-6 max-w-[1400px] mx-auto w-full">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold mb-1">
            Welcome{firstName ? `, ${firstName}` : ""}.
          </h1>
          <p className="text-sm text-light-grey">
            {tenantName} · {kpiSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <ListingFilter listings={listings} selectedId={selectedListingId} />
          <Link
            href="/company/listings/new"
            className="inline-flex items-center gap-1.5 rounded bg-primary text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <ClipboardDocumentListIcon className="h-4 w-4" />
            New listing
          </Link>
          <PlanBadge currentTier={currentTier} />
        </div>
      </div>

      <PremiumFeaturesCallout tier={currentTier} />

      <QuickStartCard
        steps={quickStartSteps}
        headline={`Welcome to RemoteRep${firstName ? `, ${firstName}` : ""}`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Metric
          icon={<UserGroupIcon className="h-4 w-4" />}
          label="Total applicants"
          value={totalApplicants}
        />
        <Metric
          icon={<EnvelopeIcon className="h-4 w-4" />}
          label="New this week"
          value={newThisWeek}
        />
        <Metric
          icon={<UserGroupIcon className="h-4 w-4" />}
          label="In pipeline"
          value={interviewingCount}
          hint="Interviewing + Shortlisted"
        />
        <Metric
          icon={<CheckBadgeIcon className="h-4 w-4 text-success" />}
          label="Hired"
          value={hiredCount}
        />
      </div>

      {/* Kanban + right rail */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey">
              Applicant tracking
            </h2>
            <ClosedToggle showClosed={showClosed} />
          </div>
          <Kanban cards={cards} viewerRole="hiring" showClosed={showClosed} />
          <p className="text-[11px] text-light-grey mt-3 italic">
            Tip: drag a bookmarked candidate to <b>Invited</b> to send an
            invitation.
          </p>
        </div>

        <aside className="rounded-2xl border border-border bg-surface-2 p-4 h-fit">
          <h2 className="text-sm font-semibold text-light-grey uppercase tracking-wider mb-3">
            Company profile
          </h2>
          <div className="mb-4">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-3xl font-semibold">
                {completion.percent}%
              </span>
              <span className="text-xs text-light-grey">
                {completion.completedCount} of {completion.totalFields}
              </span>
            </div>
            <div className="h-2 bg-surface-3 rounded overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${completion.percent}%` }}
              />
            </div>
          </div>
          <ul className="text-xs space-y-1.5 mb-4">
            {completion.fields.map((f) => (
              <li key={f.key} className="flex items-center gap-2">
                <span
                  className={
                    f.done
                      ? "h-4 w-4 rounded-full bg-primary text-white flex items-center justify-center text-[10px]"
                      : "h-4 w-4 rounded-full border border-border flex items-center justify-center text-[10px] text-light-grey"
                  }
                >
                  {f.done ? "✓" : ""}
                </span>
                <span className={f.done ? "text-light-grey line-through" : ""}>
                  {f.label}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/company/edit"
            className="block text-center rounded bg-primary text-white px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {completion.percent === 100 ? "Edit company" : "Complete profile →"}
          </Link>
        </aside>
      </div>
    </main>
  );
}

function initialsFrom(
  first: string | null | undefined,
  last: string | null | undefined,
  email: string | null | undefined,
): string {
  const f = first?.trim()?.[0] ?? "";
  const l = last?.trim()?.[0] ?? "";
  const combined = `${f}${l}`.toUpperCase();
  if (combined) return combined;
  return (email?.[0] ?? "?").toUpperCase();
}

function Metric({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-3">
      <div className="flex items-center gap-1.5 text-xs text-light-grey uppercase tracking-wider mb-1">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="text-[11px] text-light-grey mt-0.5">{hint}</div>}
    </div>
  );
}
