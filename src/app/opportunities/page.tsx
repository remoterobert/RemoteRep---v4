import Link from "next/link";
import { redirect } from "next/navigation";
import { BookmarkIcon as BookmarkOutline } from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolid } from "@heroicons/react/24/solid";
import { createClient } from "@/lib/supabase/server";
import { toggleOpportunityBookmark } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ view?: "list" | "tile"; role?: string }>;

type ListingRow = {
  id: string;
  title: string;
  description: string;
  published_at: string | null;
  created_at: string;
  tenants: { name: string } | { name: string }[] | null;
  listing_details:
    | {
        sales_role: string | null;
        commitment: string[] | null;
        compensation_type: string[] | null;
        minimum_compensation: number | null;
        benefits: string[] | null;
      }
    | Array<{
        sales_role: string | null;
        commitment: string[] | null;
        compensation_type: string[] | null;
        minimum_compensation: number | null;
        benefits: string[] | null;
      }>
    | null;
  listing_requirements:
    | { deal_amounts: string[] | null }
    | Array<{ deal_amounts: string[] | null }>
    | null;
};

type NormalizedListing = {
  id: string;
  title: string;
  companyName: string;
  companyInitials: string;
  shortDescription: string;
  salesRole: string;
  commitment: string;
  dealRange: string;
  compensationSummary: string;
  postedDaysAgo: number;
};

