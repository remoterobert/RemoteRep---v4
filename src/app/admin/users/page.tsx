import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/is-platform-admin";
import { UserRowActions } from "./UserRowActions";
import { impersonateUser, sendPasswordReset } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string; ok?: string }>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const admin = await isPlatformAdmin();
  if (!admin) redirect("/dashboard");

  const params = await searchParams;

  const { data: users, error } = await supabase
    .from("users")
    .select(
      "id, email, first_name, last_name, status, created_at, last_seen_at, tenant_members!user_id(role, tenants(name, type)), candidate_profiles(user_id, visibility)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Users</h2>
        <div className="rounded border border-danger/40 bg-danger/5 p-3 text-sm text-danger">
          Error loading users: {error.message}
        </div>
      </div>
    );
  }

  type MembershipRow = { role: string; tenants: { name: string; type: string } };
  type UserRow = {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    status: string;
    created_at: string;
    last_seen_at: string | null;
    tenant_members: MembershipRow[];
    candidate_profiles: unknown[] | { user_id: string; visibility: string } | null;
  };
  const rows = (users ?? []) as unknown as UserRow[];

  return (
    <div className="p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-semibold">Users</h2>
        <span className="text-xs text-light-grey">
          {rows.length} total
        </span>
      </div>

      {params.error && (
        <div className="mb-4 rounded border border-danger/40 bg-danger/5 p-3 text-sm text-danger">
          {params.error}
        </div>
      )}
      {params.ok === "reset-sent" && (
        <div className="mb-4 rounded border border-success/40 bg-success/5 p-3 text-sm text-success">
          Password-reset email sent.
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-3 text-left text-xs uppercase text-light-grey">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Status</th>
              <th className="p-3">Tenants / Roles</th>
              <th className="p-3">Signed up</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((u) => {
              const memberships = u.tenant_members ?? [];
              const isPlatformAdminUser = memberships.some(
                (m) => m.role === "platform_admin",
              );
              const hasProfile = Array.isArray(u.candidate_profiles)
                ? u.candidate_profiles.length > 0
                : !!u.candidate_profiles;

              return (
                <tr key={u.id} className="hover:bg-surface-3/40">
                  <td className="p-3">
                    {u.first_name || u.last_name ? (
                      `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()
                    ) : (
                      <span className="text-light-grey italic">(no name)</span>
                    )}
                    {isPlatformAdminUser && (
                      <span className="ml-1 text-[10px] rounded-full bg-secondary/20 text-secondary px-1.5 py-0.5 font-semibold uppercase">
                        Admin
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-xs">{u.email}</td>
                  <td className="p-3">
                    <span className="text-xs font-mono bg-surface-3 rounded px-1.5 py-0.5">
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
                  <td className="p-3 text-right">
                    <UserRowActions
                      userId={u.id}
                      targetHasProfile={hasProfile}
                      impersonateAction={impersonateUser}
                      passwordResetAction={sendPasswordReset}
                      disableImpersonate={isPlatformAdminUser}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <p className="text-sm text-light-grey mt-4">No users yet.</p>
      )}
    </div>
  );
}
