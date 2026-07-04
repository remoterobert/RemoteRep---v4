import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookmarkIcon as BookmarkOutline,
  MapPinIcon,
  BuildingOffice2Icon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolid } from "@heroicons/react/24/solid";
import { createClient } from "@/lib/supabase/server";
import { toggleOpportunityBookmark } from "@/app/opportunities/actions";
import { respondToInvitation } from "@/app/dashboard/actions";
import { MatchBadges } from "@/components/MatchBadges";
import { ShareButton } from "@/components/ShareButton";
import { AuthGate } from "@/components/AuthPromptModal";
import {
  computeExperienceMatch,
  computeGoalsMatch,
  STATUS_COLOR,
  STATUS_LABEL,
  type CandidateForMatch,
  type CandidateGoals,
  type ListingForMatch,
  type MatchCriterion,
} from "@/lib/matching";

export const dynamic = "force-dynamic";

const EXPERIENCE_TOOLTIP =
  "How well your sales experience matches what this company is looking for. Green means you meet or exceed the requirement; yellow is a partial match; red is a gap.";
const GOALS_TOOLTIP =
  "How well this role matches what you said you want next — comp, commitment, benefits, company size.";
const EMPTY_GOALS_TOOLTIP =
  "You haven't set your goals yet. Fill in Section 3 of your profile so we can compare listings to what you want next.";
const EMPTY_EXPERIENCE_TOOLTIP =
  "This listing doesn't specify enough requirements to score against, so there's nothing to compare.";

const PROMPT_APPLY_TITLE = "Ready to apply?";
const PROMPT_APPLY_BODY =
  "You don't have a profile yet. Create your account now to save and apply to this and thousands of other listings.";
const PROMPT_BOOKMARK_BODY =
  "Sign up to bookmark listings and keep track of the roles you're interested in.";

