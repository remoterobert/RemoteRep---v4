import Link from "next/link";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { htmlToText } from "@/lib/messageText";

/**
 * Server component: fetches the current user's chats and renders the
 * scrollable sidebar list. Used by both /chats and /chats/[id].
 * Highlights the active chat when activeChatId is provided.
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

  // The counterpart's name/photo lives behind RLS — a user can't read another
  // user's `users` row, so the `users!inner` join silently drops them and the
  // chat renders as "Conversation". Use the service-role client, scoped to
  // THIS user's own chats (chatIds), to resolve who they're talking to.
  const admin = createAdminClient();
  const { data: otherParts } =
    chatIds.length > 0
      ? await admin
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

  // Counterpart avatar: their own profile photo if they have one, otherwise
  // the company logo of the chat's tenant. Both are read via the admin client
  // (scoped to this user's chats' participants and tenants).
  const otherUserIds = [...new Set(others.map((o) => o.user_id))];
  const { data: photoRows } =
    otherUserIds.length > 0
      ? await admin
          .from("candidate_profiles")
          .select("user_id, photo_url")
          .in("user_id", otherUserIds)
          .not("photo_url", "is", null)
      : { data: [] };
  const photoByUser = new Map<string, string>();
  for (const p of (photoRows ?? []) as {
    user_id: string;
    photo_url: string | null;
  }[]) {
    if (p.photo_url) photoByUser.set(p.user_id, p.photo_url);
  }

  const tenantIds = [
    ...new Set(rows.map((r) => r.chats.tenant_id).filter(Boolean)),
  ];
  const { data: logoRows } =
    tenantIds.length > 0
      ? await admin
          .from("client_profiles")
          .select("tenant_id, logo_url")
          .in("tenant_id", tenantIds)
          .not("logo_url", "is", null)
      : { data: [] };
  const logoByTenant = new Map<string, string>();
  for (const l of (logoRows ?? []) as {
    tenant_id: string;
    logo_url: string | null;
  }[]) {
    if (l.logo_url) logoByTenant.set(l.tenant_id, l.logo_url);
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
    <aside className="chat-sidebar w-full lg:w-[340px] shrink-0 flex flex-col lg:border-r border-border bg-surface-2">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <div className="flex items-baseline justify-between mb-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Chats
          </h1>
          {sorted.length > 0 && (
            <span className="text-xs font-semibold bg-primary/10 text-primary rounded-full px-2.5 py-0.5">
              {sorted.length}
            </span>
          )}
        </div>
        <p className="text-xs text-light-grey">
          {sorted.length === 0
            ? "Nothing here yet — that changes fast."
            : sorted.length === 1
              ? "1 active conversation"
              : `${sorted.length} active conversations`}
        </p>
      </header>

      <ul className="overflow-y-auto flex-1 px-2 py-2 space-y-0.5">
        {/* Pinned interactive placeholder — a stand-in for the support bot */}
        <li>
          <Link
            href="/chats"
            className={`group block px-3 py-3 rounded-xl transition-all duration-150 ${
              !activeChatId
                ? "bg-primary/12 dark:bg-primary/15"
                : "hover:bg-zinc-100 dark:hover:bg-white/[0.04]"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="relative shrink-0">
                <div className="h-11 w-11 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-blue text-white shadow-sm">
                  <SparklesIcon className="h-5 w-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0b1220]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                  <div className="text-sm truncate font-bold text-foreground">
                    RemoteRep Support
                  </div>
                  <span className="text-[10px] shrink-0 tracking-wide font-semibold text-primary">
                    New
                  </span>
                </div>
                <p className="text-[11px] text-emerald-500 truncate mb-1">
                  Online
                </p>
                <p className="text-xs truncate leading-snug text-light-grey">
                  👋 Welcome! Say hi to see how chats work.
                </p>
              </div>
            </div>
          </Link>
        </li>

        {sorted.length === 0 ? (
          <li className="px-3 pt-6 pb-4">
            <p className="text-center text-xs text-light-grey leading-relaxed">
              Your real conversations will appear here. When a candidate says{" "}
              <span className="font-semibold text-primary">
                &ldquo;I&apos;m interested&rdquo;
              </span>{" "}
              on your invitation, the chat lands right below.
            </p>
          </li>
        ) : (
          sorted.map((row) => {
            const otherList = otherByChat.get(row.chat_id) ?? [];
            const preview = previewByChat.get(row.chat_id);
            const tenants = row.chats.tenants;
            const tenantName = Array.isArray(tenants)
              ? ((tenants[0] as { name: string } | undefined)?.name ?? "")
              : ((tenants as { name: string } | null)?.name ?? "");

            // Title = the counterpart's real name, else the company name.
            const otherDisplayName = otherList
              .map((o) => {
                const fn = o.users.first_name?.trim();
                const ln = o.users.last_name?.trim();
                return fn || ln ? `${fn ?? ""} ${ln ?? ""}`.trim() : "";
              })
              .filter(Boolean)
              .join(", ");
            const title = otherDisplayName || tenantName || "Conversation";

            // Avatar = counterpart's photo, else the company logo, else initials.
            const counterpartPhoto =
              otherList.map((o) => photoByUser.get(o.user_id)).find(Boolean) ??
              (row.chats.tenant_id
                ? logoByTenant.get(row.chats.tenant_id)
                : undefined) ??
              null;
            const initials =
              title
                .split(/\s+/)
                .map((w) => w[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase() || "?";
            const isActive = row.chat_id === activeChatId;

            const unread =
              !!preview &&
              !!row.last_read_at &&
              new Date(preview.created_at).getTime() >
                new Date(row.last_read_at).getTime();

            return (
              <li key={row.chat_id}>
                <Link
                  href={`/chats/${row.chat_id}`}
                  className={`group block px-3 py-3 rounded-xl transition-all duration-150 ${
                    isActive
                      ? "bg-primary/12 dark:bg-primary/15"
                      : "hover:bg-zinc-100 dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      {counterpartPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={counterpartPhoto}
                          alt=""
                          className="h-11 w-11 rounded-full object-cover shadow-sm bg-surface-3"
                        />
                      ) : (
                        <div
                          className={`h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                            isActive
                              ? "bg-gradient-to-br from-primary to-primary-blue text-white"
                              : "bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-white/10 dark:to-white/[0.03] text-foreground ring-1 ring-white/5"
                          }`}
                        >
                          {initials}
                        </div>
                      )}
                      {unread && (
                        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary ring-2 ring-white dark:ring-[#0b1220]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2 mb-0.5">
                        <div
                          className={`text-sm truncate ${unread || isActive ? "font-bold" : "font-semibold"} text-foreground`}
                        >
                          {title}
                        </div>
                        {preview && (
                          <span
                            className={`text-[10px] shrink-0 tracking-wide font-medium ${unread ? "text-primary" : "text-light-grey"}`}
                          >
                            {timeAgo(preview.created_at)}
                          </span>
                        )}
                      </div>
                      {tenantName && tenantName !== title && (
                        <p className="text-[11px] text-light-grey truncate mb-1">
                          {tenantName}
                        </p>
                      )}
                      {preview ? (
                        <p
                          className={`text-xs truncate leading-snug ${
                            unread
                              ? "text-foreground font-medium"
                              : "text-light-grey"
                          }`}
                        >
                          {htmlToText(preview.body)}
                        </p>
                      ) : (
                        <p className="text-xs text-light-grey italic">
                          No messages yet — say hi
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </aside>
  );
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.round((now - then) / 1000);
  if (s < 60) return "now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
