import { redirect } from "next/navigation";
import {
  BellIcon,
  ChatBubbleLeftRightIcon,
  UserPlusIcon,
  UsersIcon,
  MegaphoneIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";
import {
  recentNotifications,
  notificationHref,
  type NotificationKind,
  type NotificationRow,
} from "@/lib/notifications";
import {
  markAllNotificationsSeen,
  markNotificationSeen,
} from "./actions";

export const dynamic = "force-dynamic";

const KIND_ICON: Record<NotificationKind, React.ComponentType<{ className?: string }>> = {
  chat: ChatBubbleLeftRightIcon,
  client_application: UserPlusIcon,
  talent_application: UsersIcon,
  listing_update: MegaphoneIcon,
  system: InformationCircleIcon,
};

const KIND_LABEL: Record<NotificationKind, string> = {
  chat: "Chat",
  client_application: "Invitation",
  talent_application: "Response",
  listing_update: "Listing",
  system: "System",
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const rows = await recentNotifications(100);
  const unread = rows.filter((r) => !r.seen_at);

  return (
    <main className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full">
      <div className="flex items-baseline justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-light-grey">
            {unread.length > 0
              ? `${unread.length} unread`
              : "You're all caught up."}
          </p>
        </div>
        {unread.length > 0 && (
          <form action={markAllNotificationsSeen}>
            <button
              type="submit"
              className="text-xs text-primary hover:opacity-80 transition-opacity"
            >
              Mark all as read
            </button>
          </form>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface-2 p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <BellIcon className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium">No notifications yet</p>
          <p className="text-xs text-light-grey mt-1">
            When someone invites you, responds, or messages you, it&apos;ll
            show up here.
          </p>
        </div>
      ) : (
        <ul className="rounded-2xl border border-border overflow-hidden divide-y divide-border">
          {rows.map((n) => (
            <NotificationRow key={n.id} n={n} />
          ))}
        </ul>
      )}
    </main>
  );
}

function NotificationRow({ n }: { n: NotificationRow }) {
  const Icon = KIND_ICON[n.kind] ?? BellIcon;
  const href = notificationHref(n);
  const isUnread = !n.seen_at;
  const when = timeAgo(new Date(n.updated_at ?? n.created_at));

  return (
    <li className={isUnread ? "bg-primary/[0.04]" : "bg-surface-2"}>
      <form action={markNotificationSeen}>
        <input type="hidden" name="notification_id" value={n.id} />
        <input type="hidden" name="href" value={href} />
        <button
          type="submit"
          className="w-full text-left flex items-start gap-3 p-4 hover:bg-surface-3 transition-colors"
        >
          <div
            className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center ${
              isUnread
                ? "bg-primary/15 text-primary"
                : "bg-surface-3 text-light-grey"
            }`}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-wider text-light-grey mr-2">
                  {KIND_LABEL[n.kind] ?? n.kind}
                </span>
                <span className="text-sm font-semibold">
                  {n.title ?? "Notification"}
                </span>
                {n.message_count > 1 && (
                  <span className="ml-2 text-[10px] rounded-full bg-primary/15 text-primary px-1.5 py-0.5">
                    +{n.message_count - 1}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-light-grey shrink-0 whitespace-nowrap">
                {when}
              </span>
            </div>
            {n.body && (
              <p className="text-sm text-light-grey mt-0.5 line-clamp-2">
                {n.body}
              </p>
            )}
          </div>
          {isUnread && (
            <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-3" />
          )}
        </button>
      </form>
    </li>
  );
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
