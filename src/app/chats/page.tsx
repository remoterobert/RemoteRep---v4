import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";
import { ChatSidebar } from "./ChatSidebar";

export const dynamic = "force-dynamic";

export default async function ChatsIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Figure out user type so we can tailor the empty-state coaching
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
    <div className="flex h-[calc(100vh-4.5rem)] max-w-6xl mx-auto w-full">
      <ChatSidebar />

      {/* Right pane: coaching empty state — hidden on mobile (the list is
          the primary content there) */}
      <main className="hidden lg:flex flex-1 flex-col items-center justify-center p-8 text-center bg-zinc-50 dark:bg-zinc-950/50">
        <div className="max-w-sm">
          <ChatBubbleLeftRightIcon className="h-14 w-14 mx-auto mb-4 text-light-grey" />
          <h2 className="text-lg font-semibold mb-2">Select a conversation</h2>
          <p className="text-sm text-light-grey mb-6">
            Pick a chat from the left to jump in — or start a new one by
            {" "}
            {isHiring ? "inviting a candidate" : "responding to an invitation"}.
          </p>

          {isHiring ? (
            <div className="space-y-2">
              <Link
                href="/candidates"
                className="inline-flex items-center gap-2 rounded bg-primary text-white px-4 py-2 text-sm font-medium hover:opacity-90"
              >
                <UserGroupIcon className="h-4 w-4" />
                Browse candidates
              </Link>
              <p className="text-xs text-light-grey">
                Every candidate you invite gets a chat when they respond.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                href="/opportunities"
                className="inline-flex items-center gap-2 rounded bg-primary text-white px-4 py-2 text-sm font-medium hover:opacity-90"
              >
                <ClipboardDocumentListIcon className="h-4 w-4" />
                Browse opportunities
              </Link>
              <p className="text-xs text-light-grey">
                Bookmark roles you like — companies see your interest and can
                reach out.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
