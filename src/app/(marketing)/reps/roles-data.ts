import { createClient } from "@/lib/supabase/server";
import { APP } from "../MarketingFrame";

/**
 * Members-only preview of live listings for the /reps landing page.
 *
 * Redaction happens HERE, on the server: the card model below only carries
 * the safe facets (role, pay, commitment, industry, age). Company name, title,
 * and description never leave the server for signed-out visitors, so they
 * can't be recovered from the page source. Signed-in users get a real link.
 */

export type RoleCard = {
  key: string;
  href: string;
  role: string;
  minComp: number | null;
  compTypes: string[];
  commitments: string[];
  industry: string | null;
  posted: string | null;
  titleBars: number[];
};

type ListingRow = {
  id: string;
  title: string;
  published_at: string | null;
  tenants: { client_profiles: { industry_slug: string | null } | { industry_slug: string | null }[] | null } | null;
  listing_details:
    | {
        sales_role: string;
        commitment: string[] | null;
        compensation_type: string[] | null;
        minimum_compensation: number | null;
      }
    | null;
};

const PREVIEW_COUNT = 6;

export function formatComp(n: number): string {
  if (n >= 1000) return `$${Math.round(n / 1000)}k+`;
  return `$${n.toLocaleString()}+`;
}

function postedAgo(iso: string | null): string | null {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days < 30) return `Posted ${days} days ago`;
  return "Posted 30+ days ago";
}

// Width hints for the blacked-out title, derived from its length only.
function titleBars(title: string): number[] {
  const len = Math.min(Math.max(title.length, 12), 60);
  const first = Math.round(45 + (len / 60) * 50);
  return len > 34 ? [first, Math.round(25 + (len % 7) * 6)] : [first];
}

export type RolesData = {
  cards: RoleCard[];
  total: number;
  topComp: number | null;
  signedIn: boolean;
};

export async function loadRoles(): Promise<RolesData> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const [{ data, count }, { data: industries }] = await Promise.all([
      supabase
        .from("listings")
        .select(
          "id, title, published_at, tenants(client_profiles(industry_slug)), listing_details!inner(sales_role, commitment, compensation_type, minimum_compensation)",
          { count: "exact" },
        )
        .eq("status", "published")
        .eq("visibility", "public")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(60),
      supabase.from("industries").select("slug, display_name"),
    ]);

    const industryName = new Map(
      (industries ?? []).map((i: { slug: string; display_name: string }) => [
        i.slug,
        i.display_name,
      ]),
    );

    const rows = (data ?? []) as unknown as ListingRow[];

    // This page speaks to reps who already earn well — lead with the
    // best-paying roles, then the freshest.
    rows.sort(
      (a, b) =>
        (b.listing_details?.minimum_compensation ?? -1) -
        (a.listing_details?.minimum_compensation ?? -1),
    );

    const cards = rows.slice(0, PREVIEW_COUNT).map((r, i): RoleCard => {
      const cp = r.tenants?.client_profiles;
      const slug = (Array.isArray(cp) ? cp[0] : cp)?.industry_slug ?? null;
      const d = r.listing_details;
      return {
        key: user ? r.id : `role-${i}`,
        href: user ? `/listings/${r.id}` : `${APP}/signup`,
        role: d?.sales_role ?? "Sales role",
        minComp: d?.minimum_compensation ?? null,
        compTypes: d?.compensation_type ?? [],
        commitments: d?.commitment ?? [],
        industry: slug ? (industryName.get(slug) ?? null) : null,
        posted: postedAgo(r.published_at),
        titleBars: titleBars(r.title),
      };
    });

    return {
      cards,
      total: count ?? rows.length,
      topComp: rows[0]?.listing_details?.minimum_compensation ?? null,
      signedIn: !!user,
    };
  } catch (err) {
    // No Supabase config (local preview) or a transient error — the section
    // falls back to locked placeholders rather than breaking the page.
    console.error("[reps] could not load role preview:", err);
    return { cards: [], total: 0, topComp: null, signedIn: false };
  }
}
