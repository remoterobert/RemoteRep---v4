import Link from "next/link";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";

/**
 * Server component: fetches the current user's chats and renders the
 * scrollable sidebar list. Used by both /chats and /chats/[id]. Highlights
 * the active chat when activeChatId is provided.
 */
export async function ChatSidebar({
  activeChatId,
}: {
  activeChatId?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: myChats } = await supabase
    .from("chat_participants")
    .select(
      "chat_id, last_read_at, chats!inner(id, tenant_id, last_message_at, tenants(name))",
    )
    .eq("user_id", user.id);

  type PartRow = {
    chat_id: string;
    last_read_at: string | null;
    chats: {
      id: string;
      tenant_id: string;
      last_message_at: string | null;
      tenants: unknown;
    };
  };
  const rows = (myChats ?? []) as unknown as PartRow[];
  const chatIds = rows.map((r) => r.chat_id);

  const { data: otherParts } =
    chatIds.length > 0
      ? await supabase
          .from("chat_participants")
          .select("chat_id, user_id, users!inner(first_name, last_name, email)")
          .in("chat_id", chatIds)
          .neq("user_id", user.id)
      : { data: [] };

  type OtherPart = {
    chat_id: string;
    user_id: string;
    users: {
      first_name: string | null;
      last_name: string | null;
      email: string;
    };
  };
  const others = (otherParts ?? []) as unknown as OtherPart[];
  const otherByChat = new Map<string, OtherPart[]>();
  for (const o of others) {
    const arr = otherByChat.get(o.chat_id) ?? [];
    arr.push(o);
    otherByChat.set(o.chat_id, arr);
  }

  const { data: latestPerChat } =
    chatIds.length > 0
      ? await supabase
          .from("messages")
          .select("chat_id, body, created_at")
          .in("chat_id", chatIds)
          .order("created_at", { ascending: false })
          .limit(200)
      : { data: [] };
  type MsgRow = { chat_id: string; body: string; created_at: string };
  const previewByChat = new Map<string, MsgRow>();
  for (const m of (latestPerChat ?? []) as unknown as MsgRow[]) {
    if (!previewByChat.has(m.chat_id)) previewByChat.set(m.chat_id, m);
  }

  const sorted = [...rows].sort((a, b) => {
    const ta = new Date(a.chats.last_message_at ?? 0).getTime();
    const tb = new Date(b.chats.last_message_at ?? 0).getTime();
    return tb - ta;
  });

  return (
    <aside className="w-full lg:w-80 shrink-0 lg:border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-light-foreground">
      <header className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-baseline justify-between">
        <h1 className="text-lg font-semibold">Chats</h1>
        {sorted.length > 0 && (
          <span className="text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-light-grey rounded-full px-2 py-0.5">
            {sorted.length}
          </span>
        )}
      </header>

      {sorted.length === 0 ? (
        <div className="px-5 py-6">
          <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-5 text-center">
            <ChatBubbleLeftRightIcon className="h-8 w-8 mx-auto mb-3 text-light-grey" />
            <p className="text-sm font-medium mb-1">No conversations yet</p>
            <p className="text-xs text-light-grey leading-relaxed">
              A chat opens as soon as a candidate says{" "}
              <span className="font-semibold text-primary">
                &ldquo;I&apos;m interested&rdquo;
              </span>
              {" "}on an invitation.
            </p>
          </div>
          <div className="mt-5 text-center">
            <p className="text-[11px] uppercase tracking-wider text-light-grey mb-2 font-semibold">
              What to do first
            </p>
            <Link
              href="/candidates"
              className="text-xs text-primary hover:opacity-80 font-medium underline underline-offset-2"
            >
              Browse candidates and invite &rarr;
            </Link>
          </div>
        </div>
      ) : (
        <ul className="overflow-y-auto flex-1 divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {sorted.map((row) => {
            const otherList = otherByChat.get(row.chat_id) ?? [];
            const otherNames = otherList
              .map((o) => {
                const fn = o.users.first_name?.trim();
                const ln = o.users.last_name?.trim();
                if (fn || ln) return `${fn ?? ""} ${ln ?? ""}`.trim();
                return o.users.email;
              })
              .join(", ");
            const initials = (() => {
              const first = otherList[0];
              if (!first) return "?";
              const fn = first.users.first_name?.trim();
              const ln = first.users.last_name?.trim();
              const a = fn?.[0] ?? "";
              const b = ln?.[0] ?? "";
              return ((a + b) || first.users.email[0]).toUpperCase();
            })();
            const preview = previewByChat.get(row.chat_id);
            const tenants = row.chats.tenants;
            const tenantName = Array.isArray(tenants)
              ? ((tenants[0] as { name: string } | undefined)?.name ?? "")
              : ((tenants as { name: string } | null)?.name ?? "");
            const isActive = row.chat_id === activeChatId;

            const unread =
              preview &&
              row.last_read_at &&
              new Date(preview.created_at).getTime() >
                new Date(row.last_read_at).getTime();

            return (
              <li key={row.chat_id}>
                <Link
                  href={`/chats/${row.chat_id}`}
                  className={`block px-4 py-3 transition-colors ${
                    isActive
                      ? "bg-primary/10 border-l-2 border-primary"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40 border-l-2 border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="font-semibold text-sm truncate">
                          {otherNames || "Conversation"}
                        </div>
                        {preview && (
                          <span className="text-[10px] text-light-grey shrink-0">
                            {timeAgo(preview.created_at)}
                          </span>
                        )}
                      </div>
                      {tenantName && (
                        <p className="text-[11px] text-light-grey truncate mt-0.5">
                          {tenantName}
                        </p>
                      )}
                      {preview ? (
                        <p
                          className={`text-xs mt-1 truncate ${unread ? "font-semibold" : "text-light-grey"}`}
                        >
                          {preview.body}
                        </p>
                      ) : (
                        <p className="text-xs text-light-grey italic mt-1">
                          No messages yet
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.round((now - then) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}
