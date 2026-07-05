import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  SparklesIcon,
  EnvelopeIcon,
  PaperAirplaneIcon,
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

      {/* Right pane: coaching empty state — desktop only */}
      <main className="hidden lg:flex flex-1 flex-col items-center justify-center p-8 bg-surface">
        <div className="max-w-md w-full">
          {/* Hero card */}
          <div className="rounded-2xl border border-border bg-white dark:bg-gradient-to-b dark:from-[#152146] dark:to-[#101a37] p-8 text-center shadow-lg shadow-primary/5">
            <div className="relative mx-auto mb-5">
              <div className="absolute inset-0 bg-primary/25 blur-2xl rounded-full" />
              <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-bold tracking-tight mb-2">
              Select a conversation
            </h2>
            <p className="text-sm text-light-grey mb-6 leading-relaxed">
              Pick a chat from the left to jump in — or start a new one by{" "}
              {isHiring
                ? "inviting a candidate."
                : "responding to an invitation."}
            </p>

            {isHiring ? (
              <Link
                href="/candidates"
                className="inline-flex items-center gap-2 rounded bg-primary text-white px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <UserGroupIcon className="h-4 w-4" />
                Browse candidates
              </Link>
            ) : (
              <Link
                href="/opportunities"
                className="inline-flex items-center gap-2 rounded bg-primary text-white px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <ClipboardDocumentListIcon className="h-4 w-4" />
                Browse opportunities
              </Link>
            )}
          </div>

          {/* How chats work */}
          <div className="mt-6 rounded-2xl border border-border bg-white dark:bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-3">
              <SparklesIcon className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-light-grey">
                How chats work
              </h3>
            </div>
            <ol className="space-y-3 text-sm">
              {isHiring ? (
                <>
                  <Step
                    icon={<UserGroupIcon className="h-4 w-4" />}
                    title="1. Invite a candidate"
                    text="Browse talent → click Invite on a card that fits."
                  />
                  <Step
                    icon={<EnvelopeIcon className="h-4 w-4" />}
                    title="2. They see the invitation"
                    text="It shows on their dashboard right away."
                  />
                  <Step
                    icon={<PaperAirplaneIcon className="h-4 w-4" />}
                    title="3. Chat opens when they respond"
                    text={"Once they say “I'm interested,” a real conversation opens here."}
                  />
                </>
              ) : (
                <>
                  <Step
                    icon={<ClipboardDocumentListIcon className="h-4 w-4" />}
                    title="1. Companies invite you"
                    text="Public profiles get more views. Complete yours in the Dashboard."
                  />
                  <Step
                    icon={<EnvelopeIcon className="h-4 w-4" />}
                    title={"2. Say “I'm interested”"}
                    text="Your reply immediately opens a chat with the company."
                  />
                  <Step
                    icon={<PaperAirplaneIcon className="h-4 w-4" />}
                    title="3. Line up the call"
                    text="Use the chat to introduce yourself and schedule."
                  />
                </>
              )}
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}

function Step({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <div className="h-7 w-7 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-sm">{title}</div>
        <p className="text-xs text-light-grey mt-0.5">{text}</p>
      </div>
    </li>
  );
}
