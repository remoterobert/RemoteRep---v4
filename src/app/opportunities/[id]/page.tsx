import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { BookmarkIcon as BookmarkOutline } from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolid } from "@heroicons/react/24/solid";
import { createClient } from "@/lib/supabase/server";
import { toggleOpportunityBookmark } from "../actions";
import { MatchBadges } from "@/components/MatchBadges";
import {
  computeExperienceMatch,
  computeGoalsMatch,
  STATUS_COLOR,
  STATUS_LABEL,
  type CandidateForMatch,
  type CandidateGoals,
  type ListingForMatch,
} from "@/lib/matching";

export const dynamic = "force-dynamic";

const EXPERIENCE_TOOLTIP =
  "How well your sales experience matches what this company is looking for. Green means you meet or exceed. Red means gaps.";
const GOALS_TOOLTIP =
  "How well this role matches what you said you want next — comp, commitment, benefits, company size. Green means the role satisfies your goal.";

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
      "id, tenant_id, title, description, instructions, calendar_link, status, visibility, published_at, tenants!inner(id, name), listing_details(sales_role, commitment, compensation_type, minimum_compensation, compensation_details, benefits), listing_requirements(*)",
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
          commitment: string[] | null;
          compensation_type: string[] | null;
          minimum_compensation: number | null;
          compensation_details: string | null;
          benefits: string[] | null;
        }
      | Array<{
          sales_role: string | null;
          commitment: string[] | null;
          compensation_type: string[] | null;
          minimum_compensation: number | null;
          compensation_details: string | null;
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

  // Everything we need to score the match, in parallel with the bookmark check.
  const [
    { data: bookmark },
    { data: candidateProfile },
    { data: candidateGoals },
    { data: candidateSpecialties },
    { data: clientProfile },
    { data: sameTenantMembership },
  ] = await Promise.all([
    supabase
      .from("bookmarks")
      .select("id")
      .eq("owner_user_id", user.id)
      .eq("target_type", "listing")
      .eq("target_id", l.id)
      .maybeSingle(),
    supabase
      .from("candidate_profiles")
      .select(
        "years_of_experience, education, industry_slugs, sales_types, decision_makers, sales_environments, sales_cycles, deal_amounts, sales_volumes, lead_types, technologies",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("candidate_goals")
      .select(
        "minimum_compensation, company_age_max, company_headcount_max, industries, sales_roles, commitment, benefits, compensation_types",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("candidate_specialties")
      .select("sales_role")
      .eq("user_id", user.id),
    supabase
      .from("client_profiles")
      .select("industry_slug, headcount, founded_year")
      .eq("tenant_id", l.tenant_id)
      .maybeSingle(),
    supabase
      .from("tenant_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("tenant_id", l.tenant_id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle(),
  ]);

  const isBookmarked = !!bookmark;

  // Log a listing.viewed event (skip if the viewer works at the owning tenant).
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

  // Assemble matching inputs and run the engine.
  const candidateForMatch: CandidateForMatch = {
    ...(candidateProfile ?? {}),
    specialties: (candidateSpecialties ?? []).map(
      (s) => s.sales_role as string,
    ),
  };
  const listingForMatch: ListingForMatch = {
    details,
    requirements: reqs,
    tenant: clientProfile ?? null,
  };
  const experienceMatch = computeExperienceMatch(
    candidateForMatch,
    listingForMatch,
  );
  const goalsMatch = computeGoalsMatch(
    (candidateGoals ?? null) as CandidateGoals | null,
    listingForMatch,
  );

  // For per-chip color-coding: a Set of the candidate's values per axis
  // so requirement chips can render green/red individually.
  const cand = candidateForMatch;
  const CAND_SETS: Record<string, Set<string>> = {
    industries: new Set(cand.industry_slugs ?? []),
    sales_roles: new Set(cand.specialties ?? []),
    sales_types: new Set(cand.sales_types ?? []),
    decision_makers: new Set(cand.decision_makers ?? []),
    sales_environments: new Set(cand.sales_environments ?? []),
    sales_cycles: new Set(cand.sales_cycles ?? []),
    deal_amounts: new Set(cand.deal_amounts ?? []),
    sales_volumes: new Set(cand.sales_volumes ?? []),
    lead_types: new Set(cand.lead_types ?? []),
    technologies: new Set(cand.technologies ?? []),
    education: new Set(cand.education ? [cand.education] : []),
  };

  const posted = l.published_at
    ? new Date(l.published_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
      <Link
        href="/opportunities"
        className="text-xs text-light-grey hover:text-primary transition-colors mb-3 inline-block"
      >
        ← All opportunities
      </Link>

      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
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

      {/* Match badges */}
      <div className="mb-6">
        <MatchBadges
          experience={experienceMatch.score}
          goals={goalsMatch.score}
          experienceLabel="Experience"
          goalsLabel="Goals"
          experienceTooltip={EXPERIENCE_TOOLTIP}
          goalsTooltip={GOALS_TOOLTIP}
        />
        <p className="text-xs text-light-grey mt-1.5">
          Hover each badge for what it means. Chips below turn green when your
          profile matches, red when it doesn&apos;t. Update your{" "}
          <Link href="/profile/edit" className="underline text-primary">
            profile
          </Link>{" "}
          to improve match accuracy.
        </p>
      </div>

      {/* Snapshot chips (listing-side info, uncolored) */}
      <div className="flex flex-wrap gap-1.5 text-xs mb-6">
        {details?.sales_role && (
          <span className="bg-primary/10 text-primary rounded px-2 py-0.5 font-semibold">
            {details.sales_role}
          </span>
        )}
        {details?.commitment?.map((c) => (
          <span
            key={c}
            className="bg-zinc-100 dark:bg-white/[0.06] rounded px-2 py-0.5"
          >
            {c}
          </span>
        ))}
        {details?.compensation_type?.map((c) => (
          <span
            key={c}
            className="bg-zinc-100 dark:bg-white/[0.06] rounded px-2 py-0.5"
          >
            {c}
          </span>
        ))}
        {details?.minimum_compensation != null && (
          <span className="bg-zinc-100 dark:bg-white/[0.06] rounded px-2 py-0.5">
            ${details.minimum_compensation.toLocaleString()}+
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
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

          {/* Match breakdown — per-criterion status. Helps reps quickly see
              which specific things are hitting and missing. */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
              Match breakdown
            </h2>
            <MatchList
              title="Experience"
              criteria={experienceMatch.criteria}
            />
            <MatchList title="Goals" criteria={goalsMatch.criteria} />
          </section>
        </div>

        <aside className="space-y-4">
          <Card title="Compensation & fit">
            {details?.commitment && details.commitment.length > 0 && (
              <Chips label="Commitment" values={details.commitment} />
            )}
            {details?.compensation_type &&
              details.compensation_type.length > 0 && (
                <Chips
                  label="Structure"
                  values={details.compensation_type}
                />
              )}
            {details?.minimum_compensation != null && (
              <Kv
                label="Minimum"
                value={`$${details.minimum_compensation.toLocaleString()}`}
              />
            )}
            {details?.compensation_details && (
              <div>
                <div className="text-[11px] uppercase tracking-wider text-light-grey mb-1">
                  Comp details
                </div>
                <p className="text-xs whitespace-pre-wrap leading-relaxed">
                  {details.compensation_details}
                </p>
              </div>
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
              <MatchChips
                label="Education"
                values={reqs.education}
                candidateSet={CAND_SETS.education}
              />
            )}
            {reqs?.sales_types && reqs.sales_types.length > 0 && (
              <MatchChips
                label="Sales types"
                values={reqs.sales_types}
                candidateSet={CAND_SETS.sales_types}
              />
            )}
            {reqs?.decision_makers && reqs.decision_makers.length > 0 && (
              <MatchChips
                label="Decision-makers"
                values={reqs.decision_makers}
                candidateSet={CAND_SETS.decision_makers}
              />
            )}
            {reqs?.sales_environments && reqs.sales_environments.length > 0 && (
              <MatchChips
                label="Environments"
                values={reqs.sales_environments}
                candidateSet={CAND_SETS.sales_environments}
              />
            )}
            {reqs?.sales_cycles && reqs.sales_cycles.length > 0 && (
              <MatchChips
                label="Sales cycles"
                values={reqs.sales_cycles}
                candidateSet={CAND_SETS.sales_cycles}
              />
            )}
            {reqs?.deal_amounts && reqs.deal_amounts.length > 0 && (
              <MatchChips
                label="Deal size"
                values={reqs.deal_amounts}
                candidateSet={CAND_SETS.deal_amounts}
              />
            )}
            {reqs?.sales_volumes && reqs.sales_volumes.length > 0 && (
              <MatchChips
                label="Annual volume"
                values={reqs.sales_volumes}
                candidateSet={CAND_SETS.sales_volumes}
              />
            )}
            {reqs?.lead_types && reqs.lead_types.length > 0 && (
              <MatchChips
                label="Leads"
                values={reqs.lead_types}
                candidateSet={CAND_SETS.lead_types}
              />
            )}
            {reqs?.technologies && reqs.technologies.length > 0 && (
              <MatchChips
                label="Tools"
                values={reqs.technologies}
                candidateSet={CAND_SETS.technologies}
              />
            )}
            {reqs?.industries && reqs.industries.length > 0 && (
              <MatchChips
                label="Industries"
                values={reqs.industries}
                candidateSet={CAND_SETS.industries}
              />
            )}
          </Card>
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

/**
 * Chips that color themselves green/red based on whether the value
 * appears in `candidateSet`. Used on the "What they're looking for"
 * card so the rep can eyeball each individual requirement.
 */
function MatchChips({
  label,
  values,
  candidateSet,
}: {
  label: string;
  values: string[];
  candidateSet: Set<string>;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-light-grey mb-1">
        {label}
      </div>
      <div className="flex flex-wrap gap-1">
        {values.map((v) => {
          const has = candidateSet.has(v);
          return (
            <span
              key={v}
              title={
                has
                  ? "In your profile ✓"
                  : "Not in your profile — update to match"
              }
              className={`text-[11px] rounded-full px-2 py-0.5 cursor-help ${
                has ? STATUS_COLOR.match : STATUS_COLOR.miss
              }`}
            >
              {v}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function MatchList({
  title,
  criteria,
}: {
  title: string;
  criteria: import("@/lib/matching").MatchCriterion[];
}) {
  const scored = criteria.filter((c) => c.status !== "not_required");
  if (scored.length === 0) return null;
  return (
    <div className="mb-4">
      <div className="text-[11px] uppercase tracking-wider text-light-grey font-semibold mb-2">
        {title}
      </div>
      <ul className="space-y-1">
        {scored.map((c) => (
          <li
            key={c.key}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span className="min-w-0 truncate">{c.label}</span>
            <span className="flex items-center gap-1.5 shrink-0">
              {c.detail && (
                <span className="text-[11px] text-light-grey">
                  {c.detail}
                </span>
              )}
              <span
                className={`text-[10px] rounded-full px-1.5 py-0.5 font-semibold ${STATUS_COLOR[c.status]}`}
              >
                {STATUS_LABEL[c.status]}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
