import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getTenantSubscription,
  hasAiAccess,
  tenantHasActiveFeaturedListing,
} from "@/lib/subscriptions";
import { createListing } from "../actions";
import { NewListingForm } from "./NewListingForm";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string }>;

export default async function NewListingPage({
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

  const params = await searchParams;
  const { tier } = await getTenantSubscription(m.tenant_id);
  // AI is unlocked by a Premium+ plan OR an active Featured ($59) listing.
  const aiAllowed =
    hasAiAccess(tier) || (await tenantHasActiveFeaturedListing(m.tenant_id));

  return (
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
      <Link
        href="/company/listings"
        className="text-xs text-light-grey hover:text-primary transition-colors mb-3 inline-block"
      >
        ← All listings
      </Link>
      <h1 className="text-2xl font-semibold mb-1">New job listing</h1>
      <p className="text-sm text-light-grey mb-6">
        Draft it yourself, or let the AI writer start you off. You can edit
        anything before publishing.
      </p>

      {params.error && (
        <div
          role="alert"
          className="mb-4 rounded border border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-900 p-3 text-sm text-red-800 dark:text-red-200"
        >
          {params.error}
        </div>
      )}

      <NewListingForm
        action={createListing}
        companyName={m.tenants.name}
        hasAiAccess={aiAllowed}
      />
    </main>
  );
}
