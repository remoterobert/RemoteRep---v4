import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckIcon } from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";
import { inviteCandidate } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  view?: "list" | "tile";
  role?: string;
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

  const { data: intents } = await supabase
    .from("tenant_hiring_intents")
    .select("sales_role")
    .eq("tenant_id", hiring.tenant_id)
    .eq("status", "active");

  const params = await searchParams;
  const view = params.view === "tile" ? "tile" : "list";
  const selectedRole = params.role ?? null;
  const error = params.error;

  const activeIntentRoles = new Set(
    (intents ?? []).map((i) => i.sales_role as string),
  );

  // Get every user who's a candidate (has at least one specialty), plus
  // their profile if it exists. No visibility filter — MVP shows all reps
  // regardless of profile completeness. A "hidden" toggle can filter here
  // in a later phase.
  const { data: rawRows } = await supabase
    .from("candidate_specialties")
    .select(
      "user_id, sales_role, users!inner(first_name, last_name), candidate_profiles(headline, years_of_experience, sales_types, deal_amounts, visibility)",
    )
    .limit(500);

  type RawRow = {
    user_id: string;
    sales_role: string;
    users: { first_name: string | null; last_name: string | null };
    candidate_profiles: {
      headline: string | null;
      years_of_experience: number | null;
      sales_types: string[] | null;
      deal_amounts: string[] | null;
      visibility: string | null;
    } | null;
  };

  // Group specialties by user_id
  const byUser = new Map<string, CandidateRow>();
  for (const r of (rawRows ?? []) as unknown as RawRow[]) {
    const existing = byUser.get(r.user_id);
    if (existing) {
      existing.specialties.push(r.sales_role);
    } else {
      byUser.set(r.user_id, {
        user_id: r.user_id,
        first_name: r.users.first_name,
        last_name: r.users.last_name,
        headline: r.candidate_profiles?.headline ?? null,
        years_of_experience:
          r.candidate_profiles?.years_of_experience ?? null,
        sales_types: r.candidate_profiles?.sales_types ?? null,
        deal_amounts: r.candidate_profiles?.deal_amounts ?? null,
        visibility: r.candidate_profiles?.visibility ?? null,
        specialties: [r.sales_role],
      });
    }
  }
  const candidates = Array.from(byUser.values());

  // Filter by chip selection OR default to hiring intents' roles
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

  // Fetch existing applications for this tenant so we can reflect the current
  // status of each candidate on the browse cards.
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
            href={`?view=list${selectedRole ? `&role=${encodeURIComponent(selectedRole)}` : ""}`}
            className={`rounded px-2 py-1 ${view === "list" ? "bg-primary text-white" : "border border-zinc-300 dark:border-zinc-700"}`}
          >
            List
          </Link>
          <Link
            href={`?view=tile${selectedRole ? `&role=${encodeURIComponent(selectedRole)}` : ""}`}
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

      {intents && intents.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-light-grey">Filter:</span>
          <Link
            href={`?view=${view}`}
            className={`text-xs rounded px-2 py-1 ${!selectedRole ? "bg-zinc-200 dark:bg-zinc-800" : "border border-zinc-300 dark:border-zinc-700"}`}
          >
            My hiring roles
          </Link>
          <Link
            href={`?view=${view}&role=all`}
            className={`text-xs rounded px-2 py-1 ${selectedRole === "all" ? "bg-zinc-200 dark:bg-zinc-800" : "border border-zinc-300 dark:border-zinc-700"}`}
          >
            All roles
          </Link>
          {intents.map((i) => (
            <Link
              key={i.sales_role}
              href={`?view=${view}&role=${encodeURIComponent(i.sales_role)}`}
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
                <Link href={`?view=${view}&role=all`} className="underline">
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
}: {
  candidate: CandidateRow;
  status: "invited" | "interviewing" | "withdrawn" | null;
  view: "tile" | "list";
}) {
  const specialties = candidate.specialties;
  const name = displayName(candidate);
  const inits = initials(candidate);

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
            <h2 className="font-semibold text-sm">{name}</h2>
            {candidate.years_of_experience != null && (
              <p className="text-xs text-light-grey">
                {candidate.years_of_experience} yrs experience
              </p>
            )}
          </div>
        </div>
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
          <h2 className="font-semibold">{name}</h2>
          {candidate.years_of_experience != null && (
            <span className="text-xs text-light-grey">
              {candidate.years_of_experience} yrs experience
            </span>
          )}
        </div>
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
