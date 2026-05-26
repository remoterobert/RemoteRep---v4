import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { filterByRole } from "@/lib/sample-candidates";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ view?: "list" | "tile"; role?: string }>;

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

  // Must be a member of a hiring tenant
  const { data: memberships } = await supabase
    .from("tenant_members")
    .select("tenant_id, role, status, tenants!inner(id, name, type)")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (!memberships || memberships.length === 0) {
    redirect("/onboarding/choose-role");
  }

  // Find the first hiring tenant the user belongs to
  type MembershipRow = {
    tenant_id: string;
    role: string;
    tenants: { id: string; name: string; type: string };
  };
  const hiringMembership = (memberships as unknown as MembershipRow[]).find(
    (m) =>
      m.tenants.type === "client_company" || m.tenants.type === "agency",
  );

  if (!hiringMembership) {
    // They're a candidate — redirect to dashboard since /candidates is for hiring users
    redirect("/dashboard");
  }

  // Active hiring intents for this tenant
  const { data: intents } = await supabase
    .from("tenant_hiring_intents")
    .select("sales_role")
    .eq("tenant_id", hiringMembership.tenant_id)
    .eq("status", "active");

  const params = await searchParams;
  const view = params.view === "tile" ? "tile" : "list";
  const selectedRole = params.role ?? intents?.[0]?.sales_role ?? null;

  const candidates = filterByRole(selectedRole);

  return (
    <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">Matched candidates</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-zinc-500">View:</span>
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

      <p className="text-sm text-zinc-500 mb-2">
        Showing candidates for{" "}
        <strong className="text-zinc-700 dark:text-zinc-300">
          {hiringMembership.tenants.name}
        </strong>
        {selectedRole && (
          <>
            {" "}
            • Role:{" "}
            <strong className="text-zinc-700 dark:text-zinc-300">
              {selectedRole}
            </strong>
          </>
        )}
      </p>
      <p className="text-xs text-amber-700 dark:text-amber-400 mb-6 italic">
        🚧 Phase 1d: these are sample candidates so you can see the UI. Real
        candidate profiles appear here in Phase 2 when actual sales reps sign
        up.
      </p>

      {/* Role filter chips */}
      {intents && intents.length > 0 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-xs text-zinc-500">Filter:</span>
          <Link
            href={`?view=${view}`}
            className={`text-xs rounded px-2 py-1 ${!selectedRole ? "bg-zinc-200 dark:bg-zinc-800" : "border border-zinc-300 dark:border-zinc-700"}`}
          >
            All
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

      {view === "tile" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map((c) => (
            <article
              key={c.id}
              className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-sm font-semibold">
                  {c.initials}
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-sm">{c.display_name}</h2>
                  <p className="text-xs text-zinc-500">
                    {c.years_experience} yrs experience
                  </p>
                </div>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">
                {c.headline}
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                {c.specialty_roles.map((r) => (
                  <span
                    key={r}
                    className="text-[10px] bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5"
                  >
                    {r}
                  </span>
                ))}
              </div>
              <button
                type="button"
                disabled
                title="Coming soon — Phase 2"
                className="w-full text-xs rounded border border-zinc-300 dark:border-zinc-700 px-2 py-1.5 text-zinc-400 cursor-not-allowed"
              >
                Invite (coming soon)
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((c) => (
            <article
              key={c.id}
              className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex items-start gap-4"
            >
              <div className="w-12 h-12 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-sm font-semibold">
                {c.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 mb-1">
                  <h2 className="font-semibold">{c.display_name}</h2>
                  <span className="text-xs text-zinc-500">
                    {c.years_experience} yrs experience
                  </span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                  {c.headline}
                </p>
                <div className="flex flex-wrap gap-1 text-xs">
                  {c.specialty_roles.map((r) => (
                    <span
                      key={r}
                      className="bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-0.5"
                    >
                      {r}
                    </span>
                  ))}
                  <span className="text-zinc-400 mx-1">•</span>
                  <span className="text-zinc-500">
                    Avg deal: {c.avg_deal_size}
                  </span>
                </div>
              </div>
              <button
                type="button"
                disabled
                title="Coming soon — Phase 2"
                className="shrink-0 text-xs rounded border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-zinc-400 cursor-not-allowed"
              >
                Invite (coming soon)
              </button>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
