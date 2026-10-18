import Link from "next/link";
import {
  LockClosedIcon,
  BriefcaseIcon,
  BanknotesIcon,
  ClockIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/solid";
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

type RoleCard = {
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

function formatComp(n: number): string {
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

async function loadRoles(): Promise<{
  cards: RoleCard[];
  total: number;
  signedIn: boolean;
}> {
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

    return { cards, total: count ?? rows.length, signedIn: !!user };
  } catch (err) {
    // No Supabase config (local preview) or a transient error — the section
    // falls back to locked placeholders rather than breaking the page.
    console.error("[reps] could not load role preview:", err);
    return { cards: [], total: 0, signedIn: false };
  }
}

function Facet({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white/70">
      <Icon className="h-3.5 w-3.5 text-white/40" />
      {children}
    </span>
  );
}

function RedactedBar({ width }: { width: number }) {
  return (
    <span
      aria-hidden
      className="block h-3.5 rounded bg-gradient-to-r from-white/20 to-white/10"
      style={{ width: `${width}%` }}
    />
  );
}

function Card({ c, signedIn }: { c: RoleCard; signedIn: boolean }) {
  return (
    <Link
      href={c.href}
      className="group relative flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-secondary/40 hover:bg-white/[0.05]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-primary/20 px-2.5 py-1 text-xs font-bold text-primary-blue ring-1 ring-primary/30">
          {c.role}
        </span>
        {c.minComp != null && (
          <span className="text-xl font-extrabold tracking-tight text-secondary">
            {formatComp(c.minComp)}
          </span>
        )}
      </div>

      {/* Company + title: redacted */}
      <div className="mt-5 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] ring-1 ring-white/10">
          <LockClosedIcon className="h-4 w-4 text-white/40" />
        </div>
        <div className="flex-1 space-y-2">
          {c.titleBars.map((w, i) => (
            <RedactedBar key={i} width={w} />
          ))}
          <span className="block text-xs text-white/35">
            Company hidden
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {c.compTypes.slice(0, 2).map((t) => (
          <Facet key={t} icon={BanknotesIcon}>
            {t}
          </Facet>
        ))}
        {c.commitments.slice(0, 1).map((t) => (
          <Facet key={t} icon={ClockIcon}>
            {t}
          </Facet>
        ))}
        {c.industry && (
          <Facet icon={BuildingOffice2Icon}>{c.industry}</Facet>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4 text-xs">
        <span className="text-white/40">{c.posted ?? "Remote"}</span>
        <span className="inline-flex items-center gap-1.5 font-bold text-secondary">
          {signedIn ? (
            "View role →"
          ) : (
            <>
              <LockClosedIcon className="h-3.5 w-3.5" />
              Unlock with free account
            </>
          )}
        </span>
      </div>
    </Link>
  );
}

function PlaceholderCard() {
  return (
    <Link
      href={`${APP}/signup`}
      className="flex h-full flex-col rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 transition hover:border-secondary/40"
    >
      <div className="flex items-center justify-between">
        <RedactedBar width={30} />
        <LockClosedIcon className="h-4 w-4 text-white/30" />
      </div>
      <div className="mt-6 space-y-2">
        <RedactedBar width={80} />
        <RedactedBar width={55} />
      </div>
      <p className="mt-auto pt-6 text-xs font-bold text-secondary">
        Members see every open role →
      </p>
    </Link>
  );
}

export async function RedactedRoles() {
  const { cards, total, signedIn } = await loadRoles();

  return (
    <div>
      {total > 0 && (
        <p className="mb-6 text-center text-sm text-white/50">
          <span className="font-bold text-white">{total}</span> remote sales{" "}
          {total === 1 ? "role is" : "roles are"} open right now.{" "}
          {total > cards.length && "Here are the best-paying few."}
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.length > 0
          ? cards.map((c) => <Card key={c.key} c={c} signedIn={signedIn} />)
          : Array.from({ length: 3 }).map((_, i) => <PlaceholderCard key={i} />)}
      </div>
      <p className="mt-6 flex items-center justify-center gap-2 text-xs text-white/40">
        <BriefcaseIcon className="h-3.5 w-3.5" />
        Company names, titles and full details unlock when you create your free
        account.
      </p>
    </div>
  );
}
