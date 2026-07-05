import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  BookmarkIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  EnvelopeIcon,
  CheckBadgeIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/is-platform-admin";
import { bucketCounts, parseRangeFromSearchParams } from "@/lib/analytics";
import { SignupsChart } from "../../analytics/Charts";
import { CompactFilters } from "../../analytics/CompactFilters";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  if (!currentUser) redirect("/login");
  const admin = await isPlatformAdmin();
  if (!admin) redirect("/dashboard");

  const sp = await searchParams;
  const range = parseRangeFromSearchParams(sp);

  const [
    { data: userRow },
    { data: memberships },
    { data: candidateProfile },
    { data: candidateSpecialties },
    { data: candidateGoals },
    { data: myBookmarks },
    { data: myApplications },
    { data: myChatParts },
    { data: myEvents },
    { data: eventsAboutMe },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, first_name, last_name, email, status, created_at")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("tenant_members")
      .select(
        "tenant_id, role, status, joined_at, tenants!inner(name, type, slug)",
      )
      .eq("user_id", id),
    supabase
      .from("candidate_profiles")
      .select(
        "headline, about, visibility, years_of_experience, onboarding_completed_at, created_at",
      )
      .eq("user_id", id)
      .maybeSingle(),
    supabase
      .from("candidate_specialties")
      .select("sales_role")
      .eq("user_id", id),
    supabase
      .from("candidate_goals")
      .select("minimum_compensation, sales_roles")
      .eq("user_id", id)
      .maybeSingle(),
    supabase
      .from("bookmarks")
      .select("id, created_at, target_type")
      .eq("owner_user_id", id),
    supabase
      .from("applications")
      .select(
        "id, listing_id, status, applied_at, last_status_change_at, created_at",
      )
      .eq("candidate_user_id", id),
    supabase.from("chat_participants").select("chat_id").eq("user_id", id),
    supabase
      .from("events")
      .select("id, event_type, entity_type, entity_id, created_at, payload")
      .eq("actor_user_id", id)
      .gte("created_at", `${range.since}T00:00:00Z`)
      .lte("created_at", `${range.until}T23:59:59Z`)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("events")
      .select("id, event_type, entity_type, created_at")
      .eq("entity_type", "user")
      .eq("entity_id", id)
      .gte("created_at", `${range.since}T00:00:00Z`)
      .lte("created_at", `${range.until}T23:59:59Z`)
      .limit(500),
  ]);

  if (!userRow) notFound();

  type Membership = {
    tenant_id: string;
    role: string;
    status: string;
    joined_at: string | null;
    tenants: { name: string; type: string; slug: string };
  };
  const mems = (memberships ?? []) as unknown as Membership[];

  const isCandidate = !!candidateProfile;
  const hiringMems = mems.filter(
    (m) => m.tenants.type === "client_company" || m.tenants.type === "agency",
  );
  const isHiring = hiringMems.length > 0;

  const bookmarks = myBookmarks ?? [];
  const applications = myApplications ?? [];
  const chats = myChatParts ?? [];
  const events = myEvents ?? [];

  // As a hiring user, count listings + invitations sent + hires
  let listingsPosted = 0;
  let invitationsSent = 0;
  let hiresMade = 0;
  if (isHiring) {
    const tenantIds = hiringMems.map((m) => m.tenant_id);
    if (tenantIds.length > 0) {
      const [{ count: l }, { count: i }, { count: h }] = await Promise.all([
        supabase
          .from("listings")
          .select("id", { count: "exact", head: true })
          .in("tenant_id", tenantIds)
          .eq("created_by_user_id", id),
        supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .in("tenant_id", tenantIds)
          .eq("status", "invited"),
        supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .in("tenant_id", tenantIds)
          .eq("status", "hired"),
      ]);
      listingsPosted = l ?? 0;
      invitationsSent = i ?? 0;
      hiresMade = h ?? 0;
    }
  }

  const activitySeries = bucketCounts(
    events as { created_at: string }[],
    range.bucket,
  );

  const displayName =
    userRow.first_name || userRow.last_name
      ? `${userRow.first_name ?? ""} ${userRow.last_name ?? ""}`.trim()
      : userRow.email;

  return (
    <main className="flex-1 w-full">
      <div className="mb-4">
        <Link
          href="/admin/users"
          className="text-xs text-light-grey hover:text-primary transition-colors inline-block"
        >
          ← All users
        </Link>
        <div className="flex items-start justify-between gap-4 mt-1 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">{displayName}</h1>
            <p className="text-sm text-light-grey">{userRow.email}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-[10px] rounded-full bg-primary/10 text-primary px-2 py-0.5 font-semibold">
                {isCandidate ? "Candidate" : ""}
                {isCandidate && isHiring ? " · " : ""}
                {isHiring ? "Hiring" : ""}
                {!isCandidate && !isHiring ? "User" : ""}
              </span>
              <span className="text-[10px] rounded-full bg-surface-3 px-2 py-0.5">
                Joined{" "}
                {new Date(userRow.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <CompactFilters />

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Kpi
          icon={<BookmarkIcon className="h-4 w-4" />}
          label="Bookmarks"
          value={bookmarks.length}
        />
        <Kpi
          icon={<EnvelopeIcon className="h-4 w-4" />}
          label="Applications"
          value={applications.length}
        />
        <Kpi
          icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
          label="Chats"
          value={chats.length}
        />
        <Kpi
          icon={<EyeIcon className="h-4 w-4" />}
          label="Actions logged"
          value={events.length}
        />
        {isHiring && (
          <>
            <Kpi
              icon={<ClipboardDocumentListIcon className="h-4 w-4" />}
              label="Listings posted"
              value={listingsPosted}
            />
            <Kpi
              icon={<EnvelopeIcon className="h-4 w-4" />}
              label="Invitations sent"
              value={invitationsSent}
            />
            <Kpi
              icon={<CheckBadgeIcon className="h-4 w-4" />}
              label="Hires"
              value={hiresMade}
            />
            <Kpi
              icon={<UserCircleIcon className="h-4 w-4" />}
              label="Views received"
              value={(eventsAboutMe ?? []).length}
            />
          </>
        )}
      </div>

      {/* Activity chart */}
      <section className="rounded-2xl border border-border bg-surface-2 p-5 mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
          Their activity over time
        </h2>
        {activitySeries.length === 0 ? (
          <p className="text-sm text-light-grey">
            No activity in the selected range.
          </p>
        ) : (
          <SignupsChart data={activitySeries} label="Actions" />
        )}
      </section>

      {/* Tenants + profile summary */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mb-6">
        <section className="rounded-2xl border border-border bg-surface-2 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
            Recent activity
          </h2>
          {events.length === 0 ? (
            <p className="text-sm text-light-grey">
              No actions logged in this range.
            </p>
          ) : (
            <ul className="text-sm divide-y divide-border max-h-96 overflow-y-auto">
              {events.slice(0, 100).map((e) => (
                <li key={e.id} className="py-2 flex items-baseline gap-2">
                  <span className="text-[10px] rounded bg-surface-3 px-1.5 py-0.5 font-mono shrink-0">
                    {e.event_type}
                  </span>
                  {e.entity_type && (
                    <span className="text-xs text-light-grey">
                      {e.entity_type}
                    </span>
                  )}
                  <span className="text-[11px] text-light-grey ml-auto shrink-0">
                    {new Date(e.created_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface-2 p-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-light-grey">
              Tenants + roles
            </h3>
            {mems.length === 0 ? (
              <p className="text-xs text-light-grey">
                Not a member of any tenant.
              </p>
            ) : (
              <ul className="text-xs space-y-2">
                {mems.map((m) => (
                  <li key={m.tenant_id}>
                    <div className="font-semibold">{m.tenants.name}</div>
                    <div className="text-light-grey">
                      {m.tenants.type} · {m.role} · {m.status}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {isCandidate && (
            <div className="rounded-2xl border border-border bg-surface-2 p-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-light-grey">
                Candidate profile
              </h3>
              <div className="text-xs space-y-1">
                <div>
                  <span className="text-light-grey">Visibility:</span>{" "}
                  <span className="font-semibold">
                    {candidateProfile?.visibility}
                  </span>
                </div>
                {candidateProfile?.years_of_experience != null && (
                  <div>
                    <span className="text-light-grey">Experience:</span>{" "}
                    <span className="font-semibold">
                      {candidateProfile.years_of_experience} yrs
                    </span>
                  </div>
                )}
                {(candidateSpecialties ?? []).length > 0 && (
                  <div>
                    <span className="text-light-grey">Specialties:</span>{" "}
                    <span className="font-semibold">
                      {(candidateSpecialties ?? [])
                        .map((s) => s.sales_role as string)
                        .join(", ")}
                    </span>
                  </div>
                )}
                {candidateGoals?.minimum_compensation != null && (
                  <div>
                    <span className="text-light-grey">Min comp:</span>{" "}
                    <span className="font-semibold">
                      ${candidateGoals.minimum_compensation.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
              <Link
                href={`/profiles/${id}`}
                className="text-xs text-primary hover:opacity-80 block mt-2"
              >
                View public profile →
              </Link>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function Kpi({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
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
    </div>
  );
}
