import Link from "next/link";
import { redirect } from "next/navigation";
import {
  EyeIcon,
  BookmarkIcon,
  EnvelopeIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";
import {
  computeProfileCompletion,
  type CandidateProfileForCompletion,
} from "@/lib/profile-completion";

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
          value={0}
          comparison="Coming soon"
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
            <p className="text-sm text-light-grey italic">
              No companies have engaged with your profile yet. Once they do, the
              opportunities that viewed / bookmarked / invited you will appear
              here.
            </p>
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
// Hiring dashboard (unchanged from before, minor visual tune-up)
// ============================================================
async function HiringDashboard({
  tenantName,
  tenantId,
  firstName,
}: {
  tenantName: string;
  tenantId: string;
  firstName: string | null | undefined;
  justSaved: boolean;
}) {
  const supabase = await createClient();
  const { data: intents } = await supabase
    .from("tenant_hiring_intents")
    .select("sales_role")
    .eq("tenant_id", tenantId)
    .eq("status", "active");

  return (
    <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
      <h1 className="text-2xl font-semibold mb-1">
        Welcome{firstName ? `, ${firstName}` : ""}.
      </h1>
      <p className="text-sm text-light-grey mb-6">{tenantName}</p>

      <section className="mb-6 rounded border border-zinc-200 dark:border-zinc-800 p-4">
        <h2 className="text-sm font-semibold text-light-grey uppercase tracking-wider mb-3">
          Your hiring
        </h2>
        <p className="text-sm mb-3">
          You&apos;re currently hiring for:{" "}
          {intents && intents.length > 0 ? (
            intents.map((i, idx) => (
              <span key={i.sales_role}>
                <strong>{i.sales_role}</strong>
                {idx < intents.length - 1 ? ", " : ""}
              </span>
            ))
          ) : (
            <em className="text-light-grey">(none set)</em>
          )}
        </p>
        <Link
          href="/candidates"
          className="inline-block rounded bg-primary text-white px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Browse candidates →
        </Link>
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
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  comparison: string;
}) {
  return (
    <div className="rounded border border-zinc-200 dark:border-zinc-800 p-3">
      <div className="flex items-center gap-1.5 text-xs text-light-grey uppercase tracking-wider mb-1">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-light-grey mt-0.5">{comparison}</div>
    </div>
  );
}
