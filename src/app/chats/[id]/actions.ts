"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotificationEmail } from "@/lib/notification-email";
import { maybeRunConciergeReply } from "@/lib/concierge";
import {
  AI_DISCLOSURE_VERSION,
  disclosureFlatText,
} from "@/lib/ai-disclosure";

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

  // If this message is from the candidate side and the chat's listing has
  // concierge enabled + consent recorded, the agent generates a reply.
  // Fire-and-forget: any failure inside the agent is swallowed so it
  // never blocks the user-facing message.
  try {
    await maybeRunConciergeReply(chatId, user.id);
  } catch {
    // agent errors never surface here
  }

  revalidatePath(`/chats/${chatId}`);
  revalidatePath("/chats");
}

/**
 * Candidate recorded consent for the concierge AI to interact with them
 * on this tenant's behalf. Called from the AiConsentGate form.
 */
export async function grantAiConsent(formData: FormData) {
  const chatId = String(formData.get("chat_id") ?? "").trim();
  const tenantId = String(formData.get("tenant_id") ?? "").trim();
  if (!chatId || !tenantId) redirect("/chats");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null;
  const userAgent = h.get("user-agent") ?? null;

  await supabase.from("candidate_ai_consent").upsert(
    {
      user_id: user.id,
      tenant_id: tenantId,
      consented_at: new Date().toISOString(),
      revoked_at: null,
      disclosure_version: AI_DISCLOSURE_VERSION,
      disclosure_shown: disclosureFlatText(),
      ip_address: ip,
      user_agent: userAgent,
    },
    { onConflict: "user_id,tenant_id" },
  );

  revalidatePath(`/chats/${chatId}`);
  redirect(`/chats/${chatId}?consented=1`);
}

/**
 * Candidate opts out of AI. Records a revoked consent (so the agent
 * won't run), and posts a system message to the chat explaining that
 * only humans will reply going forward.
 */
export async function revokeAiConsent(formData: FormData) {
  const chatId = String(formData.get("chat_id") ?? "").trim();
  const tenantId = String(formData.get("tenant_id") ?? "").trim();
  if (!chatId || !tenantId) redirect("/chats");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date().toISOString();
  await supabase.from("candidate_ai_consent").upsert(
    {
      user_id: user.id,
      tenant_id: tenantId,
      consented_at: now,
      revoked_at: now,
      disclosure_version: AI_DISCLOSURE_VERSION,
      disclosure_shown: disclosureFlatText(),
    },
    { onConflict: "user_id,tenant_id" },
  );

  // Drop a system message in the chat so the hiring team sees the opt-out.
  const admin = createAdminClient();
  await admin.from("messages").insert({
    chat_id: chatId,
    author_user_id: user.id,
    author_kind: "system",
    body: "The candidate has opted out of AI interaction. Please continue this conversation as a human.",
  });

  revalidatePath(`/chats/${chatId}`);
  redirect(`/chats/${chatId}?consent=opted_out`);
}
