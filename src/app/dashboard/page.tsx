import Link from "next/link";
import { redirect } from "next/navigation";
import {
  EyeIcon,
  BookmarkIcon,
  EnvelopeIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";
import {
  computeProfileCompletion,
  type CandidateProfileForCompletion,
} from "@/lib/profile-completion";
import { computeCompanyCompletion } from "@/lib/company-completion";
import { respondToInvitation } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ saved?: string }>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const justSaved = params.saved === "1";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("tenant_members")
    .select("tenant_id, role, status, tenants!inner(id, name, type, slug)")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (!memberships || memberships.length === 0) {
    redirect("/onboarding/choose-role");
  }

  type Membership = {
    tenant_id: string;
    role: string;
    tenants: { id: string; name: string; type: string; slug: string };
  };
  const m = memberships[0] as unknown as Membership;

  const isHiring =
    m.tenants.type === "client_company" || m.tenants.type === "agency";

  const { data: profile } = await supabase
    .from("users")
    .select("first_name, last_name, status, created_at")
    .eq("id", user.id)
    .single();

  if (isHiring) {
    return <HiringDashboard tenantName={m.tenants.name} tenantId={m.tenant_id} firstName={profile?.first_name} justSaved={justSaved} />;
  }

  return <CandidateDashboard userId={user.id} tenantName={m.tenants.name} firstName={profile?.first_name} justSaved={justSaved} />;
}