export default async function PublicListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public visibility only — RLS also enforces this but we filter
  // client-side for cleaner error handling.
  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, tenant_id, title, description, instructions, calendar_link, status, visibility, published_at, tenants!inner(id, name, slug), listing_details(sales_role, commitment, compensation_type, minimum_compensation, compensation_details, benefits), listing_requirements(*)",
    )
    .eq("id", id)
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
    tenants:
      | { id: string; name: string; slug: string }
      | { id: string; name: string; slug: string }[];
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

  // Company details for the sidebar
  const { data: companyRow } = await supabase
    .from("client_profiles")
    .select(
      "logo_url, about, hiring_pitch, website_url, industry_slug, city, state_region, country, headcount, founded_year, visibility",
    )
    .eq("tenant_id", l.tenant_id)
    .maybeSingle();

  // Owner-side: is the current user a member of the tenant that owns this listing?
  let isOwnerSide = false;
  if (user) {
    const { data: memb } = await supabase
      .from("tenant_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("tenant_id", l.tenant_id)
      .eq("status", "active")
      .maybeSingle();
    isOwnerSide = !!memb;
  }

  // Gate: non-owners can't view non-published listings.
  if (!isOwnerSide && (l.status !== "published" || l.visibility !== "public")) {
    notFound();
  }

  // ---- Auth-side data: candidate profile/goals + bookmark + application ----
  const now = new Date().toISOString();
  let isCandidate = false;
  let candidateForMatch: CandidateForMatch | null = null;
  let candidateGoals: CandidateGoals | null = null;
  let isBookmarked = false;
  let applicationRow: {
    status: string;
    id: string;
  } | null = null;

  if (user) {
    const [profileRes, goalsRes, specRes, bookmarkRes, appRes] =
      await Promise.all([
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
          .from("bookmarks")
          .select("id")
          .eq("owner_user_id", user.id)
          .eq("target_type", "listing")
          .eq("target_id", l.id)
          .maybeSingle(),
        supabase
          .from("applications")
          .select("id, status")
          .eq("listing_id", l.id)
          .eq("candidate_user_id", user.id)
          .maybeSingle(),
      ]);

    if (profileRes.data) {
      isCandidate = true;
      candidateForMatch = {
        ...profileRes.data,
        specialties: (specRes.data ?? []).map((s) => s.sales_role as string),
      };
      candidateGoals = (goalsRes.data ?? null) as CandidateGoals | null;
    }
    isBookmarked = !!bookmarkRes.data;
    applicationRow = appRes.data ?? null;

    // Log a listing.viewed event (skip for owning tenant members)
    if (!isOwnerSide) {
      await supabase.from("events").insert({
        tenant_id: l.tenant_id,
        actor_user_id: user.id,
        event_type: "listing.viewed",
        entity_type: "listing",
        entity_id: l.id,
        payload: {},
      });
    }
  }

  // Compute match scores if we have a candidate.
  const listingForMatch: ListingForMatch = {
    details,
    requirements: reqs,
    tenant: companyRow ?? null,
  };
  const experienceMatch = candidateForMatch
    ? computeExperienceMatch(candidateForMatch, listingForMatch)
    : null;
  const goalsMatch = candidateForMatch
    ? computeGoalsMatch(candidateGoals, listingForMatch)
    : null;

  // Per-chip color coding data
  const CAND_SETS: Record<string, Set<string>> = {
    industries: new Set(candidateForMatch?.industry_slugs ?? []),
    sales_roles: new Set(candidateForMatch?.specialties ?? []),
    sales_types: new Set(candidateForMatch?.sales_types ?? []),
    decision_makers: new Set(candidateForMatch?.decision_makers ?? []),
    sales_environments: new Set(candidateForMatch?.sales_environments ?? []),
    sales_cycles: new Set(candidateForMatch?.sales_cycles ?? []),
    deal_amounts: new Set(candidateForMatch?.deal_amounts ?? []),
    sales_volumes: new Set(candidateForMatch?.sales_volumes ?? []),
    lead_types: new Set(candidateForMatch?.lead_types ?? []),
    technologies: new Set(candidateForMatch?.technologies ?? []),
    education: new Set(candidateForMatch?.education ? [candidateForMatch.education] : []),
  };

  // Counts for "jobs posted" + "reps hired" tenant stats
  const [{ count: jobsPosted }, { count: repsHired }] = await Promise.all([
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", l.tenant_id)
      .eq("status", "published"),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", l.tenant_id)
      .eq("status", "hired"),
  ]);

  const posted = l.published_at
    ? new Date(l.published_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const signedIn = !!user;
  const publicPath = `/listings/${l.id}`;

  // Company location string
  const locationLine = [
    companyRow?.city,
    companyRow?.state_region,
    companyRow?.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="flex-1 w-full">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          {signedIn ? (
            <Link
              href="/opportunities"
              className="text-xs text-light-grey hover:text-primary transition-colors"
            >
              ← All opportunities
            </Link>
          ) : (
            <Link
              href="/"
              className="text-xs text-light-grey hover:text-primary transition-colors"
            >
              ← RemoteRep home
            </Link>
          )}
          <ShareButton />
        </div>

        {/* Status banner for owner viewing draft/paused/archived */}
        {isOwnerSide && l.status !== "published" && (
          <div className="mb-4 rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm">
            You&apos;re viewing this listing as its owner. Status:{" "}
            <b>{l.status}</b> — reps can&apos;t see it until you publish.{" "}
            <Link
              href={`/company/listings/${l.id}`}
              className="underline text-primary"
            >
              Manage listing
            </Link>
          </div>
        )}

        {/* Two-column layout: company sidebar (left) + job details (right) */}
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
          {/* -------------------------------------------------------------
              LEFT: Company card
             ------------------------------------------------------------- */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-5">
              <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold mx-auto mb-3 overflow-hidden">
                {companyRow?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={companyRow.logo_url}
                    alt={tenant.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BuildingOffice2Icon className="h-10 w-10" />
                )}
              </div>
              <h2 className="text-lg font-bold text-center mb-1 leading-tight">
                {tenant.name}
              </h2>
              {locationLine && (
                <p className="text-xs text-light-grey text-center flex items-center justify-center gap-1 mb-3">
                  <MapPinIcon className="h-3 w-3" />
                  {locationLine}
                </p>
              )}

              {companyRow?.hiring_pitch && (
                <p className="text-xs text-light-grey text-center mb-4 leading-snug">
                  {companyRow.hiring_pitch}
                </p>
              )}

              <dl className="text-xs space-y-2 mb-4 border-t border-zinc-100 dark:border-white/[0.04] pt-3">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-light-grey">Actively hiring</dt>
                  <dd>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-success/15 text-success ring-1 ring-success/30">
                      Yes
                    </span>
                  </dd>
                </div>
                {companyRow?.headcount != null && (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-light-grey">Company size</dt>
                    <dd>{companyRow.headcount}</dd>
                  </div>
                )}
                {companyRow?.founded_year != null && (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-light-grey">Founded</dt>
                    <dd>{companyRow.founded_year}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-light-grey">Jobs posted</dt>
                  <dd>{jobsPosted ?? 0}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-light-grey">Reps hired</dt>
                  <dd>{repsHired ?? 0}</dd>
                </div>
              </dl>

              {/* Primary CTAs */}
              <div className="space-y-2">
                {applicationRow?.status === "invited" ? (
                  <form
                    action={async (fd) => {
                      "use server";
                      await respondToInvitation(fd);
                    }}
                    className="contents"
                  >
                    <input
                      type="hidden"
                      name="application_id"
                      value={applicationRow.id}
                    />
                    <input type="hidden" name="response" value="interested" />
                    <button
                      type="submit"
                      className="w-full rounded-full bg-primary text-white py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      I&apos;m interested
                    </button>
                  </form>
                ) : (
                  <AuthGate
                    signedIn={signedIn}
                    title={PROMPT_APPLY_TITLE}
                    body={PROMPT_APPLY_BODY}
                    loginRedirect={publicPath}
                  >
                    {({ onGatedClick }) =>
                      signedIn ? (
                        applicationRow ? (
                          <div className="w-full rounded-full bg-zinc-100 dark:bg-white/[0.06] text-light-grey py-2 text-sm font-semibold text-center">
                            {applicationRow.status === "interviewing"
                              ? "Interested ✓"
                              : applicationRow.status === "hired"
                                ? "Hired ✓"
                                : applicationRow.status === "withdrawn"
                                  ? "Passed"
                                  : "Applied"}
                          </div>
                        ) : (
                          <a
                            href={l.calendar_link ?? "#"}
                            target={l.calendar_link ? "_blank" : undefined}
                            rel={l.calendar_link ? "noreferrer" : undefined}
                            className="block w-full text-center rounded-full bg-primary text-white py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
                          >
                            {l.calendar_link ? "Book intro call" : "Apply now"}
                          </a>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={onGatedClick}
                          className="w-full rounded-full bg-primary text-white py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
                        >
                          Apply now
                        </button>
                      )
                    }
                  </AuthGate>
                )}

                {companyRow?.website_url && (
                  <a
                    href={companyRow.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full text-center rounded-full border border-zinc-300 dark:border-zinc-700 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    Company website
                  </a>
                )}

                <AuthGate
                  signedIn={signedIn}
                  title="Sign in to bookmark"
                  body={PROMPT_BOOKMARK_BODY}
                  loginRedirect={publicPath}
                >
                  {({ onGatedClick }) =>
                    signedIn ? (
                      <form
                        action={toggleOpportunityBookmark}
                        className="contents"
                      >
                        <input
                          type="hidden"
                          name="opportunity_id"
                          value={l.id}
                        />
                        <button
                          type="submit"
                          className="w-full flex items-center justify-center gap-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
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
                    ) : (
                      <button
                        type="button"
                        onClick={onGatedClick}
                        className="w-full flex items-center justify-center gap-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
                      >
                        <BookmarkOutline className="h-4 w-4" />
                        Bookmark
                      </button>
                    )
                  }
                </AuthGate>
              </div>
            </div>

            {companyRow?.about && (
              <div className="rounded-2xl border border-zinc-200 dark:border-white/[0.06] p-4 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-light-grey">
                  About the company
                </h3>
                <p className="text-xs leading-relaxed whitespace-pre-wrap">
                  {companyRow.about}
                </p>
              </div>
            )}
          </aside>

          {/* -------------------------------------------------------------
              RIGHT: Job details
             ------------------------------------------------------------- */}
          <section className="space-y-6">
            {/* Header */}
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-light-grey mb-1">
                Job details
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                {l.title}
              </h1>
              <p className="text-sm text-light-grey">
                {tenant.name}
                {posted && ` · Posted ${posted}`}
              </p>
            </div>

            {/* Match badges — only for signed-in candidates */}
            {isCandidate && experienceMatch && goalsMatch && (
              <div>
                <MatchBadges
                  experience={experienceMatch.score}
                  goals={goalsMatch.score}
                  experienceScored={experienceMatch.scored}
                  goalsScored={goalsMatch.scored}
                  experienceLabel="Experience"
                  goalsLabel="Goals"
                  experienceTooltip={EXPERIENCE_TOOLTIP}
                  goalsTooltip={GOALS_TOOLTIP}
                  emptyExperienceTooltip={EMPTY_EXPERIENCE_TOOLTIP}
                  emptyGoalsTooltip={EMPTY_GOALS_TOOLTIP}
                />
                <p className="text-xs text-light-grey mt-1.5">
                  Hover each badge for what it means. Chips below turn green
                  when your profile matches, red when it doesn&apos;t.
                </p>
              </div>
            )}

            {!signedIn && (
              <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-4 flex flex-wrap items-center gap-3 justify-between">
                <div className="text-sm min-w-0">
                  <div className="font-semibold">
                    <ClipboardDocumentListIcon className="h-4 w-4 inline mr-1 text-primary" />
                    See your match score
                  </div>
                  <div className="text-xs text-light-grey">
                    Create your free profile to see how well this role fits
                    your experience and goals.
                  </div>
                </div>
                <Link
                  href={`/signup?redirect=${encodeURIComponent(publicPath)}`}
                  className="rounded-full bg-primary text-white px-4 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  Create profile
                </Link>
              </div>
            )}

            {/* Snapshot chips */}
            <div className="flex flex-wrap gap-1.5 text-xs">
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

            {/* Description */}
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-2">
                Job description
              </h2>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                {l.description}
              </div>
            </section>

            {/* Compensation details */}
            {(details?.compensation_details ||
              details?.benefits?.length ||
              details?.minimum_compensation != null) && (
              <section className="rounded-xl border border-zinc-200 dark:border-white/[0.06] p-4 space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey">
                  Compensation
                </h2>
                {details?.minimum_compensation != null && (
                  <div className="text-sm">
                    <span className="text-light-grey">Minimum: </span>
                    <b>${details.minimum_compensation.toLocaleString()}</b>
                  </div>
                )}
                {details?.compensation_details && (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {details.compensation_details}
                  </p>
                )}
                {details?.benefits?.length ? (
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-light-grey mb-1">
                      Benefits
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {details.benefits.map((b) => (
                        <span
                          key={b}
                          className="text-[11px] rounded-full bg-zinc-100 dark:bg-white/[0.06] px-2 py-0.5"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            )}

            {/* Requirements */}
            <section className="rounded-xl border border-zinc-200 dark:border-white/[0.06] p-4 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey">
                Requirements
              </h2>
              {reqs?.years_of_experience_min != null &&
                reqs.years_of_experience_min > 0 && (
                  <div className="text-sm">
                    <span className="text-light-grey">Years of experience: </span>
                    <b>{reqs.years_of_experience_min}+</b>
                  </div>
                )}
              {reqs?.education?.length ? (
                <MatchChips
                  label="Education"
                  values={reqs.education}
                  candidateSet={CAND_SETS.education}
                  isCandidate={isCandidate}
                />
              ) : null}
              {reqs?.sales_roles?.length ? (
                <MatchChips
                  label="Roles"
                  values={reqs.sales_roles}
                  candidateSet={CAND_SETS.sales_roles}
                  isCandidate={isCandidate}
                />
              ) : null}
              {reqs?.sales_types?.length ? (
                <MatchChips
                  label="Sales types"
                  values={reqs.sales_types}
                  candidateSet={CAND_SETS.sales_types}
                  isCandidate={isCandidate}
                />
              ) : null}
              {reqs?.decision_makers?.length ? (
                <MatchChips
                  label="Decision-makers"
                  values={reqs.decision_makers}
                  candidateSet={CAND_SETS.decision_makers}
                  isCandidate={isCandidate}
                />
              ) : null}
              {reqs?.sales_environments?.length ? (
                <MatchChips
                  label="Environments"
                  values={reqs.sales_environments}
                  candidateSet={CAND_SETS.sales_environments}
                  isCandidate={isCandidate}
                />
              ) : null}
              {reqs?.sales_cycles?.length ? (
                <MatchChips
                  label="Sales cycles"
                  values={reqs.sales_cycles}
                  candidateSet={CAND_SETS.sales_cycles}
                  isCandidate={isCandidate}
                />
              ) : null}
              {reqs?.deal_amounts?.length ? (
                <MatchChips
                  label="Deal amounts"
                  values={reqs.deal_amounts}
                  candidateSet={CAND_SETS.deal_amounts}
                  isCandidate={isCandidate}
                />
              ) : null}
              {reqs?.sales_volumes?.length ? (
                <MatchChips
                  label="Annual volume"
                  values={reqs.sales_volumes}
                  candidateSet={CAND_SETS.sales_volumes}
                  isCandidate={isCandidate}
                />
              ) : null}
              {reqs?.lead_types?.length ? (
                <MatchChips
                  label="Lead types"
                  values={reqs.lead_types}
                  candidateSet={CAND_SETS.lead_types}
                  isCandidate={isCandidate}
                />
              ) : null}
              {reqs?.technologies?.length ? (
                <MatchChips
                  label="Tools"
                  values={reqs.technologies}
                  candidateSet={CAND_SETS.technologies}
                  isCandidate={isCandidate}
                />
              ) : null}
              {reqs?.industries?.length ? (
                <MatchChips
                  label="Industries"
                  values={reqs.industries}
                  candidateSet={CAND_SETS.industries}
                  isCandidate={isCandidate}
                />
              ) : null}
            </section>

            {/* Instructions */}
            {l.instructions && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-2">
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

            {/* Match breakdown */}
            {isCandidate && experienceMatch && goalsMatch && (
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
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function MatchChips({
  label,
  values,
  candidateSet,
  isCandidate,
}: {
  label: string;
  values: string[];
  candidateSet: Set<string>;
  isCandidate: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-light-grey mb-1">
        {label}
      </div>
      <div className="flex flex-wrap gap-1">
        {values.map((v) => {
          const has = candidateSet.has(v);
          const cls = isCandidate
            ? has
              ? STATUS_COLOR.match
              : STATUS_COLOR.miss
            : "bg-zinc-100 dark:bg-white/[0.06]";
          return (
            <span
              key={v}
              title={
                !isCandidate
                  ? ""
                  : has
                    ? "In your profile ✓"
                    : "Not in your profile — update to match"
              }
              className={`text-[11px] rounded-full px-2 py-0.5 ${cls}`}
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
  criteria: MatchCriterion[];
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
