import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/is-platform-admin";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ action?: string; actor?: string }>;

const ACTION_COLORS: Record<string, string> = {
  impersonate_start: "bg-warning/20 text-warning ring-1 ring-warning/40",
  impersonate_end: "bg-zinc-200 dark:bg-white/[0.06] text-light-grey",
  password_reset_sent: "bg-primary/15 text-primary ring-1 ring-primary/30",
};

export default async function AdminAuditLogPage({
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

  let q = supabase
    .from("audit_log")
    .select("id, actor_user_id, action, target_type, target_id, metadata, created_at, ip_address, user_agent")
    .order("created_at", { ascending: false })
    .limit(500);

  if (params.action) q = q.eq("action", params.action);
  if (params.actor) q = q.eq("actor_user_id", params.actor);

  const { data: rows, error } = await q;

  type Row = {
    id: string;
    actor_user_id: string | null;
    action: string;
    target_type: string | null;
    target_id: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
    ip_address: string | null;
    user_agent: string | null;
  };
  const entries = (rows ?? []) as Row[];

  // Look up actor emails for display
  const actorIds = Array.from(
    new Set(entries.map((e) => e.actor_user_id).filter(Boolean) as string[]),
  );
  const emailMap = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: actors } = await supabase
      .from("users")
      .select("id, email")
      .in("id", actorIds);
    for (const a of actors ?? []) {
      emailMap.set(a.id as string, a.email as string);
    }
  }

  const distinctActions = Array.from(new Set(entries.map((e) => e.action)));

  return (
    <div className="p-6">
      <div className="flex items-baseline justify-between mb-4 gap-3 flex-wrap">
        <div>
          <Link
            href="/admin"
            className="text-xs text-light-grey hover:text-primary transition-colors"
          >
            ← Admin
          </Link>
          <h2 className="text-lg font-semibold mt-1">Audit log</h2>
          <p className="text-xs text-light-grey mt-0.5">
            Security-relevant admin actions. Retention is currently indefinite.
          </p>
        </div>
        <span className="text-xs text-light-grey">
          {entries.length} recent {entries.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      {/* Action filter chips */}
      {distinctActions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <span className="text-xs text-light-grey">Filter:</span>
          <Link
            href="/admin/audit-log"
            className={`text-xs rounded-full px-2.5 py-1 border ${!params.action ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}
          >
            All
          </Link>
          {distinctActions.map((a) => (
            <Link
              key={a}
              href={`/admin/audit-log?action=${encodeURIComponent(a)}`}
              className={`text-xs rounded-full px-2.5 py-1 border ${params.action === a ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}
            >
              {a}
            </Link>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded border border-danger/40 bg-danger/5 p-3 text-sm text-danger">
          Error loading audit log: {error.message}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-3 text-left text-xs uppercase text-light-grey">
            <tr>
              <th className="p-3">When</th>
              <th className="p-3">Actor</th>
              <th className="p-3">Action</th>
              <th className="p-3">Target</th>
              <th className="p-3">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-light-grey">
                  No entries yet.
                </td>
              </tr>
            ) : (
              entries.map((e) => {
                const actorEmail = e.actor_user_id
                  ? (emailMap.get(e.actor_user_id) ?? e.actor_user_id.slice(0, 8))
                  : "system";
                const cls = ACTION_COLORS[e.action] ?? "bg-surface-3";
                return (
                  <tr key={e.id} className="hover:bg-surface-3/40">
                    <td className="p-3 text-xs text-light-grey whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-3 text-xs">
                      {e.actor_user_id ? (
                        <Link
                          href={`/admin/users/${e.actor_user_id}`}
                          className="text-primary hover:opacity-80"
                        >
                          {actorEmail}
                        </Link>
                      ) : (
                        <span className="text-light-grey">{actorEmail}</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-mono ${cls}`}
                      >
                        {e.action}
                      </span>
                    </td>
                    <td className="p-3 text-xs">
                      {e.target_type && e.target_id ? (
                        e.target_type === "user" ? (
                          <Link
                            href={`/admin/users/${e.target_id}`}
                            className="text-primary hover:opacity-80"
                          >
                            user · {e.target_id.slice(0, 8)}…
                          </Link>
                        ) : (
                          <span className="text-light-grey">
                            {e.target_type} · {e.target_id.slice(0, 8)}…
                          </span>
                        )
                      ) : (
                        <span className="text-light-grey">—</span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-light-grey">
                      {e.metadata ? (
                        <code className="font-mono text-[11px] break-all">
                          {formatMetadata(e.metadata)}
                        </code>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatMetadata(meta: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(meta)) {
    if (v === null || v === undefined) continue;
    parts.push(`${k}=${typeof v === "string" ? v : JSON.stringify(v)}`);
  }
  return parts.join(" · ").slice(0, 200);
}