// ============================================================
// Candidate dashboard
// ============================================================
async function CandidateDashboard({
  userId,
  firstName,
  justSaved,
}: {
  userId: string;
  tenantName: string;
  firstName: string | null | undefined;
  justSaved: boolean;
}) {
  const supabase = await createClient();

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
  const specialties = (specialtiesData ?? []).map((s) => s.sales_role as string);

  const { count: bookmarkCount } = await supabase
    .from("bookmarks")
    .select("id", { count: "exact", head: true })
    .eq("owner_user_id", userId)
    .eq("target_type", "listing");

  // Applications where this candidate is the recipient — include recent responded
  // ones too so the candidate can see history, not just pending.
  const { data: invitations } = await supabase
    .from("applications")
    .select(
      "id, tenant_id, status, message, applied_at, last_status_change_at, tenants!inner(name)",
    )
    .eq("candidate_user_id", userId)
    .in("status", ["invited", "interviewing"])
    .order("last_status_change_at", { ascending: false })
    .limit(10);

  type InvitationRow = {
    id: string;
    tenant_id: string;
    status: "invited" | "interviewing";
    message: string | null;
    applied_at: string;
    last_status_change_at: string;
    tenants: { name: string };
  };
  const recentInvitations = (invitations ?? []) as unknown as InvitationRow[];
  const pendingInvitations = recentInvitations.filter((i) => i.status === "invited");
  const invitationCount = pendingInvitations.length;

  const completion = computeProfileCompletion({
    ...(candidateProfile as CandidateProfileForCompletion | null),
    specialties,
  });

  return (
    <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">
          Welcome{firstName ? `, ${firstName}` : ""}.
        </h1>
        <p className="text-sm text-light-grey">
          Here&apos;s how you&apos;re landing with hiring companies.
        </p>
      </div>

      {justSaved && (
        <div
          role="status"
          className="mb-4 rounded border border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-900 p-3 text-sm text-green-800 dark:text-green-200"
        >
          ✅ Profile saved.
        </div>
      )}

      {/* Metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard
          icon={<EyeIcon className="h-4 w-4" />}
          label="Profile views"
          value={0}
          comparison="Coming soon"
        />
        <MetricCard
          icon={<EnvelopeIcon className="h-4 w-4" />}
          label="Companies interested"
          value={invitationCount ?? 0}
          comparison={
            (invitationCount ?? 0) > 0
              ? "Reply to keep momentum"
              : "Complete your profile to get discovered"
          }
        />
        <MetricCard
          icon={<BookmarkIcon className="h-4 w-4" />}
          label="Opportunities bookmarked"
          value={bookmarkCount ?? 0}
          comparison={
            (bookmarkCount ?? 0) > 0
              ? "Great — active engagement"
              : "Bookmark a few to get started"
          }
        />
        <MetricCard
          icon={<ChartBarIcon className="h-4 w-4" />}
          label="Engagement rank"
          value="—"
          comparison="Ranks unlock at 100 profile views"
        />
      </div>

      {/* Two-column layout: left = engagement + suggestions, right = profile completion */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          {/* Engagement */}
          <section className="rounded border border-zinc-200 dark:border-zinc-800 p-4">
            <h2 className="text-sm font-semibold text-light-grey uppercase tracking-wider mb-3">
              Recent engagement
            </h2>
            {recentInvitations.length === 0 ? (
              <p className="text-sm text-light-grey italic">
                No companies have engaged with your profile yet. Once one
                invites you, they&apos;ll appear here.
              </p>
            ) : (
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {recentInvitations.map((inv) => (
                  <li key={inv.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="font-semibold text-sm">
                        {inv.tenants.name}
                      </span>
                      <span className="text-xs text-light-grey">
                        {new Date(
                          inv.last_status_change_at ?? inv.applied_at,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-light-grey mb-2">
                      {inv.status === "invited" ? (
                        <>
                          <span className="inline-block text-[10px] bg-invited/10 text-invited rounded px-1.5 py-0.5 font-semibold mr-1">
                            Invited
                          </span>
                          {inv.message
                            ? `"${inv.message}"`
                            : "wants to talk with you about a role."}
                        </>
                      ) : (
                        <>
                          <span className="inline-block text-[10px] bg-interviewing/10 text-interviewing rounded px-1.5 py-0.5 font-semibold mr-1">
                            Interviewing
                          </span>
                          You said yes — company will reach out to schedule.
                        </>
                      )}
                    </p>
                    {inv.status === "invited" && (
                      <div className="flex gap-2">
                        <form action={respondToInvitation} className="contents">
                          <input
                            type="hidden"
                            name="application_id"
                            value={inv.id}
                          />
                          <input
                            type="hidden"
                            name="response"
                            value="interested"
                          />
                          <button
                            type="submit"
                            className="text-xs rounded bg-primary text-white px-3 py-1.5 font-medium hover:opacity-90 transition-opacity"
                          >
                            I&apos;m interested
                          </button>
                        </form>
                        <form action={respondToInvitation} className="contents">
                          <input
                            type="hidden"
                            name="application_id"
                            value={inv.id}
                          />
                          <input
                            type="hidden"
                            name="response"
                            value="not_interested"
                          />
                          <button
                            type="submit"
                            className="text-xs rounded border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          >
                            Not now
                          </button>
                        </form>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Suggestions */}
          <section className="rounded border border-zinc-200 dark:border-zinc-800 p-4">
            <h2 className="text-sm font-semibold text-light-grey uppercase tracking-wider mb-3">
              Suggestions to improve your ranking
            </h2>
            {completion.suggestions.length === 0 ? (
              <p className="text-sm text-light-grey italic">
                Nothing pressing — your profile is in great shape.
              </p>
            ) : (
              <ul className="space-y-2">
                {completion.suggestions.map((s, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-xs bg-secondary/20 text-dark-foreground dark:text-secondary rounded px-1.5 py-0.5 mt-0.5 shrink-0">
                      +{s.impactPct}%
                    </span>
                    <span>{s.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Right column: profile completion wizard */}
        <aside className="rounded border border-zinc-200 dark:border-zinc-800 p-4 h-fit">
          <h2 className="text-sm font-semibold text-light-grey uppercase tracking-wider mb-3">
            Profile completion
          </h2>

          <div className="mb-4">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-3xl font-semibold">{completion.percent}%</span>
              <span className="text-xs text-light-grey">
                {completion.completedCount} of {completion.totalFields} sections
              </span>
            </div>
            <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded overflow-hidden">
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
                      : "h-4 w-4 rounded-full border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[10px] text-light-grey"
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

      {/* Roles you specialize in */}
      <section className="mt-6 rounded border border-zinc-200 dark:border-zinc-800 p-4">
        <h2 className="text-sm font-semibold text-light-grey uppercase tracking-wider mb-2">
          Your specialty roles
        </h2>
        {specialties.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {specialties.map((r) => (
              <span
                key={r}
                className="text-xs bg-primary/10 text-primary rounded px-2 py-0.5 font-semibold"
              >
                {r}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-light-grey italic">
            None yet — add some in{" "}
            <Link href="/profile/edit" className="underline">
              your profile
            </Link>
            .
          </p>
        )}
      </section>
    </main>
  );
}

// ============================================================
// Hiring dashboard — mirror of the candidate one
// ============================================================
async function HiringDashboard({
  tenantName,
  tenantId,
  firstName,
  justSaved,
}: {
  tenantName: string;
  tenantId: string;
  firstName: string | null | undefined;
  justSaved: boolean;
}) {
  const supabase = await createClient();

  const [
    { data: intents },
    { data: clientProfile },
    { data: allApps },
    { count: liveListingCount },
  ] = await Promise.all([
    supabase
      .from("tenant_hiring_intents")
      .select("sales_role")
      .eq("tenant_id", tenantId)
      .eq("status", "active"),
    supabase
      .from("client_profiles")
      .select(
        "about, hiring_pitch, website_url, industry_slug, headcount, founded_year, visibility, logo_url",
      )
      .eq("tenant_id", tenantId)
      .maybeSingle(),
    supabase
      .from("applications")
      .select(
        "id, candidate_user_id, applied_at, last_status_change_at, status, users!inner(first_name, last_name)",
      )
      .eq("tenant_id", tenantId)
      .in("status", ["invited", "interviewing", "withdrawn"])
      .order("last_status_change_at", { ascending: false })
      .limit(20),
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "published"),
  ]);

  type InviteRow = {
    id: string;
    candidate_user_id: string;
    applied_at: string;
    last_status_change_at: string;
    status: "invited" | "interviewing" | "withdrawn";
    users: { first_name: string | null; last_name: string | null };
  };
  const invites = (allApps ?? []) as unknown as InviteRow[];
  const invitedCount = invites.filter((i) => i.status === "invited").length;
  const interviewingCount = invites.filter((i) => i.status === "interviewing").length;
  const recentInvites = invites.slice(0, 6);

  const completion = computeCompanyCompletion({
    ...(clientProfile ?? {}),
    tenant_name: tenantName,
    hiring_intent_count: intents?.length ?? 0,
  });

  return (
    <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">
          Welcome{firstName ? `, ${firstName}` : ""}.
        </h1>
        <p className="text-sm text-light-grey">
          {tenantName} · here&apos;s how your hiring is going.
        </p>
      </div>

      {justSaved && (
        <div
          role="status"
          className="mb-4 rounded border border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-900 p-3 text-sm text-green-800 dark:text-green-200"
        >
          ✅ Saved.
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard
          icon={<EyeIcon className="h-4 w-4" />}
          label="Candidates viewed"
          value={0}
          comparison="Coming soon"
        />
        <MetricCard
          icon={<EnvelopeIcon className="h-4 w-4" />}
          label="Invitations sent"
          value={invitedCount + interviewingCount}
          comparison={
            invitedCount + interviewingCount > 0
              ? "Good — active outreach"
              : "Browse candidates and invite"
          }
        />
        <MetricCard
          icon={<BookmarkIcon className="h-4 w-4" />}
          label="Interested"
          value={interviewingCount}
          comparison={
            interviewingCount > 0
              ? "Reach out to schedule"
              : "Waiting on candidate replies"
          }
        />
        <MetricCard
          icon={<ClipboardDocumentListIcon className="h-4 w-4" />}
          label="Live listings"
          value={liveListingCount ?? 0}
          comparison={
            (liveListingCount ?? 0) > 0
              ? "Manage listings →"
              : "Post your first role →"
          }
          href="/company/listings"
        />
      </div>

      {/* Two columns: activity + suggestions | completion wizard */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          {/* Recent activity */}
          <section className="rounded border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-sm font-semibold text-light-grey uppercase tracking-wider">
                Recent activity
              </h2>
              <Link
                href="/candidates"
                className="text-xs text-primary hover:opacity-80"
              >
                Browse candidates →
              </Link>
            </div>
            {recentInvites.length === 0 ? (
              <p className="text-sm text-light-grey italic">
                No candidates invited yet. Head to{" "}
                <Link href="/candidates" className="underline">
                  Browse candidates
                </Link>{" "}
                to reach out.
              </p>
            ) : (
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {recentInvites.map((inv) => {
                  const name =
                    inv.users.first_name || inv.users.last_name
                      ? `${inv.users.first_name ?? ""} ${inv.users.last_name ?? ""}`.trim()
                      : "Candidate";

                  const statusStyle =
                    inv.status === "interviewing"
                      ? "bg-interviewing/10 text-interviewing"
                      : inv.status === "withdrawn"
                        ? "bg-zinc-200 text-light-grey dark:bg-zinc-800"
                        : "bg-invited/10 text-invited";
                  const statusLabel =
                    inv.status === "interviewing"
                      ? "Interested"
                      : inv.status === "withdrawn"
                        ? "Passed"
                        : "Invited";
                  const detail =
                    inv.status === "interviewing"
                      ? "wants to talk — reach out to schedule"
                      : inv.status === "withdrawn"
                        ? "not looking right now"
                        : "awaiting reply";
                  return (
                    <li key={inv.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <span className="font-semibold text-sm">{name}</span>
                        <span className="text-xs text-light-grey">
                          {new Date(
                            inv.last_status_change_at ?? inv.applied_at,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-light-grey">
                        <span
                          className={`inline-block text-[10px] rounded px-1.5 py-0.5 font-semibold mr-1 ${statusStyle}`}
                        >
                          {statusLabel}
                        </span>
                        {detail}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Suggestions */}
          <section className="rounded border border-zinc-200 dark:border-zinc-800 p-4">
            <h2 className="text-sm font-semibold text-light-grey uppercase tracking-wider mb-3">
              Suggestions to improve your response rate
            </h2>
            {completion.suggestions.length === 0 ? (
              <p className="text-sm text-light-grey italic">
                Nothing pressing — your company profile is in great shape.
              </p>
            ) : (
              <ul className="space-y-2">
                {completion.suggestions.map((s, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-xs bg-secondary/20 text-dark-foreground dark:text-secondary rounded px-1.5 py-0.5 mt-0.5 shrink-0">
                      +{s.impactPct}%
                    </span>
                    <span>{s.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Right: company profile completion wizard */}
        <aside className="rounded border border-zinc-200 dark:border-zinc-800 p-4 h-fit">
          <h2 className="text-sm font-semibold text-light-grey uppercase tracking-wider mb-3">
            Company profile
          </h2>

          <div className="mb-4">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-3xl font-semibold">{completion.percent}%</span>
              <span className="text-xs text-light-grey">
                {completion.completedCount} of {completion.totalFields} sections
              </span>
            </div>
            <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded overflow-hidden">
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
                      : "h-4 w-4 rounded-full border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[10px] text-light-grey"
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

      {/* Bottom: hiring roles */}
      <section className="mt-6 rounded border border-zinc-200 dark:border-zinc-800 p-4">
        <h2 className="text-sm font-semibold text-light-grey uppercase tracking-wider mb-2">
          Roles you&apos;re hiring for
        </h2>
        {intents && intents.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {intents.map((i) => (
              <span
                key={i.sales_role}
                className="text-xs bg-primary/10 text-primary rounded px-2 py-0.5 font-semibold"
              >
                {i.sales_role}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-light-grey italic">
            None active. Add hiring roles in your company settings.
          </p>
        )}
      </section>
    </main>
  );
}

// ============================================================
// Small components
// ============================================================
function MetricCard({
  icon,
  label,
  value,
  comparison,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  comparison: string;
  href?: string;
}) {
  const inner = (
    <>
      <div className="flex items-center gap-1.5 text-xs text-light-grey uppercase tracking-wider mb-1">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className={`text-xs mt-0.5 ${href ? "text-primary" : "text-light-grey"}`}>
        {comparison}
      </div>
    </>
  );
  const cls =
    "block rounded border border-zinc-200 dark:border-zinc-800 p-3 transition-colors";
  if (href) {
    return (
      <Link
        href={href}
        className={`${cls} hover:border-primary/40 hover:bg-primary/[0.03]`}
      >
        {inner}
      </Link>
    );
  }
  return <div className={cls}>{inner}</div>;
}
