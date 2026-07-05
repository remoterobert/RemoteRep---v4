import { createClient } from "@/lib/supabase/server";

export type NotificationKind =
  | "chat"
  | "talent_application"
  | "client_application"
  | "listing_update"
  | "system";

export type NotificationRow = {
  id: string;
  user_id: string;
  tenant_id: string | null;
  kind: NotificationKind;
  entity_type: string | null;
  entity_id: string | null;
  title: string | null;
  body: string | null;
  message_count: number;
  payload: Record<string, unknown>;
  seen_at: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Count of unseen notifications for the current user. Cheap enough to
 * call in AppShell for the bell badge.
 */
export async function unreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("seen_at", null);
  return count ?? 0;
}

/**
 * The 50 most recent notifications for the current user. Unseen first.
 */
export async function recentNotifications(limit = 50) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [] as NotificationRow[];

  const { data } = await supabase
    .from("notifications")
    .select(
      "id, user_id, tenant_id, kind, entity_type, entity_id, title, body, message_count, payload, seen_at, created_at, updated_at",
    )
    .eq("user_id", user.id)
    .order("seen_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as NotificationRow[];
}

/**
 * Given a notification, figure out the best URL to send the user to.
 * Falls back to /notifications when the entity has no obvious page.
 */
export function notificationHref(n: NotificationRow): string {
  const payload = (n.payload ?? {}) as Record<string, unknown>;
  switch (n.kind) {
    case "chat": {
      const chatId = (payload.chat_id ?? n.entity_id) as string | undefined;
      return chatId ? `/chats/${chatId}` : "/chats";
    }
    case "client_application":
      // Candidate got invited. Send them to the dashboard where the
      // "you've been invited" card lives.
      return "/dashboard";
    case "talent_application": {
      // Company got a response. Send them to the application (via listing
      // if present) or to their listings index.
      const chatId = payload.chat_id as string | undefined;
      if (chatId) return `/chats/${chatId}`;
      return "/company/listings";
    }
    case "listing_update":
      return "/opportunities";
    case "system":
    default:
      return "/notifications";
  }
}
