import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HiringDashboard } from "./HiringDashboard";
import { CandidateDashboard } from "./CandidateDashboard";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  saved?: string;
  listing?: string;
  closed?: string;
  error?: string;
}>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
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

  type Membership = {
    tenant_id: string;
    role: string;
    tenants: { id: string; name: string; type: string };
  };
  const m = memberships[0] as unknown as Membership;
  const isHiring =
    m.tenants.type === "client_company" || m.tenants.type === "agency";

  const { data: profile } = await supabase
    .from("users")
    .select("first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();

  const showClosed = params.closed === "1";
  const selectedListingId = params.listing ?? null;

  if (isHiring) {
    return (
      <HiringDashboard
        userId={user.id}
        tenantId={m.tenant_id}
        tenantName={m.tenants.name}
        firstName={profile?.first_name}
        selectedListingId={selectedListingId}
        showClosed={showClosed}
      />
    );
  }

  return (
    <CandidateDashboard
      userId={user.id}
      firstName={profile?.first_name}
      showClosed={showClosed}
    />
  );
}
