import Link from "next/link";
import {
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";

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

      {sorted.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center px-6 pb-8">
          {/* Hero illustration */}
          <div className="relative mx-auto mb-6">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
            <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="h-9 w-9 text-primary" />
            </div>
          </div>

          <h2 className="text-center text-base font-semibold mb-2">
            No conversations yet
          </h2>
          <p className="text-center text-sm text-light-grey leading-relaxed mb-6 max-w-[260px] mx-auto">
            When a candidate says{" "}
            <span className="font-semibold text-primary">
              &ldquo;I&apos;m interested&rdquo;
            </span>{" "}
            on your invitation, the conversation lands right here.
          </p>

          {/* Steps card */}
          <div className="rounded-xl bg-surface-2 border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <SparklesIcon className="h-4 w-4 text-primary" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-light-grey">
                Getting started
              </span>
            </div>
            <ol className="space-y-2.5 text-xs">
              <StepLine num={1} text="Browse candidates" />
              <StepLine num={2} text="Click Invite on a good fit" />
              <StepLine num={3} text="They accept — chat opens" />
            </ol>
            <Link
              href="/candidates"
              className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-primary text-white px-3 py-2 text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Browse candidates
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <ul className="overflow-y-auto flex-1 px-2 py-2 space-y-0.5">
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
                      <div
                        className={`h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                          isActive
                            ? "bg-gradient-to-br from-primary to-primary-blue text-white"
                            : "bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-white/10 dark:to-white/[0.03] text-foreground ring-1 ring-white/5"
                        }`}
                      >
                        {initials}
                      </div>
                      {unread && (
                        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary ring-2 ring-white dark:ring-[#0b1220]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2 mb-0.5">
                        <div
                          className={`text-sm truncate ${unread || isActive ? "font-bold" : "font-semibold"} text-foreground`}
                        >
                          {otherNames || "Conversation"}
                        </div>
                        {preview && (
                          <span
                            className={`text-[10px] shrink-0 tracking-wide font-medium ${unread ? "text-primary" : "text-light-grey"}`}
                          >
                            {timeAgo(preview.created_at)}
                          </span>
                        )}
                      </div>
                      {tenantName && (
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
                          {preview.body}
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
          })}
        </ul>
      )}
    </aside>
  );
}

function StepLine({ num, text }: { num: number; text: string }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className="h-5 w-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
        {num}
      </span>
      <span className="text-foreground/85 leading-tight">
        {text}
      </span>
    </li>
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