function unwrapOne<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function normalize(row: ListingRow): NormalizedListing {
  const tenant = unwrapOne(row.tenants);
  const details = unwrapOne(row.listing_details);
  const reqs = unwrapOne(row.listing_requirements);

  const companyName = tenant?.name ?? "Company";
  const companyInitials = companyName
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  const shortDescription = row.description
    .replace(/^#{1,6}\s+.*$/gm, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);

  const dealRange =
    reqs?.deal_amounts && reqs.deal_amounts.length > 0
      ? reqs.deal_amounts[0]
      : "";

  const compensationSummary = details
    ? [
        details.compensation_type?.length
          ? details.compensation_type.join(" / ")
          : null,
        details.minimum_compensation
          ? `$${details.minimum_compensation.toLocaleString()}+`
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  const publishedAt = row.published_at ?? row.created_at;
  const postedDaysAgo = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24),
    ),
  );

  return {
    id: row.id,
    title: row.title,
    companyName,
    companyInitials,
    shortDescription,
    salesRole: details?.sales_role ?? "",
    commitment: details?.commitment?.join(" / ") ?? "",
    dealRange,
    compensationSummary,
    postedDaysAgo,
  };
}

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

  const { data: specialtiesData } = await supabase
    .from("candidate_specialties")
    .select("sales_role")
    .eq("user_id", user.id);
  const specialties = new Set(
    (specialtiesData ?? []).map((s) => s.sales_role as string),
  );

  const { data: bookmarkRows } = await supabase
    .from("bookmarks")
    .select("target_id")
    .eq("owner_user_id", user.id)
    .eq("target_type", "listing");
  const bookmarked = new Set(
    (bookmarkRows ?? []).map((b) => b.target_id as string),
  );

  const params = await searchParams;
  const view = params.view === "list" ? "list" : "tile";
  const selectedRole = params.role ?? null;

  const { data: listingRows } = await supabase
    .from("listings")
    .select(
      "id, title, description, published_at, created_at, tenants(name), listing_details(sales_role, commitment, compensation_type, minimum_compensation, benefits), listing_requirements(deal_amounts)",
    )
    .eq("status", "published")
    .eq("visibility", "public")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(200);

  const normalized = ((listingRows ?? []) as unknown as ListingRow[]).map(
    normalize,
  );

  const availableRoles = Array.from(
    new Set(normalized.map((n) => n.salesRole).filter(Boolean)),
  );

  // Rank: if candidate has specialties, prioritize listings matching them
  // unless the user explicitly picked a role filter.
  let filtered = normalized;
  if (selectedRole && selectedRole !== "all") {
    filtered = filtered.filter((n) => n.salesRole === selectedRole);
  } else if (!selectedRole && specialties.size > 0) {
    // Sort: matches first, then rest.
    filtered = [...normalized].sort((a, b) => {
      const am = specialties.has(a.salesRole) ? 0 : 1;
      const bm = specialties.has(b.salesRole) ? 0 : 1;
      return am - bm;
    });
  }

  return (
    <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Opportunities</h1>
          <p className="text-sm text-light-grey mt-0.5">
            Real open roles from companies on RemoteRep. Bookmark ones that fit.
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

      {specialties.size > 0 && availableRoles.length > 0 && (
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

      {filtered.length === 0 ? (
        <div className="p-10 text-center border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl">
          <p className="text-sm text-light-grey mb-2">
            {normalized.length === 0
              ? "No live listings yet. Check back soon — companies are joining daily."
              : "No matches for that filter."}
          </p>
          {normalized.length > 0 && (
            <Link
              href={`?view=${view}&role=all`}
              className="text-sm text-primary hover:opacity-80"
            >
              See all roles →
            </Link>
          )}
        </div>
      ) : view === "tile" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((o) => (
            <OpportunityCard
              key={o.id}
              opp={o}
              isBookmarked={bookmarked.has(o.id)}
              view="tile"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <OpportunityCard
              key={o.id}
              opp={o}
              isBookmarked={bookmarked.has(o.id)}
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
  opp: NormalizedListing;
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

  const posted = opp.postedDaysAgo === 0 ? "Today" : `${opp.postedDaysAgo}d ago`;

  if (view === "tile") {
    return (
      <article className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex flex-col">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold shrink-0">
            {opp.companyInitials}
          </div>
          <div className="flex-1 min-w-0">
            <Link
              href={`/opportunities/${opp.id}`}
              className="font-semibold text-sm truncate block hover:text-primary transition-colors"
            >
              {opp.title}
            </Link>
            <p className="text-xs text-light-grey">{opp.companyName}</p>
          </div>
          {BookmarkBtn}
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-3">
          {opp.shortDescription}
        </p>
        <div className="flex flex-wrap gap-1 mb-1 mt-auto">
          {opp.salesRole && (
            <span className="text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5 font-semibold">
              {opp.salesRole}
            </span>
          )}
          {opp.commitment && (
            <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5">
              {opp.commitment}
            </span>
          )}
          {opp.dealRange && (
            <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5">
              {opp.dealRange}
            </span>
          )}
        </div>
        {opp.compensationSummary && (
          <p className="text-xs text-zinc-500 mt-2">{opp.compensationSummary}</p>
        )}
        <p className="text-xs text-light-grey mt-1">{posted}</p>
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
          <Link
            href={`/opportunities/${opp.id}`}
            className="font-semibold hover:text-primary transition-colors"
          >
            {opp.title}
          </Link>
          <span className="text-xs text-light-grey">{opp.companyName}</span>
          <span className="text-xs text-light-grey ml-auto">{posted}</span>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2 line-clamp-2">
          {opp.shortDescription}
        </p>
        <div className="flex flex-wrap gap-1 text-xs items-center">
          {opp.salesRole && (
            <span className="bg-primary/10 text-primary rounded px-2 py-0.5 font-semibold">
              {opp.salesRole}
            </span>
          )}
          {opp.commitment && (
            <span className="bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-0.5">
              {opp.commitment}
            </span>
          )}
          {opp.dealRange && (
            <span className="bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-0.5">
              {opp.dealRange}
            </span>
          )}
          {opp.compensationSummary && (
            <>
              <span className="text-light-grey mx-1">•</span>
              <span className="text-light-grey">{opp.compensationSummary}</span>
            </>
          )}
        </div>
      </div>
      {BookmarkBtn}
    </article>
  );
}
