import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import {
  DocumentTextIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";
import { inviteCandidate } from "../actions";
import { MatchBadges } from "@/components/MatchBadges";
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
  "How well this rep's experience matches the selected listing.";
const GOALS_TOOLTIP =
  "How well the selected listing satisfies what this rep wants next.";

export default async function CandidateDetailPage({
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
  if (!user) redirect("/login");

  // Only hiring-side users can view candidates.
  const { data: memberships } = await supabase
    .from("tenant_members")
    .select("tenant_id, role, tenants!inner(name, type)")
    .eq("user_id", user.id)
    .eq("status", "active");
  type M = { tenant_id: string; role: string; tenants: { name: string; type: string } };
  const hiring = (memberships as unknown as M[])?.find(
    (m) => m.tenants.type === "client_company" || m.tenants.type === "agency",
  );
  if (!hiring) redirect("/dashboard");

  // Fetch the candidate + their full profile, goals, and resume.
  const [
    { data: userRow },
    { data: profile },
    { data: goals },
    { data: specialties },
    { data: resume },
    { data: tenantListings },
    { data: clientProfile },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("first_name, last_name, email")
      .eq("id", candidateUserId)
      .maybeSingle(),
    supabase
      .from("candidate_profiles")
      .select(
        "headline, about, photo_url, video_url, visibility, years_of_experience, education, industry_slugs, sales_types, decision_makers, sales_environments, sales_cycles, deal_amounts, sales_volumes, lead_types, technologies",
      )
      .eq("user_id", candidateUserId)
      .maybeSingle(),
    supabase
      .from("candidate_goals")
      .select(
        "minimum_compensation, company_age_max, company_headcount_max, industries, sales_roles, commitment, benefits, compensation_types",
      )
      .eq("user_id", candidateUserId)
      .maybeSingle(),
    supabase
      .from("candidate_specialties")
      .select("sales_role")
      .eq("user_id", candidateUserId),
    supabase
      .from("candidate_files")
      .select("original_filename, size_bytes, uploaded_at, r2_key")
      .eq("user_id", candidateUserId)
      .eq("kind", "resume")
      .order("uploaded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("listings")
      .select("id, title, published_at, listing_details(sales_role, commitment, compensation_type, minimum_compensation, benefits), listing_requirements(*)")
      .eq("tenant_id", hiring.tenant_id)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(50),
    supabase
      .from("client_profiles")
      .select("industry_slug, headcount, founded_year")
      .eq("tenant_id", hiring.tenant_id)
      .maybeSingle(),
  ]);

  if (!userRow) notFound();

  const specialtyRoles = (specialties ?? []).map((s) => s.sales_role as string);

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

  type ListingRow = {
    id: string;
    title: string;
    published_at: string | null;
    listing_details:
      | ListingForMatch["details"]
      | ListingForMatch["details"][]
      | null;
    listing_requirements:
      | ListingForMatch["requirements"]
      | ListingForMatch["requirements"][]
      | null;
  };
  const listings = (tenantListings ?? []) as unknown as ListingRow[];

  const selectedListingId =
    (listingParam && listings.find((l) => l.id === listingParam)?.id) ||
    listings[0]?.id ||
    null;
  const selectedListingRow = listings.find((l) => l.id === selectedListingId);

  const listingForMatch: ListingForMatch | null = selectedListingRow
    ? {
        details: Array.isArray(selectedListingRow.listing_details)
          ? selectedListingRow.listing_details[0]
          : selectedListingRow.listing_details,
        requirements: Array.isArray(selectedListingRow.listing_requirements)
          ? selectedListingRow.listing_requirements[0]
          : selectedListingRow.listing_requirements,
        tenant: clientProfile ?? null,
      }
    : null;

  const expMatch = listingForMatch
    ? computeExperienceMatch(candidateForMatch, listingForMatch)
    : null;
  const goalsMatch = listingForMatch
    ? computeGoalsMatch((goals ?? null) as CandidateGoals | null, listingForMatch)
    : null;

  // Signed download URL for the resume (valid 1 hour). Only shows if the
  // candidate profile is public AND the resume exists.
  let resumeUrl: string | null = null;
  if (resume?.r2_key && profile?.visibility === "public") {
    const { data: signed } = await supabase.storage
      .from("resumes")
      .createSignedUrl(resume.r2_key, 60 * 60);
    resumeUrl = signed?.signedUrl ?? null;
  }

  const displayName =
    (userRow.first_name || userRow.last_name
      ? `${userRow.first_name ?? ""} ${userRow.last_name ?? ""}`.trim()
      : userRow.email) || "Candidate";

  const inits =
    ((userRow.first_name?.[0] ?? "") + (userRow.last_name?.[0] ?? ""))
      .toUpperCase() || userRow.email[0].toUpperCase();

  // Application status
  const { data: application } = await supabase
    .from("applications")
    .select("status")
    .eq("tenant_id", hiring.tenant_id)
    .eq("candidate_user_id", candidateUserId)
    .maybeSingle();

  return (
    <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
      <Link
        href={`/candidates${selectedListingId ? `?listing=${selectedListingId}` : ""}`}
        className="text-xs text-light-grey hover:text-primary transition-colors mb-3 inline-block"
      >
        ← All candidates
      </Link>

      <div className="flex items-start gap-4 mb-6">
        <div className="w-16 h-16 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
          {profile?.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.photo_url}
              alt={displayName}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            inits
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold mb-0.5">{displayName}</h1>
          {profile?.headline && (
            <p className="text-sm text-light-grey">{profile.headline}</p>
          )}
        </div>

        {!application ? (
          <form action={inviteCandidate} className="contents">
            <input type="hidden" name="candidate_user_id" value={candidateUserId} />
            <button
              type="submit"
              className="rounded bg-primary text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
            >
              Invite
            </button>
          </form>
        ) : (
          <span className="text-xs bg-zinc-100 dark:bg-white/[0.06] rounded px-2 py-1 shrink-0">
            {application.status}
          </span>
        )}
      </div>

      {/* Listing selector for match scoring */}
      {listings.length > 0 && (
        <div className="mb-4 rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-3 flex items-center gap-3 flex-wrap">
          <span className="text-xs uppercase tracking-wider font-semibold text-light-grey">
            Match against
          </span>
          <form method="get" className="contents">
            <select
              name="listing"
              defaultValue={selectedListingId ?? ""}
              onChange={(e) => e.currentTarget.form?.submit()}
              className="rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-sm"
            >
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          </form>
        </div>
      )}

      {/* Match badges */}
      {expMatch && goalsMatch && (
        <div className="mb-6">
          <MatchBadges
            experience={expMatch.score}
            goals={goalsMatch.score}
            experienceLabel="Experience"
            goalsLabel="Goals"
            experienceTooltip={EXPERIENCE_TOOLTIP}
            goalsTooltip={GOALS_TOOLTIP}
          />
          <p className="text-xs text-light-grey mt-1.5">
            Hover each badge for what it means.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
          {/* Assets: video + resume */}
          {(profile?.video_url || resumeUrl) && (
            <section className="rounded-xl border border-zinc-200 dark:border-white/[0.06] p-4 space-y-2">
              {profile?.video_url && (
                <a
                  href={profile.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:opacity-80"
                >
                  <VideoCameraIcon className="h-4 w-4" />
                  Watch intro video →
                </a>
              )}
              {resumeUrl && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:opacity-80"
                >
                  <DocumentTextIcon className="h-4 w-4" />
                  Download resume ({resume?.original_filename}) →
                </a>
              )}
            </section>
          )}

          {profile?.about && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
                About
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {profile.about}
              </p>
            </section>
          )}

          {expMatch && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-light-grey mb-3">
                Match breakdown
              </h2>
              <MatchList title="Experience" criteria={expMatch.criteria} />
              {goalsMatch && (
                <MatchList title="Goals" criteria={goalsMatch.criteria} />
              )}
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <Card title="Experience">
            {profile?.years_of_experience != null && (
              <Kv
                label="Years of sales"
                value={`${profile.years_of_experience} yrs`}
              />
            )}
            {profile?.education && (
              <Kv label="Education" value={profile.education} />
            )}
            {specialtyRoles.length > 0 && (
              <Chips label="Roles specialized in" values={specialtyRoles} />
            )}
            {profile?.sales_types?.length ? (
              <Chips label="Sales types" values={profile.sales_types} />
            ) : null}
            {profile?.decision_makers?.length ? (
              <Chips label="Decision-makers" values={profile.decision_makers} />
            ) : null}
            {profile?.sales_environments?.length ? (
              <Chips label="Environments" values={profile.sales_environments} />
            ) : null}
            {profile?.sales_cycles?.length ? (
              <Chips label="Cycles" values={profile.sales_cycles} />
            ) : null}
            {profile?.deal_amounts?.length ? (
              <Chips label="Deal sizes" values={profile.deal_amounts} />
            ) : null}
            {profile?.sales_volumes?.length ? (
              <Chips label="Annual volumes" values={profile.sales_volumes} />
            ) : null}
            {profile?.lead_types?.length ? (
              <Chips label="Lead types" values={profile.lead_types} />
            ) : null}
            {profile?.technologies?.length ? (
              <Chips label="Tools" values={profile.technologies} />
            ) : null}
            {profile?.industry_slugs?.length ? (
              <Chips label="Industries" values={profile.industry_slugs} />
            ) : null}
          </Card>

          <Card title="What they want next">
            {goals?.minimum_compensation != null && (
              <Kv
                label="Minimum comp"
                value={`$${goals.minimum_compensation.toLocaleString()}+`}
              />
            )}
            {goals?.company_headcount_max != null && (
              <Kv
                label="Max company size"
                value={`${goals.company_headcount_max}`}
              />
            )}
            {goals?.company_age_max != null && (
              <Kv
                label="Max company age"
                value={`${goals.company_age_max} yrs`}
              />
            )}
            {goals?.sales_roles?.length ? (
              <Chips label="Roles wanted" values={goals.sales_roles} />
            ) : null}
            {goals?.commitment?.length ? (
              <Chips label="Commitment" values={goals.commitment} />
            ) : null}
            {goals?.compensation_types?.length ? (
              <Chips label="Comp types" values={goals.compensation_types} />
            ) : null}
            {goals?.benefits?.length ? (
              <Chips label="Benefits wanted" values={goals.benefits} />
            ) : null}
            {goals?.industries?.length ? (
              <Chips label="Industries wanted" values={goals.industries} />
            ) : null}
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
