import Link from "next/link";
import { redirect } from "next/navigation";
import { BookmarkIcon as BookmarkOutline } from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolid } from "@heroicons/react/24/solid";
import { createClient } from "@/lib/supabase/server";
import { filterByRoles, SAMPLE_OPPORTUNITIES } from "@/lib/sample-opportunities";
import { pseudoUuidFromString } from "@/lib/pseudo-uuid";
import { toggleOpportunityBookmark } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ view?: "list" | "tile"; role?: string }>;

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get candidate specialties (used for default filtering)
  const { data: specialtiesData } = await supabase
    .from("candidate_specialties")
    .select("sales_role")
    .eq("user_id", user.id);
  const specialties = (specialtiesData ?? []).map(
    (s) => s.sales_role as string,
  );

  // Get current bookmarks for this user (target_type='listing')
  const { data: bookmarkRows } = await supabase
    .from("bookmarks")
    .select("target_id")
    .eq("owner_user_id", user.id)
    .eq("target_type", "listing");
  const bookmarkedUuids = new Set(
    (bookmarkRows ?? []).map((b) => b.target_id as string),
  );

  const params = await searchParams;
  const view = params.view === "list" ? "list" : "tile";
  const selectedRole = params.role ?? null;

  // Filter by selected role (from chip) OR default to candidate's specialties.
  let opportunities;
  if (selectedRole === "all") {
    opportunities = SAMPLE_OPPORTUNITIES;
  } else if (selectedRole) {
    opportunities = filterByRoles([selectedRole]);
  } else if (specialties.length > 0) {
    opportunities = filterByRoles(specialties);
  } else {
    opportunities = SAMPLE_OPPORTUNITIES;
  }

  const availableRoles = [
    ...new Set(SAMPLE_OPPORTUNITIES.map((o) => o.sales_role)),
  ];

  return (
    <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Opportunities</h1>
          <p className="text-sm text-light-grey mt-0.5">
            Browse open roles. Bookmark ones that fit; companies also see your
            interest.
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

      <p className="text-xs text-amber-700 dark:text-amber-400 mb-4 italic">
        🚧 Sample listings for now. Real listings appear here once companies
        start posting.
      </p>

      {/* Role filter chips */}
      {specialties.length > 0 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-xs text-light-grey">Filter:</span>
          <Link
            href={`?view=${view}`}
            className={`text-xs rounded px-2 py-1 ${!selectedRole ? "bg-zinc-200 dark:bg-zinc-800" : "border border-zinc-300 dark:border-zinc-700"}`}
          >
            My roles
          </Link>
          <Link
            href={`?view=${view}&role=all`}
            className={`text-xs rounded px-2 py-1 ${selectedRole === "all" ? "bg-zinc-200 dark:bg-zinc-800" : "border border-zinc-300 dark:border-zinc-700"}`}
          >
            All
          </Link>
          {availableRoles.map((r) => (
            <Link
              key={r}
              href={`?view=${view}&role=${encodeURIComponent(r)}`}
              className={`text-xs rounded px-2 py-1 ${selectedRole === r ? "bg-zinc-200 dark:bg-zinc-800" : "border border-zinc-300 dark:border-zinc-700"}`}
            >
              {r}
            </Link>
          ))}
        </div>
      )}

      {opportunities.length === 0 ? (
        <div className="p-8 text-center text-light-grey border border-zinc-200 dark:border-zinc-800 rounded">
          No opportunities match. Try{" "}
          <Link href={`?view=${view}&role=all`} className="underline">
            All roles
          </Link>
          .
        </div>
      ) : view === "tile" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {opportunities.map((o) => (
            <OpportunityCard
              key={o.id}
              opp={o}
              isBookmarked={bookmarkedUuids.has(pseudoUuidFromString(o.id))}
              view="tile"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {opportunities.map((o) => (
            <OpportunityCard
              key={o.id}
              opp={o}
              isBookmarked={bookmarkedUuids.has(pseudoUuidFromString(o.id))}
              view="list"
            />
          ))}
        </div>
      )}
    </main>
  );
}

function OpportunityCard({
  opp,
  isBookmarked,
  view,
}: {
  opp: (typeof SAMPLE_OPPORTUNITIES)[number];
  isBookmarked: boolean;
  view: "tile" | "list";
}) {
  const BookmarkBtn = (
    <form action={toggleOpportunityBookmark} className="contents">
      <input type="hidden" name="opportunity_id" value={opp.id} />
      <button
        type="submit"
        title={isBookmarked ? "Remove bookmark" : "Bookmark this"}
        className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
        aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this"}
      >
        {isBookmarked ? (
          <BookmarkSolid className="h-5 w-5 text-primary" />
        ) : (
          <BookmarkOutline className="h-5 w-5 text-light-grey" />
        )}
      </button>
    </form>
  );

  if (view === "tile") {
    return (
      <article className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold shrink-0">
            {opp.companyInitials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm truncate">{opp.title}</h2>
            <p className="text-xs text-light-grey">{opp.company}</p>
          </div>
          {BookmarkBtn}
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">
          {opp.short_description}
        </p>
        <div className="flex flex-wrap gap-1 mb-1">
          <span className="text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5 font-semibold">
            {opp.sales_role}
          </span>
          <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5">
            {opp.commitment}
          </span>
          <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5">
            {opp.deal_range}
          </span>
        </div>
        <p className="text-xs text-zinc-500 mt-2">{opp.compensation_summary}</p>
        <p className="text-xs text-light-grey mt-1">
          {opp.posted_days_ago === 0
            ? "Today"
            : `${opp.posted_days_ago}d ago`}
        </p>
      </article>
    );
  }

  return (
    <article className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex items-start gap-4">
      <div className="w-12 h-12 shrink-0 rounded bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-sm font-semibold">
        {opp.companyInitials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3 mb-1 flex-wrap">
          <h2 className="font-semibold">{opp.title}</h2>
          <span className="text-xs text-light-grey">{opp.company}</span>
          <span className="text-xs text-light-grey ml-auto">
            {opp.posted_days_ago === 0
              ? "Today"
              : `${opp.posted_days_ago}d ago`}
          </span>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
          {opp.short_description}
        </p>
        <div className="flex flex-wrap gap-1 text-xs">
          <span className="bg-primary/10 text-primary rounded px-2 py-0.5 font-semibold">
            {opp.sales_role}
          </span>
          <span className="bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-0.5">
            {opp.commitment}
          </span>
          <span className="bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-0.5">
            {opp.deal_range}
          </span>
          <span className="text-light-grey mx-1">•</span>
          <span className="text-light-grey">{opp.compensation_summary}</span>
        </div>
      </div>
      {BookmarkBtn}
    </article>
  );
}
