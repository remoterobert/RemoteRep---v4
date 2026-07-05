import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPinIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";
import { inviteCandidate } from "@/app/candidates/actions";
import { MatchBadges } from "@/components/MatchBadges";
import { ShareButton } from "@/components/ShareButton";
import { AuthPromptButton } from "@/components/AuthPromptModal";
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
  "How well this rep's experience matches the selected listing. Green = meets or exceeds; yellow = partial; red = gap.";
const GOALS_TOOLTIP =
  "How well the selected listing satisfies what this rep wants next.";
const EMPTY_GOALS_TOOLTIP =
  "This rep hasn't set their goals yet, so there's nothing to compare against.";
const EMPTY_EXPERIENCE_TOOLTIP =
  "Your listing doesn't specify enough requirements to score against.";

const PROMPT_INVITE_TITLE = "Ready to reach out?";
const PROMPT_INVITE_BODY =
  "This remote sales professional is available for hire alongside thousands of other candidates. Create your account to start the conversation.";
const PROMPT_RESOURCE_BODY =
  "Sign up to view this rep's intro video and resume, then send an invitation.";

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ listing?: string }>;
}) {
  const { id: candidateUserId } = await params;
  const { listing: listingParam } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: userRow }, { data: profile }, { data: specialties }] =
    await Promise.all([
      supabase
        .from("users")
        .select("first_name, last_name, email")
        .eq("id", candidateUserId)
        .maybeSingle(),
      supabase
        .from("candidate_profiles")
        .select(
          "headline, about, photo_url, video_url, skills, city, state_region, country, visibility, years_of_experience, education, industry_slugs, sales_types, decision_makers, sales_environments, sales_cycles, deal_amounts, sales_volumes, lead_types, technologies",
        )
        .eq("user_id", candidateUserId)
        .maybeSingle(),
      supabase
        .from("candidate_specialties")
        .select("sales_role")
        .eq("user_id", candidateUserId),
    ]);

  if (!userRow) notFound();

  // Gate: non-owner viewing a hidden profile → 404
  const isOwner = user?.id === candidateUserId;
  if (!isOwner && profile?.visibility !== "public") {
    notFound();
  }

  const specialtyRoles = (specialties ?? []).map(
    (s) => s.sales_role as string,
  );

  // ---- Viewer state ----
  const signedIn = !!user;
  let isHiringSide = false;
  let hiringTenantId: string | null = null;
  const publicPath = `/profiles/${candidateUserId}`;

  if (user) {
    const { data: memb } = await supabase
      .from("tenant_members")
      .select("tenant_id, role, tenants!inner(type)")
      .eq("user_id", user.id)
      .eq("status", "active");
    type M = { tenant_id: string; role: string; tenants: { type: string } };
    const hiring = (memb as unknown as M[])?.find(
      (m) => m.tenants.type === "client_company" || m.tenants.type === "agency",
    );
    if (hiring) {
      isHiringSide = true;
      hiringTenantId = hiring.tenant_id;
    }
  }

  // For hiring-side: fetch their listings for match selector + client profile
  let tenantListings: Array<{
    id: string;
    title: string;
    published_at: string | null;
    listing_details: unknown;
    listing_requirements: unknown;
  }> = [];
  let clientProfile: {
    industry_slug: string | null;
    headcount: number | null;
    founded_year: number | null;
  } | null = null;
  let selectedListingId: string | null = null;
  let listingForMatch: ListingForMatch | null = null;

  if (isHiringSide && hiringTenantId) {
    const [{ data: lRows }, { data: cProfile }, { data: goalsRow }] =
      await Promise.all([
        supabase
          .from("listings")
          .select(
            "id, title, published_at, listing_details(sales_role, commitment, compensation_type, minimum_compensation, benefits), listing_requirements(*)",
          )
          .eq("tenant_id", hiringTenantId)
          .eq("status", "published")
          .order("published_at", { ascending: false, nullsFirst: false })
          .limit(50),
        supabase
          .from("client_profiles")
          .select("industry_slug, headcount, founded_year")
          .eq("tenant_id", hiringTenantId)
          .maybeSingle(),
        supabase
          .from("candidate_goals")
          .select(
            "minimum_compensation, company_age_min, company_headcount_min, industries, sales_roles, commitment, benefits, compensation_types",
          )
          .eq("user_id", candidateUserId)
          .maybeSingle(),
      ]);
    tenantListings = (lRows ?? []) as typeof tenantListings;
    clientProfile = cProfile ?? null;

    selectedListingId =
      (listingParam &&
        tenantListings.find((l) => l.id === listingParam)?.id) ||
      tenantListings[0]?.id ||
      null;
    const selected = tenantListings.find((l) => l.id === selectedListingId);
    if (selected) {
      listingForMatch = {
        details: Array.isArray(selected.listing_details)
          ? (selected.listing_details as unknown[])[0]
          : (selected.listing_details as ListingForMatch["details"]),
        requirements: Array.isArray(selected.listing_requirements)
          ? (selected.listing_requirements as unknown[])[0]
          : (selected.listing_requirements as ListingForMatch["requirements"]),
        tenant: clientProfile,
      } as ListingForMatch;
    }

    // For match: candidate goals
    var candidateGoalsRow = goalsRow ?? null; // eslint-disable-line
  }

  // Compute match for hiring viewer
  const candidateForMatch: CandidateForMatch = {
    years_of_experience: profile?.years_of_experience ?? null,
    education: profile?.education ?? null,
    industry_slugs: profile?.industry_slugs ?? null,
    sales_types: profile?.sales_types ?? null,
    decision_makers: profile?.decision_makers ?? null,
    sales_environments: profile?.sales_environments ?? null,
    sales_cycles: profile?.sales_cycles ?? null,
    deal_amounts: profile?.deal_amounts ?? null,
    sales_volumes: profile?.sales_volumes ?? null,
    lead_types: profile?.lead_types ?? null,
    technologies: profile?.technologies ?? null,
    specialties: specialtyRoles,
  };

  // Fetch goals separately (public read allowed on own goals only) — hiring
  // side gets the goals via RPC or omitted. For MVP, omit goals match on the
  // public page when the viewer isn't the owner.
  let candidateGoals: CandidateGoals | null = null;
  if (isOwner && user) {
    const { data: goals } = await supabase
      .from("candidate_goals")
      .select(
        "minimum_compensation, company_age_min, company_headcount_min, industries, sales_roles, commitment, benefits, compensation_types",
      )
      .eq("user_id", user.id)
      .maybeSingle();
    candidateGoals = goals ?? null;
  } else if (isHiringSide) {
    // Best-effort read of goals — RLS may block if policy doesn't allow it.
    const { data: goals } = await supabase
      .from("candidate_goals")
      .select(
        "minimum_compensation, company_age_min, company_headcount_min, industries, sales_roles, commitment, benefits, compensation_types",
      )
      .eq("user_id", candidateUserId)
      .maybeSingle();
    candidateGoals = goals ?? null;
  }

  const expMatch =
    isHiringSide && listingForMatch
      ? computeExperienceMatch(candidateForMatch, listingForMatch)
      : null;
  const goalsMatchResult =
    isHiringSide && listingForMatch
      ? computeGoalsMatch(candidateGoals, listingForMatch)
      : null;

  // Signed resume URL — hiring viewers on a public profile only.
  let resume: {
    original_filename: string | null;
    size_bytes: number | null;
    uploaded_at: string | null;
    r2_key: string;
  } | null = null;
  let resumeUrl: string | null = null;
  {
    const { data: resumeRow } = await supabase
      .from("candidate_files")
      .select("original_filename, size_bytes, uploaded_at, r2_key")
      .eq("user_id", candidateUserId)
      .eq("kind", "resume")
      .order("uploaded_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    resume = resumeRow ?? null;
    if (resume?.r2_key && (isOwner || (isHiringSide && profile?.visibility === "public"))) {
      const { data: signed } = await supabase.storage
        .from("resumes")
        .createSignedUrl(resume.r2_key, 60 * 60);
      resumeUrl = signed?.signedUrl ?? null;
    }
  }

  const displayName =
    (userRow.first_name || userRow.last_name
      ? `${userRow.first_name ?? ""} ${userRow.last_name ?? ""}`.trim()
      : userRow.email) || "Candidate";
  const inits =
    ((userRow.first_name?.[0] ?? "") + (userRow.last_name?.[0] ?? ""))
      .toUpperCase() || userRow.email[0].toUpperCase();

  // Application status
  let applicationRow: { status: string } | null = null;
  if (isHiringSide && hiringTenantId) {
    const { data: app } = await supabase
      .from("applications")
      .select("status")
      .eq("tenant_id", hiringTenantId)
      .eq("candidate_user_id", candidateUserId)
      .maybeSingle();
    applicationRow = app ?? null;
  }

  const locationLine = [profile?.city, profile?.state_region, profile?.country]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="flex-1 w-full">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          {signedIn ? (
            <Link
              href={isHiringSide ? "/candidates" : "/opportunities"}
              className="text-xs text-light-grey hover:text-primary transition-colors"
            >
              ← Back
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

        {/* Owner banner if profile is hidden */}
        {isOwner && profile?.visibility === "hidden" && (
          <div className="mb-4 rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm">
            Your profile is currently <b>hidden</b> — hiring companies
            can&apos;t find you. Update in{" "}
            <Link
              href="/profile/edit"
              className="underline text-primary"
            >
              your profile
            </Link>
            .
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
          {/* -------------------------------------------------------------
              LEFT: Rep identity card
             ------------------------------------------------------------- */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-5">
              <div className="h-24 w-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold mx-auto mb-3 overflow-hidden">
                {profile?.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.photo_url}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  inits || <UserCircleIcon className="h-14 w-14" />
                )}
              </div>
              <h2 className="text-lg font-bold text-center mb-1 leading-tight uppercase">
                {displayName}
              </h2>
              {locationLine && (
                <p className="text-xs text-light-grey text-center flex items-center justify-center gap-1 mb-3">
                  <MapPinIcon className="h-3 w-3" />
                  {locationLine}
                </p>
              )}
              {profile?.headline && (
                <p className="text-sm text-center mb-4 leading-snug">
                  {profile.headline}
                </p>
              )}

              {/* Match badges — hiring viewer with a selected listing */}
              {expMatch && goalsMatchResult && (
                <div className="mb-4 pb-4 border-b border-zinc-100 dark:border-white/[0.04]">
                  <MatchBadges
                    size="sm"
                    experience={expMatch.score}
                    goals={goalsMatchResult.score}
                    experienceScored={expMatch.scored}
                    goalsScored={goalsMatchResult.scored}
                    experienceLabel="Exp"
                    goalsLabel="Goals"
                    experienceTooltip={EXPERIENCE_TOOLTIP}
                    goalsTooltip={GOALS_TOOLTIP}
                    emptyExperienceTooltip={EMPTY_EXPERIENCE_TOOLTIP}
                    emptyGoalsTooltip={EMPTY_GOALS_TOOLTIP}
                  />
                </div>
              )}

              {/* Listing selector for hiring viewer */}
              {isHiringSide && tenantListings.length > 0 && (
                <form method="get" className="mb-4">
                  <label className="text-[11px] uppercase tracking-wider font-semibold text-light-grey mb-1 block">
                    Match against
                  </label>
                  <select
                    name="listing"
                    defaultValue={selectedListingId ?? ""}
                    onChange={(e) => e.currentTarget.form?.submit()}
                    className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-xs"
                  >
                    {tenantListings.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))}
                  </select>
                </form>
              )}

              {/* CTAs */}
              <div className="space-y-2">
                {isHiringSide && !applicationRow ? (
                  <form action={inviteCandidate} className="contents">
                    <input
                      type="hidden"
                      name="candidate_user_id"
                      value={candidateUserId}
                    />
                    <button
                      type="submit"
                      className="w-full rounded-full bg-primary text-white py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      Invite to apply
                    </button>
                  </form>
                ) : isHiringSide && applicationRow ? (
                  <div className="w-full rounded-full bg-zinc-100 dark:bg-white/[0.06] text-light-grey py-2 text-sm font-semibold text-center">
                    {applicationRow.status === "interviewing"
                      ? "Interested ✓"
                      : applicationRow.status === "invited"
                        ? "Invitation sent"
                        : applicationRow.status === "hired"
                          ? "Hired ✓"
                          : applicationRow.status}
                  </div>
                ) : !signedIn ? (
                  <AuthPromptButton
                    title={PROMPT_INVITE_TITLE}
                    body={PROMPT_INVITE_BODY}
                    loginRedirect={publicPath}
                    className="w-full rounded-full bg-primary text-white py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    Invite to apply
                  </AuthPromptButton>
                ) : null}
              </div>
            </div>
          </aside>

          {/* -------------------------------------------------------------
              RIGHT: Rich profile content
             ------------------------------------------------------------- */}
          <section className="space-y-6">
            {/* Rapid Hire Resources */}
            {(profile?.video_url || resume) && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
                  Rapid Hire Resources
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {profile?.video_url &&
                    (signedIn ? (
                      <a
                        href={profile.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-zinc-200 dark:border-white/[0.06] p-6 text-center hover:border-primary/40 transition-colors"
                      >
                        <VideoCameraIcon className="h-8 w-8 text-primary mx-auto mb-1.5" />
                        <div className="text-sm font-medium">Intro video</div>
                      </a>
                    ) : (
                      <AuthPromptButton
                        title="Sign in to watch"
                        body={PROMPT_RESOURCE_BODY}
                        loginRedirect={publicPath}
                        className="rounded-xl border border-zinc-200 dark:border-white/[0.06] p-6 text-center hover:border-primary/40 transition-colors w-full"
                      >
                        <VideoCameraIcon className="h-8 w-8 text-primary mx-auto mb-1.5" />
                        <div className="text-sm font-medium">Intro video</div>
                      </AuthPromptButton>
                    ))}
                  {resume &&
                    (signedIn && resumeUrl ? (
                      <a
                        href={resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-zinc-200 dark:border-white/[0.06] p-6 text-center hover:border-primary/40 transition-colors"
                      >
                        <DocumentTextIcon className="h-8 w-8 text-primary mx-auto mb-1.5" />
                        <div className="text-sm font-medium">Résumé</div>
                      </a>
                    ) : (
                      <AuthPromptButton
                        title="Sign in to download"
                        body={PROMPT_RESOURCE_BODY}
                        loginRedirect={publicPath}
                        className="rounded-xl border border-zinc-200 dark:border-white/[0.06] p-6 text-center hover:border-primary/40 transition-colors w-full"
                      >
                        <DocumentTextIcon className="h-8 w-8 text-primary mx-auto mb-1.5" />
                        <div className="text-sm font-medium">Résumé</div>
                      </AuthPromptButton>
                    ))}
                </div>
              </section>
            )}

            {profile?.about && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
                  Professional Information
                </h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {profile.about}
                </p>
              </section>
            )}

            {/* Experience card */}
            <section className="rounded-xl border border-zinc-200 dark:border-white/[0.06] p-4 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey">
                Experience
              </h2>
              {profile?.technologies?.length ? (
                <PillLine label="Technologies" values={profile.technologies} />
              ) : null}
              {profile?.skills ? (
                <PillLine label="Skills" text={profile.skills} />
              ) : null}
              {profile?.lead_types?.length ? (
                <PillLine label="Lead types" values={profile.lead_types} />
              ) : null}
              {profile?.education && (
                <PillLine label="Education" text={profile.education} />
              )}
              {specialtyRoles.length > 0 && (
                <PillLine label="Roles" values={specialtyRoles} />
              )}
              {profile?.industry_slugs?.length ? (
                <PillLine label="Industries" values={profile.industry_slugs} />
              ) : null}
              {profile?.sales_types?.length ? (
                <PillLine label="Sales types" values={profile.sales_types} />
              ) : null}
              {profile?.decision_makers?.length ? (
                <PillLine
                  label="Decision-makers"
                  values={profile.decision_makers}
                />
              ) : null}
              {profile?.deal_amounts?.length ? (
                <PillLine
                  label="Average deal amounts"
                  values={profile.deal_amounts}
                />
              ) : null}
              {profile?.sales_volumes?.length ? (
                <PillLine
                  label="Average annual sales volumes"
                  values={profile.sales_volumes}
                />
              ) : null}
              {profile?.sales_environments?.length ? (
                <PillLine
                  label="Sales environments"
                  values={profile.sales_environments}
                />
              ) : null}
              {profile?.sales_cycles?.length ? (
                <PillLine
                  label="Sales cycles"
                  values={profile.sales_cycles}
                />
              ) : null}
              {profile?.years_of_experience != null && (
                <PillLine
                  label="Years of experience"
                  text={`${profile.years_of_experience}`}
                />
              )}
            </section>

            {/* Match breakdown for hiring viewer */}
            {expMatch && goalsMatchResult && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
                  Match breakdown
                </h2>
                <MatchList title="Experience" criteria={expMatch.criteria} />
                <MatchList title="Goals" criteria={goalsMatchResult.criteria} />
              </section>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function PillLine({
  label,
  values,
  text,
}: {
  label: string;
  values?: string[];
  text?: string;
}) {
  return (
    <div>
      <span className="text-xs text-light-grey uppercase tracking-wider font-semibold">
        {label}:{" "}
      </span>
      {values ? (
        <span className="text-sm">{values.join(", ")}</span>
      ) : (
        <span className="text-sm">{text}</span>
      )}
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
                <span className="text-[11px] text-light-grey">{c.detail}</span>
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
