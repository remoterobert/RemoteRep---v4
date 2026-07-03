import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";
import { ChatThread } from "./ChatThread";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function ChatDetailPage({ params }: { params: Params }) {
  const { id: chatId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify caller is a participant (RLS also enforces this, but nice to
  // 404 rather than "empty list").
  const { data: participation } = await supabase
    .from("chat_participants")
    .select("chat_id, last_read_at")
    .eq("chat_id", chatId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!participation) notFound();

  const { data: chat } = await supabase
    .from("chats")
    .select("id, tenant_id, related_application_id, tenants(name)")
    .eq("id", chatId)
    .single();

  if (!chat) notFound();

  // Other participants (for header)
  const { data: otherParticipants } = await supabase
    .from("chat_participants")
    .select("user_id, users!inner(first_name, last_name, email)")
    .eq("chat_id", chatId)
    .neq("user_id", user.id);

  type OtherPart = {
    user_id: string;
    users: {
      first_name: string | null;
      last_name: string | null;
      email: string;
    };
  };
  const others = (otherParticipants ?? []) as unknown as OtherPart[];
  const headerNames = others
    .map((o) => {
      const fn = o.users.first_name?.trim();
      const ln = o.users.last_name?.trim();
      if (fn || ln) return `${fn ?? ""} ${ln ?? ""}`.trim();
      return o.users.email;
    })
    .join(", ");

  const chatTenants = (chat as unknown as {
    tenants: { name: string } | { name: string }[] | null;
  }).tenants;
  const tenantName = Array.isArray(chatTenants)
    ? (chatTenants[0]?.name ?? "")
    : (chatTenants?.name ?? "");

  const { data: initialMessages } = await supabase
    .from("messages")
    .select("id, chat_id, author_user_id, body, created_at, edited_at, deleted_at")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  // Mark chat as read for this user (best-effort)
  await supabase
    .from("chat_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("chat_id", chatId)
    .eq("user_id", user.id);

  // Build display name map so client can label authors
  const { data: allParts } = await supabase
    .from("chat_participants")
    .select("user_id, users!inner(first_name, last_name, email)")
    .eq("chat_id", chatId);

  type AllPart = {
    user_id: string;
    users: {
      first_name: string | null;
      last_name: string | null;
      email: string;
    };
  };
  const nameByUserId: Record<string, string> = {};
  for (const p of (allParts ?? []) as unknown as AllPart[]) {
    const fn = p.users.first_name?.trim();
    const ln = p.users.last_name?.trim();
    const label =
      fn || ln ? `${fn ?? ""} ${ln ?? ""}`.trim() : p.users.email;
    nameByUserId[p.user_id] = label;
  }

  return (
    <main className="flex flex-col h-[calc(100vh-4.5rem)] max-w-3xl mx-auto w-full">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-3 flex items-center gap-3">
        <Link
          href="/chats"
          aria-label="Back to chats"
          className="text-light-grey hover:text-primary transition-colors"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-semibold text-sm truncate">
            {headerNames || "Conversation"}
          </h1>
          {tenantName && (
            <p className="text-xs text-light-grey truncate">{tenantName}</p>
          )}
        </div>
      </header>

      <ChatThread
        chatId={chatId}
        currentUserId={user.id}
        initialMessages={initialMessages ?? []}
        nameByUserId={nameByUserId}
      />
    </main>
  );
}
