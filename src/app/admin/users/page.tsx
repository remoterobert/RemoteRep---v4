import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users, error } = await supabase
    .from("users")
    .select(
      "id, email, first_name, last_name, status, created_at, last_seen_at, tenant_members:tenant_members!tenant_members_user_id_fkey(role, tenants(name, type))",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-4">Users</h2>
        <div className="rounded border border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-900 p-3 text-sm text-red-800 dark:text-red-200">
          Error loading users: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-semibold">Users</h2>
        <span className="text-xs text-light-grey">
          {users?.length ?? 0} total
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded">
          <thead className="bg-zinc-50 dark:bg-zinc-900 text-left text-xs uppercase text-light-grey">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Status</th>
              <th className="p-3">Tenants / Roles</th>
              <th className="p-3">Signed up</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {users?.map((u) => {
              type MembershipRow = {
                role: string;
                tenants: { name: string; type: string };
              };
              const memberships = (u.tenant_members ?? []) as unknown as MembershipRow[];
              return (
                <tr key={u.id}>
                  <td className="p-3">
                    {u.first_name || u.last_name ? (
                      `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()
                    ) : (
                      <span className="text-light-grey italic">(no name)</span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-xs">{u.email}</td>
                  <td className="p-3">
                    <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5">
                      {u.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {memberships.length === 0 ? (
                      <span className="text-light-grey italic text-xs">
                        (none)
                      </span>
                    ) : (
                      <div className="space-y-1">
                        {memberships.map((m, i) => (
                          <div key={i} className="text-xs">
                            <span className="font-semibold">
                              {m.tenants.name}
                            </span>
                            <span className="text-light-grey">
                              {" "}
                              · {m.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-xs text-light-grey">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {(!users || users.length === 0) && (
        <p className="text-sm text-light-grey mt-4">No users yet.</p>
      )}
    </div>
  );
}
