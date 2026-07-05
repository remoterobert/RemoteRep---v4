"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotificationEmail } from "@/lib/notification-email";

export async function applyToListing(formData: FormData) {
  const listingId = String(formData.get("listing_id") ?? "").trim();
  const rawMessage = String(formData.get("message") ?? "").trim();
  const message = rawMessage.length > 0 ? rawMessage.slice(0, 500) : null;

  if (!listingId) redirect("/opportunities");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(`/listings/${listingId}`)}`);
  }

  const { data, error } = await supabase.rpc("apply_to_listing", {
    p_listing_id: listingId,
    p_message: message,
  });

  if (error) {
    redirect(
      `/listings/${listingId}?error=${encodeURIComponent(error.message)}`,
    );
  }

  // RPCs that return `table(...)` come back as an array from PostgREST.
  // Unwrap defensively so a shape change doesn't turn into a broken redirect.
  type RpcRow = { application_id: string; chat_id: string | null };
  const row: RpcRow | null = Array.isArray(data)
    ? ((data[0] ?? null) as RpcRow | null)
    : ((data as RpcRow | null) ?? null);
  const chatId = row?.chat_id ?? null;
  const applicationId = row?.application_id ?? null;

  // Fan out email to hiring tenant members. Uses service-role client
  // because we need to read tenant_members regardless of the caller.
  if (applicationId) {
    const admin = createAdminClient();
    const { data: app } = await admin
      .from("applications")
      .select("tenant_id, listings!inner(title)")
      .eq("id", applicationId)
      .maybeSingle();
    if (app) {
      const { data: recipients } = await admin
        .from("tenant_members")
        .select("user_id")
        .eq("tenant_id", (app as { tenant_id: string }).tenant_id)
        .eq("status", "active")
        .in("role", [
          "client_admin",
          "client_member",
          "agency_admin",
          "agency_member",
        ]);
      const { data: candRow } = await admin
        .from("users")
        .select("first_name, last_name, email")
        .eq("id", user.id)
        .maybeSingle();
      const candName =
        (candRow?.first_name || candRow?.last_name
          ? `${candRow?.first_name ?? ""} ${candRow?.last_name ?? ""}`.trim()
          : candRow?.email) || "A candidate";
      const listingsField = (
        app as unknown as {
          listings: { title: string } | { title: string }[];
        }
      ).listings;
      const listingTitle = Array.isArray(listingsField)
        ? listingsField[0]?.title
        : listingsField?.title;
      const preview =
        message ??
        "New application on RemoteRep. Reply to start the conversation.";

      await Promise.all(
        (recipients ?? []).map((r) =>
          sendNotificationEmail({
            userId: (r as { user_id: string }).user_id,
            kind: "talent_application",
            subject: `${candName} applied to ${listingTitle}`,
            headline: `${candName} applied`,
            intro: preview,
            ctaLabel: "Open chat",
            ctaPath: chatId ? `/chats/${chatId}` : "/dashboard",
          }),
        ),
      );
    }
  }

  // Defensive: only redirect into the chat if we have a real chat id.
  // Otherwise send them to their chats index — better than dead-ending
  // on /chats/undefined and 404ing.
  if (chatId) {
    redirect(`/chats/${chatId}`);
  }
  if (applicationId) {
    redirect("/chats?applied=1");
  }
  redirect(`/listings/${listingId}?applied=1`);
}
