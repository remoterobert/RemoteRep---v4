import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ChevronLeftIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";
import { ChatSidebar } from "../ChatSidebar";
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

  const { data: participation } = await supabase
    .from("chat_participants")
    .select("chat_id, last_read_at")
    .eq("chat_id", chatId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!participation) notFound();

  const { data: chat } = await supabase
    .from("chats")
    .select("id, tenant_id, related_application_id, tenants(name, type)")
    .eq("id", chatId)
    .single();

  if (!chat) notFound();

  const chatTenants = (
    chat as unknown as {
      tenants: { name: string; type: string } | { name: string; type: string }[] | null;
    }
  ).tenants;
  const tenantInfo = Array.isArray(chatTenants) ? chatTenants[0] : chatTenants;
  const tenantName = tenantInfo?.name ?? "";
  const tenantType = tenantInfo?.type ?? "";

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

  const { data: initialMessages } = await supabase
    .from("messages")
    .select("id, chat_id, author_user_id, body, created_at, edited_at, deleted_at")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  await supabase
    .from("chat_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("chat_id", chatId)
    .eq("user_id", user.id);

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

  // My perspective (hiring vs candidate) drives the icebreaker set
  const { data: myMemberships } = await supabase
    .from("tenant_members")
    .select("role, tenants!inner(type)")
    .eq("user_id", user.id)
    .eq("status", "active");
  type M = { role: string; tenants: { type: string } };
  const myRows = (myMemberships ?? []) as unknown as M[];
  const iAmHiring = myRows.some(
    (m) => m.tenants.type === "client_company" || m.tenants.type === "agency",
  );

  const icebreakers = iAmHiring
    ? [
        "Do you have time for a quick call this week?",
        "Tell me about your best quarter — what made it work?",
        "What are you looking for in your next role?",
      ]
    : [
        "Thanks for reaching out! Could you tell me more about the role?",
        "What's the compensation structure like?",
        "When are you looking to bring someone on board?",
      ];

  return (
    <div className="flex h-[calc(100vh-4.5rem)] w-full bg-zinc-50 dark:bg-dark-background">
      {/* Sidebar visible on desktop only */}
      <div className="hidden lg:flex">
        <ChatSidebar activeChatId={chatId} />
      </div>

      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0d1526]">
        {/* Header */}
        <header className="border-b border-zinc-200 dark:border-zinc-800 px-4 lg:px-6 py-3 flex items-center gap-3 shrink-0">
          <Link
            href="/chats"
            aria-label="Back to chats"
            className="text-light-grey hover:text-primary transition-colors lg:hidden"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
            {(headerNames.split(" ")[0]?.[0] ?? "?").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold text-sm truncate">
              {headerNames || "Conversation"}
            </h1>
            {tenantName && (
              <p className="text-xs text-light-grey truncate flex items-center gap-1">
                <BriefcaseIcon className="h-3 w-3" />
                {tenantName}
                {tenantType && tenantType !== "solo_talent" && (
                  <span className="text-light-grey">
                    · {tenantType.replace("_", " ")}
                  </span>
                )}
              </p>
            )}
          </div>
        </header>

        <ChatThread
          chatId={chatId}
          currentUserId={user.id}
          initialMessages={initialMessages ?? []}
          nameByUserId={nameByUserId}
          icebreakers={icebreakers}
          otherName={headerNames || "them"}
          iAmHiring={iAmHiring}
        />
      </main>
    </div>
  );
}
