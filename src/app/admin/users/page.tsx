import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/is-platform-admin";
import { UserRowActions } from "./UserRowActions";
import { UsersFilterBar } from "./UsersFilterBar";
import {
  impersonateUser,
  sendPasswordReset,
  updateUserFields,
  toggleComp,
  toggleArchive,
  deleteUserPermanently,
} from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  error?: string;
  ok?: string;
  q?: string;
  type?: string;
  access?: string;
  status?: string;
  sort?: string;
  tag?: string;
}>;

const OK_MESSAGES: Record<string, string> = {
  "reset-sent": "Password-reset email sent.",
  updated: "User updated.",
  "access-updated": "Access level updated.",
  archived: "User archived.",
  unarchived: "User unarchived.",
  deleted: "User permanently deleted.",
};

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
  const q = params.q?.trim() ?? "";
  const type = params.type ?? "all";
  const access = params.access ?? "all";
  const status = params.status ?? "active";
  const tag = params.tag ?? "";
  const sort = params.sort ?? "created_desc";

  // ---- Build query ----
  let query = supabase
    .from("users")
    .select(
      "id, email, first_name, last_name, status, created_at, last_seen_at, tags, notes, access_level, archived_at, reference_source, tenant_members!user_id(role, tenants(name, type)), candidate_profiles(user_id, visibility)",
    );

  if (q) {
    // OR search: email OR first_name OR last_name
    query = query.or(
      `email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`,
    );
  }

  if (access !== "all") {
    query = query.eq("access_level", access);
  }
  if (status === "active") {
    query = query.is("archived_at", null);
  } else if (status === "archived") {
    query = query.not("archived_at", "is", null);
  }
  if (tag) {
    query = query.contains("tags", [tag]);
  }

  // Sort
  const sortField = sort.startsWith("email") ? "email" : "created_at";
  const sortAsc = sort.endsWith("asc");
  query = query.order(sortField, { ascending: sortAsc });

  const { data: users, error } = await query;

  type MembershipRow = { role: string; tenants: { name: string; type: string } };
  type UserRow = {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    status: string;
    created_at: string;
    last_seen_at: string | null;
    tags: string[] | null;
    notes: string | null;
    access_level: string | null;
    archived_at: string | null;
    reference_source: string | null;
    tenant_members: MembershipRow[];
    candidate_profiles: unknown[] | { user_id: string; visibility: string } | null;
  };
  const allRows = (users ?? []) as unknown as UserRow[];

  // Client-side type filter (needs computed membership data)
  const rows = allRows.filter((u) => {
    if (type === "all") return true;
    const isPlatformAdminUser = (u.tenant_members ?? []).some(
      (m) => m.role === "platform_admin",
    );
    const isHiring = (u.tenant_members ?? []).some(
      (m) =>
        m.tenants.type === "client_company" || m.tenants.type === "agency",
    );
    const isCandidate = Array.isArray(u.candidate_profiles)
      ? u.candidate_profiles.length > 0
      : !!u.candidate_profiles;
    if (type === "admin") return isPlatformAdminUser;
    if (type === "hiring") return isHiring && !isPlatformAdminUser;
    if (type === "candidate") return isCandidate && !isPlatformAdminUser;
    return true;
  });

  // Get email verified from auth.users via count aggregation (we don't
  // have direct access to auth.users email_confirmed_at without service
  // role client). For MVP, treat users with status='active' as verified.

  // Distinct tags for the filter dropdown
  const tagSet = new Set<string>();
  for (const u of allRows) {
    for (const t of u.tags ?? []) tagSet.add(t);
  }
  const allTags = Array.from(tagSet).sort();

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-light-grey">
            Full-platform user management with impersonation + admin controls.
          </p>
        </div>
      </div>

      {params.error && (
        <div className="mb-4 rounded border border-danger/40 bg-danger/5 p-3 text-sm text-danger">
          {params.error}
        </div>
      )}
      {params.ok && OK_MESSAGES[params.ok] && (
        <div className="mb-4 rounded border border-success/40 bg-success/5 p-3 text-sm text-success">
          {OK_MESSAGES[params.ok]}
        </div>
      )}

      <UsersFilterBar allTags={allTags} totalCount={rows.length} />

      {error && (
        <div className="rounded border border-danger/40 bg-danger/5 p-3 text-sm text-danger">
          Error loading users: {error.message}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-3 text-left text-[11px] uppercase tracking-wider font-semibold text-light-grey">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Type</th>
              <th className="p-3">Access</th>
              <th className="p-3">Status</th>
              <th className="p-3">Tags</th>
              <th className="p-3">Signed up</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-light-grey">
                  No users match those filters.
                </td>
              </tr>
            )}
            {rows.map((u) => {
              const memberships = u.tenant_members ?? [];
              const isAdmin = memberships.some(
                (m) => m.role === "platform_admin",
              );
              const isHiring = memberships.some(
                (m) =>
                  m.tenants.type === "client_company" ||
                  m.tenants.type === "agency",
              );
              const hasProfile = Array.isArray(u.candidate_profiles)
                ? u.candidate_profiles.length > 0
                : !!u.candidate_profiles;
              const isCandidate = hasProfile;
              const access = u.access_level ?? "free";
              const isComp = access === "comp";
              const isArchived = !!u.archived_at;
              const displayName =
                u.first_name || u.last_name
                  ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()
                  : u.email.split("@")[0];
              const initials = (
                (u.first_name?.[0] ?? "") + (u.last_name?.[0] ?? "")
              ).toUpperCase() || u.email[0].toUpperCase();

              return (
                <tr
                  key={u.id}
                  className={`hover:bg-surface-3/40 ${isArchived ? "opacity-60" : ""}`}
                >
                  {/* User (avatar + name + email) */}
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          <Link
                            href={`/admin/users/${u.id}`}
                            className="hover:text-primary transition-colors"
                          >
                            {displayName}
                          </Link>
                        </div>
                        <div className="text-[11px] text-light-grey font-mono truncate">
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Type badges */}
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {isAdmin && (
                        <span className="text-[10px] rounded-full bg-secondary/20 text-dark-foreground dark:text-secondary px-2 py-0.5 font-semibold uppercase">
                          Admin
                        </span>
                      )}
                      {isCandidate && (
                        <span className="text-[10px] rounded-full bg-primary/10 text-primary px-2 py-0.5 font-semibold uppercase">
                          Candidate
                        </span>
                      )}
                      {isHiring && (
                        <span className="text-[10px] rounded-full bg-interviewing/15 text-interviewing px-2 py-0.5 font-semibold uppercase">
                          Hiring
                        </span>
                      )}
                      {!isAdmin && !isCandidate && !isHiring && (
                        <span className="text-[10px] text-light-grey italic">
                          —
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Access */}
                  <td className="p-3">
                    <AccessBadge level={access} />
                  </td>

                  {/* Status */}
                  <td className="p-3">
                    {isArchived ? (
                      <span className="inline-flex items-center gap-1 text-[11px] rounded-full bg-surface-3 px-2 py-0.5 text-light-grey">
                        <XCircleIcon className="h-3 w-3" />
                        Archived
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] rounded-full bg-success/10 text-success px-2 py-0.5">
                        <CheckCircleIcon className="h-3 w-3" />
                        Active
                      </span>
                    )}
                  </td>

                  {/* Tags */}
                  <td className="p-3">
                    {u.tags && u.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {u.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="text-[10px] rounded bg-surface-3 px-1.5 py-0.5"
                          >
                            {t}
                          </span>
                        ))}
                        {u.tags.length > 3 && (
                          <span className="text-[10px] text-light-grey">
                            +{u.tags.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-light-grey italic">
                        —
                      </span>
                    )}
                  </td>

                  {/* Signed up */}
                  <td className="p-3 text-xs text-light-grey whitespace-nowrap">
                    {new Date(u.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "2-digit",
                    })}
                  </td>

                  {/* Actions */}
                  <td className="p-3 text-right">
                    <UserRowActions
                      user={{
                        id: u.id,
                        email: u.email,
                        displayName,
                        tags: u.tags ?? [],
                        notes: u.notes ?? "",
                        accessLevel: access,
                        referenceSource: u.reference_source ?? "",
                        isAdmin,
                      }}
                      editAction={updateUserFields}
                      impersonateAction={impersonateUser}
                      passwordResetAction={sendPasswordReset}
                      toggleCompAction={toggleComp}
                      toggleArchiveAction={toggleArchive}
                      deleteAction={deleteUserPermanently}
                      disableImpersonate={isAdmin}
                      disableDelete={u.id === user.id}
                      isArchived={isArchived}
                      isComp={isComp}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AccessBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    premium: "bg-success/15 text-success ring-1 ring-success/30",
    comp: "bg-warning/15 text-warning ring-1 ring-warning/30",
    free: "bg-surface-3 text-light-grey",
  };
  const labels: Record<string, string> = {
    premium: "Premium",
    comp: "Comp",
    free: "Free",
  };
  const cls = styles[level] ?? styles.free;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}
    >
      {labels[level] ?? level}
    </span>
  );
}
