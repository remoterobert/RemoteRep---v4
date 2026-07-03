import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ChatsListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Chats I'm a participant in
  const { data: myChats } = await supabase
    .from("chat_participants")
    .select(
      "chat_id, last_read_at, chats!inner(id, tenant_id, last_message_at, related_application_id, tenants(name))",
    )
    .eq("user_id", user.id);

  type PartRow = {
    chat_id: string;
    last_read_at: string | null;
    chats: {
      id: string;
      tenant_id: string;
      last_message_at: string | null;
      related_application_id: string | null;
      tenants: { name: string } | null;
    };
  };
  const rows = (myChats ?? []) as unknown as PartRow[];

  // Preload the other participants for each chat (for name display)
  const chatIds = rows.map((r) => r.chat_id);
  const { data: otherParts } = chatIds.length > 0
    ? await supabase
        .from("chat_participants")
        .select("chat_id, user_id, users!inner(first_name, last_name, email)")
        .in("chat_id", chatIds)
        .neq("user_id", user.id)
    : { data: [] };

  type OtherPart = {
    chat_id: string;
    user_id: string;
    users: { first_name: string | null; last_name: string | null; email: string };
  };
  const others = (otherParts ?? []) as unknown as OtherPart[];
  const otherByChat = new Map<string, OtherPart[]>();
  for (const o of others) {
    const arr = otherByChat.get(o.chat_id) ?? [];
    arr.push(o);
    otherByChat.set(o.chat_id, arr);
  }

  // Latest message preview per chat (single query, then group)
  const { data: latestPerChat } = chatIds.length > 0
    ? await supabase
        .from("messages")
        .select("chat_id, body, created_at, author_user_id")
        .in("chat_id", chatIds)
        .order("created_at", { ascending: false })
        .limit(200)
    : { data: [] };

  type MsgRow = {
    chat_id: string;
    body: string;
    created_at: string;
    author_user_id: string;
  };
  const previewByChat = new Map<string, MsgRow>();
  for (const m of (latestPerChat ?? []) as unknown as MsgRow[]) {
    if (!previewByChat.has(m.chat_id)) previewByChat.set(m.chat_id, m);
  }

  // Sort chats by last_message_at desc
  const sorted = [...rows].sort((a, b) => {
    const ta = new Date(a.chats.last_message_at ?? 0).getTime();
    const tb = new Date(b.chats.last_message_at ?? 0).getTime();
    return tb - ta;
  });

  return (
    <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
      <h1 className="text-2xl font-semibold mb-1">Chats</h1>
      <p className="text-sm text-light-grey mb-6">
        Conversations open with candidates and companies you&apos;ve matched
        with.
      </p>

      {sorted.length === 0 ? (
        <div className="p-8 text-center border border-zinc-200 dark:border-zinc-800 rounded">
          <p className="text-sm text-light-grey mb-2">
            No conversations yet.
          </p>
          <p className="text-xs text-light-grey">
            Chats open when a candidate says &quot;I&apos;m interested&quot; on
            an invitation.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded">
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
            const preview = previewByChat.get(row.chat_id);
            const tenantName = row.chats.tenants?.name ?? "";

            return (
              <li key={row.chat_id}>
                <Link
                  href={`/chats/${row.chat_id}`}
                  className="block p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  <div className="flex items-baseline justify-between mb-1">
                    <div className="font-semibold text-sm">
                      {otherNames || "Conversation"}
                      {tenantName && (
                        <span className="text-light-grey ml-2 text-xs font-normal">
                          · {tenantName}
                        </span>
                      )}
                    </div>
                    {preview && (
                      <span className="text-xs text-light-grey shrink-0 ml-2">
                        {new Date(preview.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {preview ? (
                    <p className="text-sm text-light-grey line-clamp-1">
                      {preview.body}
                    </p>
                  ) : (
                    <p className="text-sm text-light-grey italic">
                      No messages yet
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
