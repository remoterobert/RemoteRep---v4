import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { BookmarkIcon as BookmarkOutline } from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolid } from "@heroicons/react/24/solid";
import { createClient } from "@/lib/supabase/server";
import { toggleOpportunityBookmark } from "../actions";

export const dynamic = "force-dynamic";

export default async function OpportunityDetailPage({
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

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, tenant_id, title, description, instructions, calendar_link, status, visibility, published_at, tenants!inner(id, name), listing_details(sales_role, commitment, compensation_type, minimum_compensation, benefits), listing_requirements(*)",
    )
    .eq("id", id)
    .eq("status", "published")
    .eq("visibility", "public")
    .maybeSingle();

  if (!listing) notFound();

  type ListingRow = {
    id: string;
    tenant_id: string;
    title: string;
    description: string;
    instructions: string | null;
    calendar_link: string | null;
    published_at: string | null;
    tenants: { id: string; name: string } | { id: string; name: string }[];
    listing_details:
      | {
          sales_role: string | null;
          commitment: string | null;
          compensation_type: string | null;
          minimum_compensation: number | null;
          benefits: string[] | null;
        }
      | Array<{
          sales_role: string | null;
          commitment: string | null;
          compensation_type: string | null;
          minimum_compensation: number | null;
          benefits: string[] | null;
        }>
      | null;
    listing_requirements:
      | Record<string, unknown>
      | Array<Record<string, unknown>>
      | null;
  };
  const l = listing as unknown as ListingRow;
  const tenant = Array.isArray(l.tenants) ? l.tenants[0] : l.tenants;
  const details = Array.isArray(l.listing_details)
    ? l.listing_details[0]
    : l.listing_details;
  const reqs = (
    Array.isArray(l.listing_requirements)
      ? l.listing_requirements[0]
      : l.listing_requirements
  ) as {
    education?: string[] | null;
    years_of_experience_min?: number | null;
    industries?: string[] | null;
    sales_roles?: string[] | null;
    sales_types?: string[] | null;
    decision_makers?: string[] | null;
    sales_environments?: string[] | null;
    sales_cycles?: string[] | null;
    deal_amounts?: string[] | null;
    sales_volumes?: string[] | null;
    lead_types?: string[] | null;
    technologies?: string[] | null;
  } | null;

  // Bookmark state
  const { data: bookmark } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("owner_user_id", user.id)
    .eq("target_type", "listing")
    .eq("target_id", l.id)
    .maybeSingle();
  const isBookmarked = !!bookmark;

  // Log a listing.viewed event (fire-and-forget). RLS: candidate viewing
  // published listing is allowed by events insert policy. Skip if the
  // viewer is a member of the owning tenant so views by internal team
  // don't inflate the metric.
  const { data: sameTenantMembership } = await supabase
    .from("tenant_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("tenant_id", l.tenant_id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!sameTenantMembership) {
    await supabase.from("events").insert({
      tenant_id: l.tenant_id,
      actor_user_id: user.id,
      event_type: "listing.viewed",
      entity_type: "listing",
      entity_id: l.id,
      payload: {},
    });
  }

  const posted = l.published_at
    ? new Date(l.published_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
      <Link
        href="/opportunities"
        className="text-xs text-light-grey hover:text-primary transition-colors mb-3 inline-block"
      >
        ← All opportunities
      </Link>

      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold mb-1">{l.title}</h1>
          <p className="text-sm text-light-grey">
            {tenant.name}
            {posted && ` · Posted ${posted}`}
          </p>
        </div>
        <form action={toggleOpportunityBookmark} className="contents">
          <input type="hidden" name="opportunity_id" value={l.id} />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this"}
          >
            {isBookmarked ? (
              <>
                <BookmarkSolid className="h-4 w-4 text-primary" />
                Bookmarked
              </>
            ) : (
              <>
                <BookmarkOutline className="h-4 w-4" />
                Bookmark
              </>
            )}
          </button>
        </form>
      </div>

      {/* Snapshot chips */}
      <div className="flex flex-wrap gap-1.5 text-xs mb-6">
        {details?.sales_role && (
          <span className="bg-primary/10 text-primary rounded px-2 py-0.5 font-semibold">
            {details.sales_role}
          </span>
        )}
        {details?.commitment && (
          <span className="bg-zinc-100 dark:bg-white/[0.06] rounded px-2 py-0.5">
            {details.commitment}
          </span>
        )}
        {details?.compensation_type && (
          <span className="bg-zinc-100 dark:bg-white/[0.06] rounded px-2 py-0.5">
            {details.compensation_type}
            {details.minimum_compensation
              ? ` · $${details.minimum_compensation.toLocaleString()}+`
              : ""}
          </span>
        )}
      </div>

      {/* Two-column: description | requirements sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
              About the role
            </h2>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
              {l.description}
            </div>
          </section>

          {l.instructions && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
                How to apply
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {l.instructions}
              </p>
              {l.calendar_link && (
                <a
                  href={l.calendar_link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-sm text-primary hover:opacity-80 mt-3 font-medium"
                >
                  Book time →
                </a>
              )}
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <Card title="Compensation & fit">
            {details?.compensation_type && (
              <Kv label="Type" value={details.compensation_type} />
            )}
            {details?.minimum_compensation != null && (
              <Kv
                label="Minimum"
                value={`$${details.minimum_compensation.toLocaleString()}`}
              />
            )}
            {details?.benefits && details.benefits.length > 0 && (
              <Chips label="Benefits" values={details.benefits} />
            )}
          </Card>

          <Card title="What they're looking for">
            {reqs?.years_of_experience_min != null &&
              reqs.years_of_experience_min > 0 && (
                <Kv
                  label="Min. experience"
                  value={`${reqs.years_of_experience_min}+ yrs`}
                />
              )}
            {reqs?.education && reqs.education.length > 0 && (
              <Chips label="Education" values={reqs.education} />
            )}
            {reqs?.sales_types && reqs.sales_types.length > 0 && (
              <Chips label="Sales types" values={reqs.sales_types} />
            )}
            {reqs?.decision_makers && reqs.decision_makers.length > 0 && (
              <Chips
                label="Decision-makers"
                values={reqs.decision_makers}
              />
            )}
            {reqs?.sales_environments && reqs.sales_environments.length > 0 && (
              <Chips
                label="Environments"
                values={reqs.sales_environments}
              />
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
          </Card>

          <p className="text-xs text-light-grey px-1">
            Assess how each of these lines up with what you actually want next
            — comp, cycle length, deal size, industry. If the fit is close but
            not perfect, bookmark it and message the company anyway.
          </p>
        </aside>
      </div>
    </main>
  );
}

function Card({
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
