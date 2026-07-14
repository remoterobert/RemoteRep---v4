import { redirect } from "next/navigation";
import Link from "next/link";
import {
  PlusIcon,
  ClipboardDocumentListIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";
import { ListingRowActions } from "./ListingRowActions";
import { setListingStatus, deleteListing } from "./actions";
import { PlanBadge } from "@/components/PlanBadge";
import { getTenantSubscription, isFeaturedListing } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  error?: string;
  created?: string;
  updated?: string;
  deleted?: string;
}>;

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-zinc-100 dark:bg-white/10 text-dark-foreground dark:text-white",
  published:
    "bg-success/15 text-success ring-1 ring-success/30",
  pending_payment:
    "bg-warning/15 text-warning ring-1 ring-warning/30",
  paused: "bg-warning/15 text-warning ring-1 ring-warning/30",
  archived:
    "bg-zinc-200 dark:bg-white/[0.06] text-light-grey",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  published: "Live",
  pending_payment: "Pending payment",
  paused: "Paused",
  archived: "Archived",
};

export default async function CompanyListingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id, role, tenants!inner(name, type)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", [
      "client_admin",
      "client_member",
      "agency_admin",
      "agency_member",
    ])
    .limit(1)
    .maybeSingle();

  type M = {
    tenant_id: string;
    role: string;
    tenants: { name: string; type: string };
  };
  const m = membership as unknown as M | null;
  if (!m) redirect("/dashboard");

  const { data: listings } = await supabase
    .from("listings")
    .select(
      "id, title, status, visibility, published_at, created_at, featured_until",
    )
    .eq("tenant_id", m.tenant_id)
    .order("created_at", { ascending: false });

  type Row = {
    id: string;
    title: string;
    status: string;
    visibility: string;
    published_at: string | null;
    created_at: string;
    featured_until: string | null;
  };
  const rows = (listings ?? []) as Row[];

  const { tier: currentTier } = await getTenantSubscription(m.tenant_id);

  // Bulk-fetch applicant + bookmark counts per listing.
  const ids = rows.map((r) => r.id);
  const applicantsByListing = new Map<string, number>();
  const bookmarksByListing = new Map<string, number>();

  if (ids.length > 0) {
    const { data: apps } = await supabase
      .from("applications")
      .select("listing_id, status")
      .in("listing_id", ids);
    for (const a of (apps ?? []) as {
      listing_id: string;
      status: string;
    }[]) {
      // Applications include invited / applied / interviewing / hired /
      // rejected / withdrawn / bookmarked / shortlisted. Count everything
      // except withdrawn as "engagement" so the number reflects real interest.
      if (a.status !== "withdrawn") {
        applicantsByListing.set(
          a.listing_id,
          (applicantsByListing.get(a.listing_id) ?? 0) + 1,
        );
      }
    }

    const { data: marks } = await supabase
      .from("bookmarks")
      .select("target_id")
      .eq("target_type", "listing")
      .in("target_id", ids);
    for (const b of (marks ?? []) as { target_id: string }[]) {
      bookmarksByListing.set(
        b.target_id,
        (bookmarksByListing.get(b.target_id) ?? 0) + 1,
      );
    }
  }

  const params = await searchParams;

  return (
    <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Job listings</h1>
          <p className="text-sm text-light-grey">
            Publish, pause, and manage every role your team is hiring for.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Link
            href="/company/listings/new"
            className="inline-flex items-center gap-1.5 rounded bg-primary text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <PlusIcon className="h-4 w-4" />
            New listing
          </Link>
          <PlanBadge currentTier={currentTier} />
        </div>
      </div>

      {params.error && (
        <div
          role="alert"
          className="mb-4 rounded border border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-900 p-3 text-sm text-red-800 dark:text-red-200"
        >
          {params.error}
        </div>
      )}
      {params.created && (
        <div className="mb-4 rounded border border-success/40 bg-success/10 p-3 text-sm text-success">
          Listing created.
        </div>
      )}
      {params.updated && (
        <div className="mb-4 rounded border border-primary/40 bg-primary/10 p-3 text-sm text-primary">
          Listing updated.
        </div>
      )}
      {params.deleted && (
        <div className="mb-4 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-white/[0.03] p-3 text-sm text-light-grey">
          Listing deleted.
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-10 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <ClipboardDocumentListIcon className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-lg font-semibold mb-1">No listings yet</h2>
          <p className="text-sm text-light-grey max-w-md mx-auto mb-6">
            Post your first role and reps who match will see it in their
            opportunities feed.
          </p>
          <Link
            href="/company/listings/new"
            className="inline-flex items-center gap-1.5 rounded bg-primary text-white px-5 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <PlusIcon className="h-4 w-4" />
            Create your first listing
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-white/[0.03] text-left text-[11px] uppercase tracking-wider font-semibold text-light-grey">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Applicants</th>
                <th className="px-4 py-3 text-right">Bookmarks</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const badgeCls =
                  STATUS_STYLES[row.status] ?? STATUS_STYLES.draft;
                const badgeLabel = STATUS_LABEL[row.status] ?? row.status;
                const applicants = applicantsByListing.get(row.id) ?? 0;
                const bookmarks = bookmarksByListing.get(row.id) ?? 0;
                const created = new Date(row.created_at).toLocaleDateString(
                  undefined,
                  { month: "short", day: "numeric", year: "numeric" },
                );

                return (
                  <tr
                    key={row.id}
                    className="border-t border-zinc-100 dark:border-white/[0.04] hover:bg-zinc-50 dark:hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/company/listings/${row.id}`}
                        className="font-semibold text-dark-foreground dark:text-white hover:text-primary transition-colors"
                      >
                        {row.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeCls}`}
                      >
                        {badgeLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {applicants}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {bookmarks}
                    </td>
                    <td className="px-4 py-3 text-light-grey">{created}</td>
                    <td className="px-4 py-3 text-right">
                      <ListingRowActions
                        listingId={row.id}
                        status={row.status}
                        isFeatured={isFeaturedListing(row)}
                        setStatusAction={setListingStatus}
                        deleteAction={deleteListing}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
