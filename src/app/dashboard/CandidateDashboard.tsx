import Link from "next/link";
import {
  PaperAirplaneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";
import {
  computeProfileCompletion,
  type CandidateProfileForCompletion,
} from "@/lib/profile-completion";
import { Kanban, type KanbanCardData, type ColumnId } from "./Kanban";
import { ClosedToggle } from "./ClosedToggle";

const KANBAN_STAGES: ColumnId[] = [
  "invited",
  "applied",
  "interviewing",
  "shortlisted",
  "hired",
  "rejected",
  "withdrawn",
];

export async function CandidateDashboard({
  userId,
  firstName,
  showClosed,
}: {
  userId: string;
  firstName: string | null | undefined;
  showClosed: boolean;
}) {
  const supabase = await createClient();

  // Applications this candidate is a part of.
  const { data: appsRaw } = await supabase
    .from("applications")
    .select(
      "id, status, listing_id, tenant_id, applied_at, last_status_change_at, tenants!inner(id, name), listings(id, title), chats(id)",
    )
    .eq("candidate_user_id", userId)
    .in("status", KANBAN_STAGES)
    .order("last_status_change_at", { ascending: false });

  type AppRow = {
    id: string;
    status: string;
    listing_id: string | null;
    tenant_id: string;
    applied_at: string | null;
    last_status_change_at: string;
    tenants: { id: string; name: string } | { id: string; name: string }[];
    listings:
      | { id: string; title: string }
      | { id: string; title: string }[]
      | null;
    chats: { id: string } | { id: string }[] | null;
  };
  const apps = (appsRaw ?? []) as unknown as AppRow[];

  // Listing bookmarks.
  const { data: bookmarksRaw } = await supabase
    .from("bookmarks")
    .select("id, target_id, created_at")
    .eq("owner_user_id", userId)
    .eq("target_type", "listing")
    .order("created_at", { ascending: false });
  type BookmarkRow = { id: string; target_id: string; created_at: string };
  const bookmarks = (bookmarksRaw ?? []) as BookmarkRow[];

  // Resolve the listings for those bookmarks (title + company name).
  const bookmarkListings = new Map<
    string,
    { title: string; tenant_name: string }
  >();
  if (bookmarks.length > 0) {
    const ids = bookmarks.map((b) => b.target_id);
    const { data: lRows } = await supabase
      .from("listings")
      .select("id, title, tenants!inner(name)")
      .in("id", ids);
    for (const row of (lRows ?? []) as unknown as Array<{
      id: string;
      title: string;
      tenants: { name: string } | { name: string }[];
    }>) {
      const t = Array.isArray(row.tenants) ? row.tenants[0] : row.tenants;
      bookmarkListings.set(row.id, {
        title: row.title,
        tenant_name: t?.name ?? "",
      });
    }
  }

  // ------ Kanban cards ------
  const cards: KanbanCardData[] = [];

  for (const bm of bookmarks) {
    const l = bookmarkListings.get(bm.target_id);
    if (!l) continue;
    cards.push({
      id: `bm:${bm.id}`,
      columnId: "bookmarked",
      title: l.title,
      subtitle: l.tenant_name,
      href: `/listings/${bm.target_id}`,
      kind: "bookmark_listing",
      bookmarkTargetId: bm.target_id,
    });
  }

  for (const a of apps) {
    const listing = Array.isArray(a.listings) ? a.listings[0] : a.listings;
    const tenant = Array.isArray(a.tenants) ? a.tenants[0] : a.tenants;
    const chat = Array.isArray(a.chats) ? a.chats[0] : a.chats;
    const title = listing?.title ?? "Direct invitation";
    cards.push({
      id: `app:${a.id}`,
      columnId: a.status as ColumnId,
      title,
      subtitle: `${tenant?.name ?? ""}${
        a.last_status_change_at
          ? ` · ${new Date(a.last_status_change_at).toLocaleDateString()}`
          : ""
      }`,
      href: listing?.id ? `/listings/${listing.id}` : undefined,
      chatHref: chat?.id ? `/chats/${chat.id}` : undefined,
      kind: "application",
      applicationId: a.id,
    });
  }

  // ---- KPIs ----
  const applicationsSent = apps.filter((a) => a.status !== "invited").length;
  const invitations = apps.filter((a) => a.status === "invited").length;
  const interviewing = apps.filter(
    (a) => a.status === "interviewing" || a.status === "shortlisted",
  ).length;
  const hires = apps.filter((a) => a.status === "hired").length;

  // ---- Profile completion ----
  const { data: candidateProfile } = await supabase
    .from("candidate_profiles")
    .select(
      "headline, about, visibility, years_of_experience, sales_types, decision_makers, sales_environments, deal_amounts, lead_types",
    )
    .eq("user_id", userId)
    .maybeSingle();
  const { data: specialtiesData } = await supabase
    .from("candidate_specialties")
    .select("sales_role")
    .eq("user_id", userId);
  const specialties = (specialtiesData ?? []).map(
    (s) => s.sales_role as string,
  );
  const completion = computeProfileCompletion({
    ...(candidateProfile as CandidateProfileForCompletion | null),
    specialties,
  });

  return (
    <main className="flex-1 p-4 md:p-6 max-w-[1400px] mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">
          Welcome{firstName ? `, ${firstName}` : ""}.
        </h1>
        <p className="text-sm text-light-grey">
          Track the roles you&apos;re pursuing and where each conversation
          stands.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Metric
          icon={<PaperAirplaneIcon className="h-4 w-4" />}
          label="Applications sent"
          value={applicationsSent}
        />
        <Metric
          icon={<EnvelopeIcon className="h-4 w-4" />}
          label="Invitations"
          value={invitations}
        />
        <Metric
          icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
          label="In pipeline"
          value={interviewing}
          hint="Interviewing + Shortlisted"
        />
        <Metric
          icon={<CheckBadgeIcon className="h-4 w-4 text-success" />}
          label="Hires"
          value={hires}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey">
              Your pipeline
            </h2>
            <ClosedToggle showClosed={showClosed} />
          </div>
          <Kanban
            cards={cards}
            viewerRole="candidate"
            showClosed={showClosed}
          />
          <p className="text-[11px] text-light-grey mt-3 italic">
            Tip: drag a bookmarked listing to <b>Applied</b> to send an
            application.
          </p>
        </div>

        <aside className="rounded-2xl border border-border bg-surface-2 p-4 h-fit">
          <h2 className="text-sm font-semibold text-light-grey uppercase tracking-wider mb-3">
            Profile completion
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
            href="/profile/edit"
            className="block text-center rounded bg-primary text-white px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {completion.percent === 100 ? "Edit profile" : "Complete profile →"}
          </Link>
        </aside>
      </div>
    </main>
  );
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
