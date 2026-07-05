"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotificationEmail } from "@/lib/notification-email";

export async function sendMessage(formData: FormData) {
  const chatId = String(formData.get("chat_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!chatId || !body) return;
  if (body.length > 5000) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("messages").insert({
    chat_id: chatId,
    author_user_id: user.id,
    body,
  });

  if (error) {
    redirect(`/chats/${chatId}?error=${encodeURIComponent(error.message)}`);
  }

  // The trigger `messages_notify_chat_message` handles the in-app
  // notification insert. Send email to other participants — service-role
  // client so we can read the participant list regardless of RLS.
  const admin = createAdminClient();
  const { data: participants } = await admin
    .from("chat_participants")
    .select("user_id")
    .eq("chat_id", chatId)
    .neq("user_id", user.id);
  const { data: authorRow } = await admin
    .from("users")
    .select("first_name, last_name, email")
    .eq("id", user.id)
    .maybeSingle();
  const authorName =
    (authorRow?.first_name || authorRow?.last_name
      ? `${authorRow?.first_name ?? ""} ${authorRow?.last_name ?? ""}`.trim()
      : authorRow?.email) || "Someone";
  const preview =
    body.length > 140 ? `${body.slice(0, 137)}...` : body.replace(/\s+/g, " ");

  await Promise.all(
    (participants ?? []).map((p) =>
      sendNotificationEmail({
        userId: (p as { user_id: string }).user_id,
        kind: "chat",
        subject: `New message from ${authorName}`,
        headline: `${authorName} sent you a message`,
        intro: preview,
        ctaLabel: "Open chat",
        ctaPath: `/chats/${chatId}`,
      }),
    ),
  );

  revalidatePath(`/chats/${chatId}`);
  revalidatePath("/chats");
}
