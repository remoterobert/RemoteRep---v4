import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  UserGroupIcon,
  BookmarkIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-zinc-100 dark:bg-white/10 text-dark-foreground dark:text-white",
  published: "bg-success/15 text-success ring-1 ring-success/30",
  pending_payment: "bg-warning/15 text-warning ring-1 ring-warning/30",
  paused: "bg-warning/15 text-warning ring-1 ring-warning/30",
  archived: "bg-zinc-200 dark:bg-white/[0.06] text-light-grey",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  published: "Live",
  pending_payment: "Pending payment",
  paused: "Paused",
  archived: "Archived",
};

const APP_STATUS_STYLES: Record<string, string> = {
  invited: "bg-invited/10 text-invited",
  applied: "bg-primary/10 text-primary",
  interviewing: "bg-interviewing/10 text-interviewing",
  shortlisted: "bg-secondary/20 text-dark-foreground dark:text-secondary",
  hired: "bg-success/15 text-success",
  rejected: "bg-danger/10 text-danger",
  withdrawn: "bg-zinc-200 dark:bg-white/[0.06] text-light-grey",
  bookmarked: "bg-zinc-100 dark:bg-white/[0.06] text-light-grey",
};

const APP_STATUS_LABEL: Record<string, string> = {
  invited: "Invited",
  applied: "Applied",
  interviewing: "Interested",
  shortlisted: "Shortlisted",
  hired: "Hired",
  rejected: "Rejected",
  withdrawn: "Passed",
  bookmarked: "Bookmarked",
};

