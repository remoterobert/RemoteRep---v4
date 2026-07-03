import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select(
      "id, event_type, entity_type, entity_id, tenant_id, actor_user_id, payload, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent events</h2>
        <span className="text-xs text-light-grey">
          latest {events?.length ?? 0}
        </span>
      </div>

      {!events || events.length === 0 ? (
        <p className="text-sm text-light-grey mt-4">
          No events yet. Features that write events will populate this feed
          as users interact.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded">
          {events.map((e) => (
            <li key={e.id} className="p-3 text-sm">
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5">
                  {e.event_type}
                </span>
                <span className="text-xs text-light-grey">
                  {new Date(e.created_at).toLocaleString()}
                </span>
              </div>
              {e.entity_type && (
                <div className="text-xs text-light-grey">
                  {e.entity_type}
                  {e.entity_id ? ` · ${e.entity_id}` : ""}
                </div>
              )}
              {e.payload && Object.keys(e.payload).length > 0 && (
                <pre className="text-xs mt-2 bg-zinc-50 dark:bg-zinc-900 p-2 rounded overflow-x-auto">
                  {JSON.stringify(e.payload, null, 2)}
                </pre>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
