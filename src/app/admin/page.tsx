import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function fetchCounts() {
  const supabase = await createClient();

  const [
    { count: userCount },
    { count: tenantCount },
    { count: membershipCount },
    { count: candidateCount },
    { count: listingCount },
    { count: eventCount },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("tenants").select("*", { count: "exact", head: true }),
    supabase
      .from("tenant_members")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("candidate_specialties")
      .select("user_id", { count: "exact", head: true }),
    supabase.from("listings").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase
      .from("users")
      .select("id, email, first_name, last_name, created_at, status")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return {
    userCount,
    tenantCount,
    membershipCount,
    candidateCount,
    listingCount,
    eventCount,
    recentUsers,
  };
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="text-xs text-light-grey uppercase tracking-wider">
        {label}
      </div>
      <div className="text-2xl font-semibold mt-1">{value ?? "?"}</div>
    </div>
  );
}

export default async function AdminOverviewPage() {
  const {
    userCount,
    tenantCount,
    membershipCount,
    candidateCount,
    listingCount,
    eventCount,
    recentUsers,
  } = await fetchCounts();

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Overview</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        <Stat label="Users" value={userCount} />
        <Stat label="Tenants" value={tenantCount} />
        <Stat label="Memberships" value={membershipCount} />
        <Stat label="Candidates (specialties)" value={candidateCount} />
        <Stat label="Listings" value={listingCount} />
        <Stat label="Events" value={eventCount} />
      </div>

      <h3 className="text-sm font-semibold mb-3 text-light-grey uppercase tracking-wider">
        Recent signups
      </h3>
      {recentUsers && recentUsers.length > 0 ? (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded">
          {recentUsers.map((u) => (
            <li
              key={u.id}
              className="p-3 text-sm flex items-center justify-between"
            >
              <span>
                {u.first_name || u.last_name
                  ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()
                  : "(no name yet)"}
                <span className="text-light-grey ml-2">{u.email}</span>
              </span>
              <span className="text-xs text-light-grey">
                {new Date(u.created_at).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-light-grey">No users yet.</p>
      )}
    </div>
  );
}