export default async function CompanyListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", [
      "client_admin",
      "client_member",
      "agency_admin",
      "agency_member",
    ])
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/dashboard");

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, tenant_id, title, description, instructions, calendar_link, status, visibility, published_at, created_at, listing_details(*), listing_requirements(*)",
    )
    .eq("id", id)
    .eq("tenant_id", membership.tenant_id)
    .maybeSingle();

  if (!listing) notFound();

  type ListingRow = {
    id: string;
    tenant_id: string;
    title: string;
    description: string;
    instructions: string | null;
    calendar_link: string | null;
    status: string;
    visibility: string;
    published_at: string | null;
    created_at: string;
    listing_details:
      | {
          sales_role: string | null;
          commitment: string[] | null;
          benefits: string[] | null;
          compensation_type: string[] | null;
          minimum_compensation: number | null;
          compensation_details: string | null;
        }
      | Array<{
          sales_role: string | null;
          commitment: string[] | null;
          benefits: string[] | null;
          compensation_type: string[] | null;
          minimum_compensation: number | null;
          compensation_details: string | null;
        }>
      | null;
    listing_requirements:
      | {
          education: string[] | null;
          years_of_experience_min: number | null;
          industries: string[] | null;
          sales_roles: string[] | null;
          sales_types: string[] | null;
          decision_makers: string[] | null;
          sales_environments: string[] | null;
          sales_cycles: string[] | null;
          deal_amounts: string[] | null;
          sales_volumes: string[] | null;
          lead_types: string[] | null;
          technologies: string[] | null;
        }
      | Array<{
          education: string[] | null;
          years_of_experience_min: number | null;
          industries: string[] | null;
          sales_roles: string[] | null;
          sales_types: string[] | null;
          decision_makers: string[] | null;
          sales_environments: string[] | null;
          sales_cycles: string[] | null;
          deal_amounts: string[] | null;
          sales_volumes: string[] | null;
          lead_types: string[] | null;
          technologies: string[] | null;
        }>
      | null;
  };
  const l = listing as unknown as ListingRow;
  const details = Array.isArray(l.listing_details)
    ? l.listing_details[0]
    : l.listing_details;
  const reqs = Array.isArray(l.listing_requirements)
    ? l.listing_requirements[0]
    : l.listing_requirements;

  // Fetch engagement + applicants in parallel.
  const [appsRes, bookmarksRes, viewsRes] = await Promise.all([
    supabase
      .from("applications")
      .select(
        "id, candidate_user_id, status, applied_at, last_status_change_at, message, users!inner(first_name, last_name, email)",
      )
      .eq("listing_id", l.id)
      .order("last_status_change_at", { ascending: false })
      .limit(50),
    supabase
      .from("bookmarks")
      .select("id", { count: "exact", head: true })
      .eq("target_type", "listing")
      .eq("target_id", l.id),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "listing.viewed")
      .eq("entity_id", l.id),
  ]);

  type AppRow = {
    id: string;
    candidate_user_id: string;
    status: string;
    applied_at: string | null;
    last_status_change_at: string;
    message: string | null;
    users: {
      first_name: string | null;
      last_name: string | null;
      email: string;
    };
  };
  const apps = (appsRes.data ?? []) as unknown as AppRow[];
  const bookmarksCount = bookmarksRes.count ?? 0;
  const viewsCount = viewsRes.count ?? 0;

  const interestedCount = apps.filter((a) =>
    ["interviewing", "applied", "shortlisted", "hired"].includes(a.status),
  ).length;
  const totalApplicants = apps.filter((a) => a.status !== "withdrawn").length;

  const statusCls = STATUS_STYLES[l.status] ?? STATUS_STYLES.draft;
  const statusLabel = STATUS_LABEL[l.status] ?? l.status;

  return (
    <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
      <Link
        href="/company/listings"
        className="text-xs text-light-grey hover:text-primary transition-colors mb-3 inline-block"
      >
        ← All listings
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold truncate">{l.title}</h1>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusCls}`}
            >
              {statusLabel}
            </span>
          </div>
          <p className="text-sm text-light-grey">
            Created{" "}
            {new Date(l.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            {l.published_at &&
              ` · published ${new Date(l.published_at).toLocaleDateString(
                undefined,
                { month: "short", day: "numeric" },
              )}`}
          </p>
        </div>
        <Link
          href={`/company/listings/${l.id}/edit`}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm font-medium hover:bg-surface-3 transition-colors"
        >
          <PencilSquareIcon className="h-4 w-4" />
          Edit
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Metric
          icon={<EyeIcon className="h-4 w-4" />}
          label="Views"
          value={viewsCount}
        />
        <Metric
          icon={<UserGroupIcon className="h-4 w-4" />}
          label="Applicants"
          value={totalApplicants}
        />
        <Metric
          icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
          label="Interested"
          value={interestedCount}
        />
        <Metric
          icon={<BookmarkIcon className="h-4 w-4" />}
          label="Bookmarks"
          value={bookmarksCount}
        />
      </div>

      {/* Two-column: applicants | details */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
          <section className="rounded-xl border border-zinc-200 dark:border-white/[0.06] p-5">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey">
                Applicants
              </h2>
              <span className="text-xs text-light-grey">
                {apps.length} total
              </span>
            </div>
            {apps.length === 0 ? (
              <p className="text-sm text-light-grey italic">
                Nobody yet. Once reps engage, they show up here.
              </p>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-white/[0.04]">
                {apps.map((a) => {
                  const name =
                    a.users.first_name || a.users.last_name
                      ? `${a.users.first_name ?? ""} ${a.users.last_name ?? ""}`.trim()
                      : a.users.email;
                  const statusCls =
                    APP_STATUS_STYLES[a.status] ??
                    APP_STATUS_STYLES.bookmarked;
                  const statusLbl = APP_STATUS_LABEL[a.status] ?? a.status;
                  const when = new Date(
                    a.last_status_change_at,
                  ).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  });
                  return (
                    <li
                      key={a.id}
                      className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold">{name}</span>
                          <span
                            className={`inline-block text-[10px] rounded px-1.5 py-0.5 font-semibold ${statusCls}`}
                          >
                            {statusLbl}
                          </span>
                        </div>
                        {a.message && (
                          <p className="text-xs text-light-grey mt-0.5 line-clamp-2">
                            {a.message}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-light-grey shrink-0">
                        {when}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-zinc-200 dark:border-white/[0.06] p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
              Description
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {l.description}
            </p>
          </section>

          {l.instructions && (
            <section className="rounded-xl border border-zinc-200 dark:border-white/[0.06] p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
                Application instructions
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {l.instructions}
              </p>
              {l.calendar_link && (
                <a
                  href={l.calendar_link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-sm text-primary hover:opacity-80 mt-3"
                >
                  Calendar link →
                </a>
              )}
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <DetailCard title="Role details">
            <Kv label="Sales role" value={details?.sales_role ?? "—"} />
            {details?.commitment && details.commitment.length > 0 && (
              <Chips label="Commitment" values={details.commitment} />
            )}
            {details?.compensation_type &&
              details.compensation_type.length > 0 && (
                <Chips
                  label="Compensation type"
                  values={details.compensation_type}
                />
              )}
            {details?.minimum_compensation != null && (
              <Kv
                label="Minimum comp"
                value={`$${details.minimum_compensation.toLocaleString()}+`}
              />
            )}
            {details?.compensation_details && (
              <div>
                <div className="text-[11px] uppercase tracking-wider text-light-grey mb-1">
                  Comp details
                </div>
                <p className="text-xs whitespace-pre-wrap">
                  {details.compensation_details}
                </p>
              </div>
            )}
            {details?.benefits && details.benefits.length > 0 && (
              <Chips label="Benefits" values={details.benefits} />
            )}
          </DetailCard>

          <DetailCard title="Requirements">
            <Kv
              label="Min. experience"
              value={
                reqs?.years_of_experience_min
                  ? `${reqs.years_of_experience_min}+ yrs`
                  : "None"
              }
            />
            {reqs?.education && reqs.education.length > 0 && (
              <Chips label="Education" values={reqs.education} />
            )}
            {reqs?.sales_types && reqs.sales_types.length > 0 && (
              <Chips label="Sales types" values={reqs.sales_types} />
            )}
            {reqs?.sales_cycles && reqs.sales_cycles.length > 0 && (
              <Chips label="Sales cycles" values={reqs.sales_cycles} />
            )}
            {reqs?.deal_amounts && reqs.deal_amounts.length > 0 && (
              <Chips label="Deal size" values={reqs.deal_amounts} />
            )}
            {reqs?.sales_volumes && reqs.sales_volumes.length > 0 && (
              <Chips label="Annual volume" values={reqs.sales_volumes} />
            )}
            {reqs?.lead_types && reqs.lead_types.length > 0 && (
              <Chips label="Leads" values={reqs.lead_types} />
            )}
            {reqs?.technologies && reqs.technologies.length > 0 && (
              <Chips label="Tools" values={reqs.technologies} />
            )}
            {reqs?.industries && reqs.industries.length > 0 && (
              <Chips label="Industries" values={reqs.industries} />
            )}
          </DetailCard>
        </aside>
      </div>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-white/[0.06] p-4">
      <div className="flex items-center gap-1.5 text-xs text-light-grey uppercase tracking-wider mb-1">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-white/[0.06] p-4 space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-light-grey">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Kv({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-light-grey">
        {label}
      </div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function Chips({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-light-grey mb-1">
        {label}
      </div>
      <div className="flex flex-wrap gap-1">
        {values.map((v) => (
          <span
            key={v}
            className="text-[11px] rounded-full bg-zinc-100 dark:bg-white/[0.06] px-2 py-0.5"
          >
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}
