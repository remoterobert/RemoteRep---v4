import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CheckIcon,
  MapPinIcon,
  AcademicCapIcon,
  BookmarkIcon as BookmarkOutline,
} from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolid } from "@heroicons/react/24/solid";
import { createClient } from "@/lib/supabase/server";
import { inviteCandidate, toggleCandidateBookmark } from "./actions";
import { MatchListingSelect } from "./MatchListingSelect";
import { MatchBadges } from "@/components/MatchBadges";
import {
  computeExperienceMatch,
  computeGoalsMatch,
  type CandidateForMatch,
  type CandidateGoals,
  type ListingForMatch,
} from "@/lib/matching";

export const dynamic = "force-dynamic";

const EXPERIENCE_TOOLTIP =
  "How well this rep's experience matches your listing's requirements. Green = meets or exceeds; yellow = partial; red = gap.";
const GOALS_TOOLTIP =
  "How well what you're offering matches what this rep says they want next.";
const EMPTY_GOALS_TOOLTIP =
  "This rep hasn't set their goals yet, so there's nothing to compare against.";
const EMPTY_EXPERIENCE_TOOLTIP =
  "Your listing doesn't specify enough requirements to score against.";

type SearchParams = Promise<{
  view?: "list" | "tile";
  role?: string;
  listing?: string;
  error?: string;
}>;

type CandidateRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  headline: string | null;
  photo_url: string | null;
  years_of_experience: number | null;
  education: string | null;
  sales_types: string[] | null;
  deal_amounts: string[] | null;
  sales_volumes: string[] | null;
  city: string | null;
  state_region: string | null;
  visibility: string | null;
  decision_makers: string[] | null;
  sales_environments: string[] | null;
  sales_cycles: string[] | null;
  lead_types: string[] | null;
  technologies: string[] | null;
  specialties: string[];
  experienceMatch: number;
  goalsMatch: number;
  experienceScored: number;
  goalsScored: number;
};

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("tenant_members")
    .select("tenant_id, role, status, tenants!inner(id, name, type)")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (!memberships || memberships.length === 0) {
    redirect("/onboarding/choose-role");
  }

  type MembershipRow = {
    tenant_id: string;
    role: string;
    tenants: { id: string; name: string; type: string };
  };
  const hiring = (memberships as unknown as MembershipRow[]).find(
    (m) => m.tenants.type === "client_company" || m.tenants.type === "agency",
  );
  if (!hiring) redirect("/dashboard");

  const params = await searchParams;
  const view = params.view === "tile" ? "tile" : "list";
  const selectedRole = params.role ?? null;
  const error = params.error;

  // -------- Fetch tenant listings + intents in parallel --------
  const [{ data: intents }, { data: tenantListings }, { data: clientProfile }] =
    await Promise.all([
      supabase
        .from("tenant_hiring_intents")
        .select("sales_role")
        .eq("tenant_id", hiring.tenant_id)
        .eq("status", "active"),
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

  const activeIntentRoles = new Set(
    (intents ?? []).map((i) => i.sales_role as string),
  );

  type TenantListingRow = {
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
  const listings = (tenantListings ?? []) as unknown as TenantListingRow[];

  // Determine which listing to match against.
  const selectedListingId =
    (params.listing && listings.find((l) => l.id === params.listing)?.id) ||
    listings[0]?.id ||
    null;
  const selectedListingRow = listings.find((l) => l.id === selectedListingId);
  const selectedListingForMatch: ListingForMatch | null = selectedListingRow
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

  // -------- Fetch candidate data --------
  // NOTE: candidate_profiles is NOT directly embeddable on candidate_specialties
  // — the two tables relate only through users, so PostgREST rejects the embed
  // (which silently returned zero candidates). Fetch specialties first, then
  // load the matching profiles by user_id and join them in memory.
  const { data: specRows } = await supabase
    .from("candidate_specialties")
    .select("user_id, sales_role, users!inner(first_name, last_name)")
    .limit(500);

  const specialtyUserIds = Array.from(
    new Set((specRows ?? []).map((r) => (r as { user_id: string }).user_id)),
  );

  const { data: profileRows } =
    specialtyUserIds.length > 0
      ? await supabase
          .from("candidate_profiles")
          .select(
            "user_id, headline, photo_url, years_of_experience, education, sales_types, deal_amounts, decision_makers, sales_environments, sales_cycles, sales_volumes, lead_types, technologies, industry_slugs, city, state_region, visibility",
          )
          .in("user_id", specialtyUserIds)
      : { data: [] };

  type ProfileRow = {
    user_id: string;
    headline: string | null;
    photo_url: string | null;
    years_of_experience: number | null;
    education: string | null;
    sales_types: string[] | null;
    deal_amounts: string[] | null;
    decision_makers: string[] | null;
    sales_environments: string[] | null;
    sales_cycles: string[] | null;
    sales_volumes: string[] | null;
    lead_types: string[] | null;
    technologies: string[] | null;
    industry_slugs: string[] | null;
    city: string | null;
    state_region: string | null;
    visibility: string | null;
  };
  const profileByUser = new Map<string, ProfileRow>();
  for (const p of (profileRows ?? []) as unknown as ProfileRow[]) {
    profileByUser.set(p.user_id, p);
  }

  type RawRow = {
    user_id: string;
    sales_role: string;
    users: { first_name: string | null; last_name: string | null };
  };

  // Group specialties by user_id and gather ProfileForMatch data.
  const byUser = new Map<
    string,
    {
      user_id: string;
      first_name: string | null;
      last_name: string | null;
      headline: string | null;
      photo_url: string | null;
      years_of_experience: number | null;
      education: string | null;
      sales_types: string[] | null;
      deal_amounts: string[] | null;
      sales_volumes: string[] | null;
      city: string | null;
      state_region: string | null;
      visibility: string | null;
      decision_makers: string[] | null;
      sales_environments: string[] | null;
      sales_cycles: string[] | null;
      lead_types: string[] | null;
      technologies: string[] | null;
      specialties: string[];
      candidateForMatch: CandidateForMatch;
    }
  >();
  for (const r of (specRows ?? []) as unknown as RawRow[]) {
    const existing = byUser.get(r.user_id);
    if (existing) {
      existing.specialties.push(r.sales_role);
      existing.candidateForMatch.specialties = existing.specialties;
    } else {
      const cp = profileByUser.get(r.user_id) ?? null;
      byUser.set(r.user_id, {
        user_id: r.user_id,
        first_name: r.users.first_name,
        last_name: r.users.last_name,
        headline: cp?.headline ?? null,
        photo_url: cp?.photo_url ?? null,
        years_of_experience: cp?.years_of_experience ?? null,
        education: cp?.education ?? null,
        sales_types: cp?.sales_types ?? null,
        deal_amounts: cp?.deal_amounts ?? null,
        sales_volumes: cp?.sales_volumes ?? null,
        city: cp?.city ?? null,
        state_region: cp?.state_region ?? null,
        visibility: cp?.visibility ?? null,
        decision_makers: cp?.decision_makers ?? null,
        sales_environments: cp?.sales_environments ?? null,
        sales_cycles: cp?.sales_cycles ?? null,
        lead_types: cp?.lead_types ?? null,
        technologies: cp?.technologies ?? null,
        specialties: [r.sales_role],
        candidateForMatch: {
          years_of_experience: cp?.years_of_experience ?? null,
          education: cp?.education ?? null,
          industry_slugs: cp?.industry_slugs ?? null,
          sales_types: cp?.sales_types ?? null,
          decision_makers: cp?.decision_makers ?? null,
          sales_environments: cp?.sales_environments ?? null,
          sales_cycles: cp?.sales_cycles ?? null,
          deal_amounts: cp?.deal_amounts ?? null,
          sales_volumes: cp?.sales_volumes ?? null,
          lead_types: cp?.lead_types ?? null,
          technologies: cp?.technologies ?? null,
          specialties: [r.sales_role],
        },
      });
    }
  }
  const candidateEntries = Array.from(byUser.values());
  const candidateIds = candidateEntries.map((c) => c.user_id);

  // Fetch goals for every candidate we'll score.
  const { data: goalsRows } =
    candidateIds.length > 0
      ? await supabase
          .from("candidate_goals")
          .select(
            "user_id, minimum_compensation, company_age_min, company_headcount_min, industries, sales_roles, commitment, benefits, compensation_types",
          )
          .in("user_id", candidateIds)
      : { data: [] };
  const goalsByUser = new Map<string, CandidateGoals>();
  for (const g of (goalsRows ?? []) as unknown as Array<
    { user_id: string } & CandidateGoals
  >) {
    goalsByUser.set(g.user_id, g);
  }

  // Compute matches per candidate against the selected listing (if any).
  const candidates: CandidateRow[] = candidateEntries.map((c) => {
    let expScore = 0;
    let goalsScore = 0;
    let expScored = 0;
    let goalsScored = 0;
    if (selectedListingForMatch) {
      const expM = computeExperienceMatch(
        c.candidateForMatch,
        selectedListingForMatch,
      );
      const goalsM = computeGoalsMatch(
        goalsByUser.get(c.user_id) ?? null,
        selectedListingForMatch,
      );
      expScore = expM.score;
      expScored = expM.scored;
      goalsScore = goalsM.score;
      goalsScored = goalsM.scored;
    }
    return {
      user_id: c.user_id,
      first_name: c.first_name,
      last_name: c.last_name,
      headline: c.headline,
      photo_url: c.photo_url,
      years_of_experience: c.years_of_experience,
      education: c.education,
      sales_types: c.sales_types,
      deal_amounts: c.deal_amounts,
      sales_volumes: c.sales_volumes,
      city: c.city,
      state_region: c.state_region,
      visibility: c.visibility,
      decision_makers: c.decision_makers,
      sales_environments: c.sales_environments,
      sales_cycles: c.sales_cycles,
      lead_types: c.lead_types,
      technologies: c.technologies,
      specialties: c.specialties,
      experienceMatch: expScore,
      goalsMatch: goalsScore,
      experienceScored: expScored,
      goalsScored: goalsScored,
    };
  });

  // Show ALL candidates by default — never hide a rep just because their role
  // isn't what this company is actively hiring for. A specific role chip is the
  // only thing that narrows the list; ranking (below) surfaces best-fit first.
  const filtered = candidates.filter((c) => {
    if (selectedRole && selectedRole !== "all") {
      return new Set(c.specialties).has(selectedRole);
    }
    return true;
  });

  // Rank best-fit first, but NEVER exclude: weaker matches simply sink lower.
  if (selectedListingForMatch) {
    filtered.sort(
      (a, b) =>
        b.experienceMatch + b.goalsMatch - (a.experienceMatch + a.goalsMatch),
    );
  } else {
    // No listing to score against — order by overlap with the roles this
    // company is hiring for, then by experience, so the most relevant lead.
    const overlap = (c: CandidateRow) =>
      c.specialties.reduce((n, r) => n + (activeIntentRoles.has(r) ? 1 : 0), 0);
    filtered.sort(
      (a, b) =>
        overlap(b) - overlap(a) ||
        (b.years_of_experience ?? 0) - (a.years_of_experience ?? 0),
    );
  }

  // Application status per candidate for badge overlays.
  const { data: appRows } = await supabase
    .from("applications")
    .select("candidate_user_id, status")
    .eq("tenant_id", hiring.tenant_id)
    .in("status", ["invited", "interviewing", "withdrawn"]);
  type AppStatus = "invited" | "interviewing" | "withdrawn";
  const statusByCandidate = new Map<string, AppStatus>();
  for (const r of appRows ?? []) {
    statusByCandidate.set(
      r.candidate_user_id as string,
      r.status as AppStatus,
    );
  }

  // Which of these candidates the current user has bookmarked ("saved reps").
  const { data: bookmarkRows } =
    candidateIds.length > 0
      ? await supabase
          .from("bookmarks")
          .select("target_id")
          .eq("owner_user_id", user.id)
          .eq("target_type", "candidate")
          .in("target_id", candidateIds)
      : { data: [] };
  const bookmarkedCandidates = new Set(
    (bookmarkRows ?? []).map((b) => b.target_id as string),
  );

  const baseQs = new URLSearchParams();
  if (selectedListingId) baseQs.set("listing", selectedListingId);
  if (selectedRole) baseQs.set("role", selectedRole);
  const qsWith = (extra: Record<string, string>) => {
    const p = new URLSearchParams(baseQs);
    for (const [k, v] of Object.entries(extra)) p.set(k, v);
    return `?${p.toString()}`;
  };

  return (
    <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
      <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Candidates</h1>
          <p className="text-sm text-light-grey mt-0.5">
            {hiring.tenants.name} · click Invite on candidates who fit
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-light-grey">View:</span>
          <Link
            href={qsWith({ view: "list" })}
            className={`rounded px-2 py-1 ${view === "list" ? "bg-primary text-white" : "border border-zinc-300 dark:border-zinc-700"}`}
          >
            List
          </Link>
          <Link
            href={qsWith({ view: "tile" })}
            className={`rounded px-2 py-1 ${view === "tile" ? "bg-primary text-white" : "border border-zinc-300 dark:border-zinc-700"}`}
          >
            Tile
          </Link>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded border border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-900 p-3 text-sm text-red-800 dark:text-red-200"
        >
          {error}
        </div>
      )}

      {/* Listing selector — controls which listing we score matches against */}
      {listings.length > 0 && (
        <div className="mb-4 rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-3 flex items-center gap-3 flex-wrap">
          <span className="text-xs uppercase tracking-wider font-semibold text-light-grey">
            Match against
          </span>
          <MatchListingSelect
            listings={listings.map((l) => ({ id: l.id, title: l.title }))}
            selectedId={selectedListingId}
          />
          <span className="text-xs text-light-grey">
            Candidates ranked by combined score.
          </span>
        </div>
      )}
      {listings.length === 0 && (
        <div className="mb-4 rounded-lg border border-warning/40 bg-warning/5 p-3 text-xs text-light-grey">
          You don&apos;t have any published listings yet — match scores stay
          at 0 until you{" "}
          <Link
            href="/company/listings/new"
            className="text-primary underline"
          >
            post a listing
          </Link>
          .
        </div>
      )}

      {intents && intents.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-light-grey">Filter:</span>
          <Link
            href={qsWith({}).replace(/&?role=[^&]*/, "")}
            className={`text-xs rounded px-2 py-1 ${!selectedRole ? "bg-zinc-200 dark:bg-zinc-800" : "border border-zinc-300 dark:border-zinc-700"}`}
          >
            My hiring roles
          </Link>
          <Link
            href={qsWith({ role: "all" })}
            className={`text-xs rounded px-2 py-1 ${selectedRole === "all" ? "bg-zinc-200 dark:bg-zinc-800" : "border border-zinc-300 dark:border-zinc-700"}`}
          >
            All roles
          </Link>
          {intents.map((i) => (
            <Link
              key={i.sales_role}
              href={qsWith({ role: i.sales_role })}
              className={`text-xs rounded px-2 py-1 ${selectedRole === i.sales_role ? "bg-zinc-200 dark:bg-zinc-800" : "border border-zinc-300 dark:border-zinc-700"}`}
            >
              {i.sales_role}
            </Link>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="p-8 text-center border border-zinc-200 dark:border-zinc-800 rounded">
          <p className="text-sm text-light-grey mb-2">
            {candidates.length === 0
              ? "No sales reps have signed up yet."
              : "No reps match your active hiring roles."}
          </p>
          <p className="text-xs text-light-grey">
            {candidates.length === 0 ? (
              "Once sales reps sign up, they'll appear here."
            ) : (
              <>
                Try{" "}
                <Link href={qsWith({ role: "all" })} className="underline">
                  All roles
                </Link>
                .
              </>
            )}
          </p>
        </div>
      ) : view === "tile" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <CandidateCard
              key={c.user_id}
              candidate={c}
              status={statusByCandidate.get(c.user_id) ?? null}
              view="tile"
              showMatch={!!selectedListingForMatch}
              listingId={selectedListingId}
              isBookmarked={bookmarkedCandidates.has(c.user_id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <CandidateCard
              key={c.user_id}
              candidate={c}
              status={statusByCandidate.get(c.user_id) ?? null}
              view="list"
              showMatch={!!selectedListingForMatch}
              listingId={selectedListingId}
              isBookmarked={bookmarkedCandidates.has(c.user_id)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function displayName(c: CandidateRow): string {
  const fn = c.first_name?.trim();
  const ln = c.last_name?.trim();
  if (fn || ln) return `${fn ?? ""} ${ln ?? ""}`.trim();
  return "Candidate";
}

function initials(c: CandidateRow): string {
  const fn = c.first_name?.trim();
  const ln = c.last_name?.trim();
  const a = fn?.[0] ?? "";
  const b = ln?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

// Sales-volume / deal-size ranges are stored low→high; show the top band a
// rep has worked, since that's the headline number a hiring manager scans for.
const VOLUME_ORDER = [
  "$0 - $100,000", "$100,000 - $250,000", "$250,000 - $500,000",
  "$500,000 - $1M", "$1M - $2M", "$2M - $5M", "$5M+",
];
const DEAL_ORDER = [
  "$0 - $5000", "$5000 - $20,000", "$20,000 - $50,000", "$50,000 - $100,000",
  "$100,000 - $500,000", "$500,000 - $1M", "$1M+",
];
function topRange(arr: string[] | null, order: string[]): string | null {
  if (!arr || arr.length === 0) return null;
  let best: string | null = null;
  let bestIdx = -1;
  for (const v of arr) {
    const i = order.indexOf(v);
    if (i > bestIdx) { bestIdx = i; best = v; }
  }
  return best ?? arr[0];
}
function locationOf(c: CandidateRow): string | null {
  const parts = [c.city?.trim(), c.state_region?.trim()].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 dark:bg-white/[0.03] ring-1 ring-zinc-200 dark:ring-white/[0.06] px-3 py-2 min-w-[104px]">
      <div className="text-[9px] uppercase tracking-wider font-semibold text-light-grey">
        {label}
      </div>
      <div className="text-sm font-bold text-foreground tabular-nums leading-tight mt-0.5 whitespace-nowrap">
        {value}
      </div>
    </div>
  );
}

function CandidateCard({
  candidate,
  status,
  view,
  showMatch,
  listingId,
  isBookmarked,
}: {
  candidate: CandidateRow;
  status: "invited" | "interviewing" | "withdrawn" | null;
  view: "tile" | "list";
  showMatch: boolean;
  listingId: string | null;
  isBookmarked: boolean;
}) {
  const specialties = candidate.specialties;
  const name = displayName(candidate);
  const inits = initials(candidate);
  const location = locationOf(candidate);
  const topVolume = topRange(candidate.sales_volumes, VOLUME_ORDER);
  const topDeal = topRange(candidate.deal_amounts, DEAL_ORDER);
  const detailHref = listingId
    ? `/profiles/${candidate.user_id}?listing=${listingId}`
    : `/profiles/${candidate.user_id}`;

  const Avatar = (
    <div
      className="h-14 w-14 shrink-0 rounded-full flex items-center justify-center text-base font-bold bg-gradient-to-br from-primary/25 to-primary/5 ring-1 ring-primary/20 text-foreground bg-cover bg-center"
      style={
        candidate.photo_url
          ? { backgroundImage: `url(${candidate.photo_url})` }
          : undefined
      }
    >
      {!candidate.photo_url && inits}
    </div>
  );

  // Bookmark — top-right of the card, empty with a red border so it stands out;
  // fills solid once saved.
  const BookmarkBtn = (
    <form action={toggleCandidateBookmark} className="contents">
      <input type="hidden" name="candidate_user_id" value={candidate.user_id} />
      <button
        type="submit"
        title={isBookmarked ? "Saved — click to remove" : "Save this rep"}
        aria-label={isBookmarked ? "Saved — click to remove" : "Save this rep"}
        className={`p-1.5 rounded-lg border transition-colors ${
          isBookmarked
            ? "border-primary bg-primary/10 hover:bg-primary/15"
            : "border-danger/80 bg-transparent hover:bg-danger/10"
        }`}
      >
        {isBookmarked ? (
          <BookmarkSolid className="h-5 w-5 text-primary" />
        ) : (
          <BookmarkOutline className="h-5 w-5 text-danger" />
        )}
      </button>
    </form>
  );

  let InviteBtn: React.ReactNode;
  if (status === "interviewing") {
    InviteBtn = (
      <span className="inline-flex items-center gap-1 text-xs bg-interviewing/10 text-interviewing rounded-lg px-3 py-2 font-medium">
        <CheckIcon className="h-3.5 w-3.5" />
        Interested
      </span>
    );
  } else if (status === "invited") {
    InviteBtn = (
      <span className="inline-flex items-center gap-1 text-xs bg-invited/10 text-invited rounded-lg px-3 py-2 font-medium">
        <CheckIcon className="h-3.5 w-3.5" />
        Awaiting reply
      </span>
    );
  } else if (status === "withdrawn") {
    InviteBtn = (
      <span className="inline-flex items-center gap-1 text-xs bg-zinc-200 dark:bg-zinc-800 text-light-grey rounded-lg px-3 py-2 font-medium">
        Passed
      </span>
    );
  } else {
    InviteBtn = (
      <form action={inviteCandidate} className="contents">
        <input type="hidden" name="candidate_user_id" value={candidate.user_id} />
        <button
          type="submit"
          className="w-full sm:w-auto text-sm rounded-lg bg-primary text-white px-5 py-2 font-semibold hover:opacity-90 transition-opacity shadow-sm shadow-primary/20"
        >
          Invite
        </button>
      </form>
    );
  }

  const MatchBlock = showMatch ? (
    <MatchBadges
      size="sm"
      experience={candidate.experienceMatch}
      goals={candidate.goalsMatch}
      experienceScored={candidate.experienceScored}
      goalsScored={candidate.goalsScored}
      experienceLabel="Exp"
      goalsLabel="Goals"
      experienceTooltip={EXPERIENCE_TOOLTIP}
      goalsTooltip={GOALS_TOOLTIP}
      emptyExperienceTooltip={EMPTY_EXPERIENCE_TOOLTIP}
      emptyGoalsTooltip={EMPTY_GOALS_TOOLTIP}
    />
  ) : null;

  const MetaRow = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-light-grey">
      {location && (
        <span className="inline-flex items-center gap-1">
          <MapPinIcon className="h-3.5 w-3.5" />
          {location}
        </span>
      )}
      {candidate.education && (
        <span className="inline-flex items-center gap-1">
          <AcademicCapIcon className="h-3.5 w-3.5" />
          {candidate.education}
        </span>
      )}
    </div>
  );

  const Chips = (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {specialties.map((r) => (
        <span
          key={r}
          className="text-[11px] bg-primary/10 text-primary rounded-full px-2.5 py-0.5 font-semibold"
        >
          {r}
        </span>
      ))}
      {candidate.sales_types?.map((t) => (
        <span
          key={t}
          className="text-[11px] bg-zinc-100 dark:bg-white/[0.06] text-light-grey rounded-full px-2.5 py-0.5"
        >
          {t}
        </span>
      ))}
    </div>
  );

  const Stats = (
    <div className="flex flex-wrap gap-2">
      {candidate.years_of_experience != null && (
        <Stat label="Experience" value={`${candidate.years_of_experience} yrs`} />
      )}
      {topVolume && <Stat label="Annual volume" value={topVolume} />}
      {topDeal && <Stat label="Top deal" value={topDeal} />}
    </div>
  );

  // Richer attribute list — shown in the List view only (Tile stays compact
  // and sends people to the full profile via "See more").
  const detailRows: { label: string; values: string[] | null }[] = [
    { label: "Sells to", values: candidate.decision_makers },
    { label: "Environment", values: candidate.sales_environments },
    { label: "Sales cycle", values: candidate.sales_cycles },
    { label: "Leads", values: candidate.lead_types },
    { label: "Tools", values: candidate.technologies },
  ];
  const MoreDetails = (
    <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-xs max-w-2xl">
      {detailRows
        .filter((d) => d.values && d.values.length > 0)
        .map((d) => (
          <div key={d.label} className="flex gap-1.5 min-w-0">
            <dt className="text-light-grey shrink-0">{d.label}:</dt>
            <dd className="text-foreground/80 truncate">
              {d.values!.join(", ")}
            </dd>
          </div>
        ))}
    </dl>
  );

  if (view === "tile") {
    return (
      <article className="relative rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-5 hover:border-primary/30 hover:shadow-lg transition-all">
        <div className="absolute top-3 right-3">{BookmarkBtn}</div>
        <div className="flex items-start gap-3 pr-10">
          {Avatar}
          <div className="min-w-0">
            <Link
              href={detailHref}
              className="font-bold hover:text-primary transition-colors block truncate"
            >
              {name}
            </Link>
            {MetaRow}
          </div>
        </div>
        {candidate.headline && (
          <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-3 line-clamp-2">
            {candidate.headline}
          </p>
        )}
        {showMatch && <div className="mt-3">{MatchBlock}</div>}
        <div className="mt-3">{Stats}</div>
        {Chips}
        <div className="mt-4 flex items-center justify-between gap-3">
          <Link
            href={detailHref}
            className="text-xs font-semibold text-primary hover:underline whitespace-nowrap"
          >
            See more →
          </Link>
          {InviteBtn}
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-5 hover:border-primary/30 hover:shadow-lg transition-all">
      <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-6">
        {/* Identity */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {Avatar}
          <div className="min-w-0">
            <Link
              href={detailHref}
              className="text-lg font-bold hover:text-primary transition-colors"
            >
              {name}
            </Link>
            {MetaRow}
            {candidate.headline && (
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1.5 line-clamp-2 max-w-2xl">
                {candidate.headline}
              </p>
            )}
            {Chips}
            {MoreDetails}
          </div>
        </div>

        {/* Right rail: bookmark (top-right) + match + key stats + action */}
        <div className="flex flex-col gap-3 lg:items-end lg:shrink-0">
          <div className="self-end">{BookmarkBtn}</div>
          {showMatch && MatchBlock}
          {Stats}
          <div className="w-full sm:w-auto">{InviteBtn}</div>
        </div>
      </div>
    </article>
  );
}
