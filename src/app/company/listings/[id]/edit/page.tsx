import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTenantSubscription, hasAiAccess } from "@/lib/subscriptions";
import { updateListing } from "../../actions";
import { NewListingForm } from "../../new/NewListingForm";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string }>;

export default async function EditListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
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
    .limit(1);

  type M = {
    tenant_id: string;
    role: string;
    tenants: { name: string; type: string };
  };
  const m = (memberships as unknown as M[])?.[0];
  if (!m) redirect("/dashboard");

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, tenant_id, title, description, instructions, calendar_link, status, listing_details(*), listing_requirements(*)",
    )
    .eq("id", id)
    .eq("tenant_id", m.tenant_id)
    .maybeSingle();

  if (!listing) notFound();

  type Details = {
    sales_role: string | null;
    commitment: string[] | null;
    benefits: string[] | null;
    compensation_type: string[] | null;
    minimum_compensation: number | null;
    compensation_details: string | null;
  };
  type Requirements = {
    education: string[] | null;
    years_of_experience_min: number | null;
    industries: string[] | null;
    sales_roles: string[] | null;
    sales_types: string[] | null;
    decision_makers: string[] | null;
    sales_environments: string[] | null;
    sales_cycles: string[] | null;
    deal_amounts: string[] | null;
    sales_volumes: string[] | null;
    lead_types: string[] | null;
    technologies: string[] | null;
  };
  type ListingRow = {
    id: string;
    title: string;
    description: string;
    instructions: string | null;
    calendar_link: string | null;
    status: string;
    listing_details: Details | Details[] | null;
    listing_requirements: Requirements | Requirements[] | null;
  };
  const l = listing as unknown as ListingRow;
  const details = Array.isArray(l.listing_details)
    ? l.listing_details[0]
    : l.listing_details;
  const reqs = Array.isArray(l.listing_requirements)
    ? l.listing_requirements[0]
    : l.listing_requirements;

  const defaults = {
    title: l.title,
    description: l.description,
    instructions: l.instructions ?? "",
    calendar_link: l.calendar_link ?? "",
    sales_role: details?.sales_role ?? undefined,
    commitment: details?.commitment ?? [],
    compensation_type: details?.compensation_type ?? [],
    minimum_compensation: details?.minimum_compensation ?? null,
    compensation_details: details?.compensation_details ?? "",
    benefits: details?.benefits ?? [],
    years_of_experience_min: reqs?.years_of_experience_min ?? null,
    education: reqs?.education ?? [],
    sales_roles: reqs?.sales_roles ?? [],
    sales_types: reqs?.sales_types ?? [],
    decision_makers: reqs?.decision_makers ?? [],
    sales_environments: reqs?.sales_environments ?? [],
    sales_cycles: reqs?.sales_cycles ?? [],
    deal_amounts: reqs?.deal_amounts ?? [],
    sales_volumes: reqs?.sales_volumes ?? [],
    lead_types: reqs?.lead_types ?? [],
    technologies: reqs?.technologies ?? [],
    industries: reqs?.industries ?? [],
  };

  const submitLabel =
    l.status === "published" ? "Save & keep live" : "Save & publish";

  const { tier } = await getTenantSubscription(m.tenant_id);
  const aiAllowed = hasAiAccess(tier);

  return (
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
      <Link
        href={`/company/listings/${l.id}`}
        className="text-xs text-light-grey hover:text-primary transition-colors mb-3 inline-block"
      >
        ← Back to listing
      </Link>
      <h1 className="text-2xl font-semibold mb-1">Edit listing</h1>
      <p className="text-sm text-light-grey mb-6">
        Changes save immediately. Use “Save as draft” to unpublish while you
        rework it.
      </p>

      {sp.error && (
        <div
          role="alert"
          className="mb-4 rounded border border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-900 p-3 text-sm text-red-800 dark:text-red-200"
        >
          {sp.error}
        </div>
      )}

      <NewListingForm
        action={updateListing}
        companyName={m.tenants.name}
        defaults={defaults}
        listingId={l.id}
        submitLabel={submitLabel}
        hasAiAccess={aiAllowed}
      />
    </main>
  );
}
