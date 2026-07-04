import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckIcon } from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";
import { inviteCandidate } from "./actions";
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
  "How well this rep's experience matches your listing's requirements.";
const GOALS_TOOLTIP =
  "How well what you're offering matches what this rep says they want next.";

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
  years_of_experience: number | null;
  sales_types: string[] | null;
  deal_amounts: string[] | null;
  visibility: string | null;
  specialties: string[];
  experienceMatch: number;
  goalsMatch: number;
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
  const { data: rawRows } = await supabase
    .from("candidate_specialties")
    .select(
      "user_id, sales_role, users!inner(first_name, last_name), candidate_profiles(headline, years_of_experience, education, sales_types, deal_amounts, decision_makers, sales_environments, sales_cycles, sales_volumes, lead_types, technologies, industry_slugs, visibility)",
    )
    .limit(500);

  type RawRow = {
    user_id: string;
    sales_role: string;
    users: { first_name: string | null; last_name: string | null };
    candidate_profiles: {
      headline: string | null;
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
      visibility: string | null;
    } | null;
  };

  // Group specialties by user_id and gather ProfileForMatch data.
  const byUser = new Map<
    string,
    {
      user_id: string;
      first_name: string | null;
      last_name: string | null;
      headline: string | null;
      years_of_experience: number | null;
      sales_types: string[] | null;
      deal_amounts: string[] | null;
      visibility: string | null;
      specialties: string[];
      candidateForMatch: CandidateForMatch;
    }
  >();
  for (const r of (rawRows ?? []) as unknown as RawRow[]) {
    const existing = byUser.get(r.user_id);
    if (existing) {
      existing.specialties.push(r.sales_role);
      existing.candidateForMatch.specialties = existing.specialties;
    } else {
      const cp = r.candidate_profiles;
      byUser.set(r.user_id, {
        user_id: r.user_id,
        first_name: r.users.first_name,
        last_name: r.users.last_name,
        headline: cp?.headline ?? null,
        years_of_experience: cp?.years_of_experience ?? null,
        sales_types: cp?.sales_types ?? null,
        deal_amounts: cp?.deal_amounts ?? null,
        visibility: cp?.visibility ?? null,
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
            "user_id, minimum_compensation, company_age_max, company_headcount_max, industries, sales_roles, commitment, benefits, compensation_types",
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
    if (selectedListingForMatch) {
      expScore = computeExperienceMatch(
        c.candidateForMatch,
        selectedListingForMatch,
      ).score;
      goalsScore = computeGoalsMatch(
        goalsByUser.get(c.user_id) ?? null,
        selectedListingForMatch,
      ).score;
    }
    return {
      user_id: c.user_id,
      first_name: c.first_name,
      last_name: c.last_name,
      headline: c.headline,
      years_of_experience: c.years_of_experience,
      sales_types: c.sales_types,
      deal_amounts: c.deal_amounts,
      visibility: c.visibility,
      specialties: c.specialties,
      experienceMatch: expScore,
      goalsMatch: goalsScore,
    };
  });

  // Filter by chip selection OR default to hiring intents' roles.
  const filtered = candidates.filter((c) => {
    const specialtySet = new Set(c.specialties);
    if (selectedRole === "all") return true;
    if (selectedRole) return specialtySet.has(selectedRole);
    if (activeIntentRoles.size === 0) return true;
    for (const r of activeIntentRoles) {
      if (specialtySet.has(r)) return true;
    }
    return false;
  });

  // Rank by combined match score when a listing is selected.
  if (selectedListingForMatch) {
    filtered.sort(
      (a, b) =>
        b.experienceMatch + b.goalsMatch - (a.experienceMatch + a.goalsMatch),
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

  const baseQs = new URLSearchParams();
  if (selectedListingId) baseQs.set("listing", selectedListingId);
  if (selectedRole) baseQs.set("role", selectedRole);
  const qsWith = (extra: Record<string, string>) => {
    const p = new URLSearchParams(baseQs);
    for (const [k, v] of Object.entries(extra)) p.set(k, v);
    return `?${p.toString()}`;
  };

  return (
    <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
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
          <form method="get" className="contents">
            {/* Preserve other query params on submit */}
            {selectedRole && (
              <input type="hidden" name="role" value={selectedRole} />
            )}
            <input type="hidden" name="view" value={view} />
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

function CandidateCard({
  candidate,
  status,
  view,
  showMatch,
  listingId,
}: {
  candidate: CandidateRow;
  status: "invited" | "interviewing" | "withdrawn" | null;
  view: "tile" | "list";
  showMatch: boolean;
  listingId: string | null;
}) {
  const specialties = candidate.specialties;
  const name = displayName(candidate);
  const inits = initials(candidate);
  const detailHref = listingId
    ? `/candidates/${candidate.user_id}?listing=${listingId}`
    : `/candidates/${candidate.user_id}`;

  let InviteBtn: React.ReactNode;
  if (status === "interviewing") {
    InviteBtn = (
      <span className="inline-flex items-center gap-1 text-xs bg-interviewing/10 text-interviewing rounded px-2 py-1 font-medium">
        <CheckIcon className="h-3 w-3" />
        Interested
      </span>
    );
  } else if (status === "invited") {
    InviteBtn = (
      <span className="inline-flex items-center gap-1 text-xs bg-invited/10 text-invited rounded px-2 py-1 font-medium">
        <CheckIcon className="h-3 w-3" />
        Awaiting reply
      </span>
    );
  } else if (status === "withdrawn") {
    InviteBtn = (
      <span className="inline-flex items-center gap-1 text-xs bg-zinc-200 dark:bg-zinc-800 text-light-grey rounded px-2 py-1 font-medium">
        Passed
      </span>
    );
  } else {
    InviteBtn = (
      <form action={inviteCandidate} className="contents">
        <input
          type="hidden"
          name="candidate_user_id"
          value={candidate.user_id}
        />
        <button
          type="submit"
          className="text-xs rounded bg-primary text-white px-3 py-1.5 font-medium hover:opacity-90"
        >
          Invite
        </button>
      </form>
    );
  }

  if (view === "tile") {
    return (
      <article className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-sm font-semibold">
            {inits}
          </div>
          <div className="flex-1">
            <Link
              href={detailHref}
              className="font-semibold text-sm hover:text-primary transition-colors"
            >
              {name}
            </Link>
            {candidate.years_of_experience != null && (
              <p className="text-xs text-light-grey">
                {candidate.years_of_experience} yrs experience
              </p>
            )}
          </div>
        </div>
        {showMatch && (
          <div className="mb-2">
            <MatchBadges
              size="sm"
              experience={candidate.experienceMatch}
              goals={candidate.goalsMatch}
              experienceLabel="Exp"
              goalsLabel="Goals"
              experienceTooltip={EXPERIENCE_TOOLTIP}
              goalsTooltip={GOALS_TOOLTIP}
            />
          </div>
        )}
        {candidate.headline && (
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">
            {candidate.headline}
          </p>
        )}
        <div className="flex flex-wrap gap-1 mb-3">
          {specialties.map((r) => (
            <span
              key={r}
              className="text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5 font-semibold"
            >
              {r}
            </span>
          ))}
          {candidate.sales_types?.map((t) => (
            <span
              key={t}
              className="text-[10px] bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5"
            >
              {t}
            </span>
          ))}
        </div>
        <div className="flex justify-end">{InviteBtn}</div>
      </article>
    );
  }

  return (
    <article className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex items-start gap-4">
      <div className="w-12 h-12 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-sm font-semibold">
        {inits}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3 mb-1 flex-wrap">
          <Link
            href={detailHref}
            className="font-semibold hover:text-primary transition-colors"
          >
            {name}
          </Link>
          {candidate.years_of_experience != null && (
            <span className="text-xs text-light-grey">
              {candidate.years_of_experience} yrs experience
            </span>
          )}
        </div>
        {showMatch && (
          <div className="mb-2">
            <MatchBadges
              size="sm"
              experience={candidate.experienceMatch}
              goals={candidate.goalsMatch}
              experienceLabel="Exp"
              goalsLabel="Goals"
              experienceTooltip={EXPERIENCE_TOOLTIP}
              goalsTooltip={GOALS_TOOLTIP}
            />
          </div>
        )}
        {candidate.headline && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            {candidate.headline}
          </p>
        )}
        <div className="flex flex-wrap gap-1 text-xs">
          {specialties.map((r) => (
            <span
              key={r}
              className="bg-primary/10 text-primary rounded px-2 py-0.5 font-semibold"
            >
              {r}
            </span>
          ))}
          {candidate.sales_types?.map((t) => (
            <span
              key={t}
              className="bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-0.5"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="shrink-0">{InviteBtn}</div>
    </article>
  );
}
