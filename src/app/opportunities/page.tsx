import Link from "next/link";
import { redirect } from "next/navigation";
import { BookmarkIcon as BookmarkOutline } from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolid } from "@heroicons/react/24/solid";
import { createClient } from "@/lib/supabase/server";
import { toggleOpportunityBookmark } from "./actions";
import { FilterPanel } from "./FilterPanel";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

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
  const companyInitials =
    companyName
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

/**
 * Coerce a searchParam value into an array of strings. Next.js gives us
 * `string | string[] | undefined` per key; the filter panel appends the
 * same key multiple times so `?tech=A&tech=B` shows up as string[].
 */
function toArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
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

  const params = await searchParams;
  const view = params.view === "list" ? "list" : "tile";

  const roleParam =
    typeof params.role === "string" ? params.role : undefined;
  const minPay = typeof params.min_pay === "string" ? params.min_pay : "";
  const minExp = typeof params.min_exp === "string" ? params.min_exp : "";

  const commitmentF = toArray(params.commitment);
  const compTypeF = toArray(params.comp_type);
  const salesTypeF = toArray(params.sales_type);
  const decisionF = toArray(params.decision_maker);
  const envF = toArray(params.environment);
  const cycleF = toArray(params.cycle);
  const dealF = toArray(params.deal);
  const volumeF = toArray(params.volume);
  const leadF = toArray(params.lead);
  const techF = toArray(params.tech);
  const educationF = toArray(params.education);
  const industryF = toArray(params.industry);

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

  // Base query: every live, public listing.
  let q = supabase
    .from("listings")
    .select(
      "id, title, description, published_at, created_at, tenants(name), listing_details!inner(sales_role, commitment, compensation_type, minimum_compensation, benefits), listing_requirements!inner(deal_amounts, sales_types, decision_makers, sales_environments, sales_cycles, sales_volumes, lead_types, technologies, education, industries, years_of_experience_min)",
    )
    .eq("status", "published")
    .eq("visibility", "public")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(200);

  // Apply single-value filters against listing_details.
  if (roleParam) {
    q = q.eq("listing_details.sales_role", roleParam);
  }
  if (minPay && !Number.isNaN(Number(minPay))) {
    q = q.gte("listing_details.minimum_compensation", Number(minPay));
  }

  // Array-column filters: overlaps(A, B) is true when A and B share ≥1 value.
  // We use it so a listing that accepts Full-time+Part-time matches a rep who
  // filters for either.
  if (commitmentF.length)
    q = q.overlaps("listing_details.commitment", commitmentF);
  if (compTypeF.length)
    q = q.overlaps("listing_details.compensation_type", compTypeF);

  // Requirements-side arrays.
  if (salesTypeF.length)
    q = q.overlaps("listing_requirements.sales_types", salesTypeF);
  if (decisionF.length)
    q = q.overlaps("listing_requirements.decision_makers", decisionF);
  if (envF.length)
    q = q.overlaps("listing_requirements.sales_environments", envF);
  if (cycleF.length)
    q = q.overlaps("listing_requirements.sales_cycles", cycleF);
  if (dealF.length)
    q = q.overlaps("listing_requirements.deal_amounts", dealF);
  if (volumeF.length)
    q = q.overlaps("listing_requirements.sales_volumes", volumeF);
  if (leadF.length)
    q = q.overlaps("listing_requirements.lead_types", leadF);
  if (techF.length)
    q = q.overlaps("listing_requirements.technologies", techF);
  if (educationF.length)
    q = q.overlaps("listing_requirements.education", educationF);
  if (industryF.length)
    q = q.overlaps("listing_requirements.industries", industryF);
  if (minExp && !Number.isNaN(Number(minExp))) {
    q = q.lte("listing_requirements.years_of_experience_min", Number(minExp));
  }

  const { data: listingRows } = await q;

  const normalized = ((listingRows ?? []) as unknown as ListingRow[]).map(
    normalize,
  );

  // No explicit role filter → rank matches-first based on candidate specialty.
  const filtered =
    !roleParam && specialties.size > 0
      ? [...normalized].sort((a, b) => {
          const am = specialties.has(a.salesRole) ? 0 : 1;
          const bm = specialties.has(b.salesRole) ? 0 : 1;
          return am - bm;
        })
      : normalized;

  const viewParams = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (k === "view") continue;
    if (Array.isArray(v)) v.forEach((val) => viewParams.append(k, val));
    else if (v) viewParams.set(k, v);
  }
  const listHref = `?view=list${viewParams.toString() ? `&${viewParams.toString()}` : ""}`;
  const tileHref = `?view=tile${viewParams.toString() ? `&${viewParams.toString()}` : ""}`;

  return (
    <main className="flex-1 w-full">
      <div className="max-w-[1400px] mx-auto p-6 lg:flex lg:gap-8">
        <FilterPanel />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
            <div>
              <h1 className="text-2xl font-semibold">Opportunities</h1>
              <p className="text-sm text-light-grey mt-0.5">
                Real open roles from companies on RemoteRep.{" "}
                {filtered.length === 1
                  ? "1 match"
                  : `${filtered.length} matches`}
                .
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-light-grey">View:</span>
              <Link
                href={listHref}
                className={`rounded px-2 py-1 ${view === "list" ? "bg-primary text-white" : "border border-zinc-300 dark:border-zinc-700"}`}
              >
                List
              </Link>
              <Link
                href={tileHref}
                className={`rounded px-2 py-1 ${view === "tile" ? "bg-primary text-white" : "border border-zinc-300 dark:border-zinc-700"}`}
              >
                Tile
              </Link>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-10 text-center border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl">
              <p className="text-sm text-light-grey mb-2">
                No listings match those filters.
              </p>
              <Link
                href="?"
                className="text-sm text-primary hover:opacity-80"
              >
                Clear filters →
              </Link>
            </div>
          ) : view === "tile" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
        </div>
      </div>
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

  const posted =
    opp.postedDaysAgo === 0 ? "Today" : `${opp.postedDaysAgo}d ago`;

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
          <p className="text-xs text-zinc-500 mt-2">
            {opp.compensationSummary}
          </p>
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
              <span className="text-light-grey">
                {opp.compensationSummary}
              </span>
            </>
          )}
        </div>
      </div>
      {BookmarkBtn}
    </article>
  );
}
