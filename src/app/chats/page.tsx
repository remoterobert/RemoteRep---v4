import { redirect } from "next/navigation";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";
import { ChatSidebar } from "./ChatSidebar";
import { SupportChatDemo } from "./SupportChatDemo";

export const dynamic = "force-dynamic";

export default async function ChatsIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("tenant_members")
    .select("role, tenants!inner(type)")
    .eq("user_id", user.id)
    .eq("status", "active");

  type M = { role: string; tenants: { type: string } };
  const rows = (memberships ?? []) as unknown as M[];
  const isHiring = rows.some(
    (m) => m.tenants.type === "client_company" || m.tenants.type === "agency",
  );

  return (
    <div className="flex h-[calc(100vh-4.5rem)] w-full bg-zinc-50 dark:bg-dark-background">
      <ChatSidebar />

      {/* Right pane: interactive support-chat placeholder — desktop only.
          Demonstrates how conversations work; no real messages are sent. */}
      <main className="hidden lg:flex flex-1 flex-col min-w-0 bg-surface">
        {/* Header */}
        <header className="border-b border-zinc-200 dark:border-zinc-800 px-4 lg:px-6 py-3 flex items-center gap-3 shrink-0">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-blue text-white flex items-center justify-center shrink-0">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0b1220]" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold text-sm truncate">RemoteRep Support</h1>
            <p className="text-xs text-emerald-500 truncate">
              Online · here to show you how chats work
            </p>
          </div>
        </header>

        <SupportChatDemo iAmHiring={isHiring} />
      </main>
    </div>
  );
}
