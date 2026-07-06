"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotificationEmail } from "@/lib/notification-email";

export async function respondToInvitation(formData: FormData) {
  const applicationId = String(formData.get("application_id") ?? "").trim();
  const response = String(formData.get("response") ?? "").trim();

  if (!applicationId || !["interested", "not_interested"].includes(response)) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("respond_to_invitation", {
    p_application_id: applicationId,
    p_response: response,
  });

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  // The RPC already wrote in-app notifications for the hiring tenant's
  // members. Email them too — service-role client so we can read
  // tenant_members without RLS blocking us.
  const admin = createAdminClient();
  const { data: app } = await admin
    .from("applications")
    .select("tenant_id, tenants!inner(name)")
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
    const heading =
      response === "interested"
        ? `${candName} is interested`
        : `${candName} passed`;
    const intro =
      response === "interested"
        ? `${candName} accepted your invitation. Reach out on RemoteRep to schedule a call.`
        : `${candName} declined for now.`;

    await Promise.all(
      (recipients ?? []).map((r) =>
        sendNotificationEmail({
          userId: (r as { user_id: string }).user_id,
          kind: "talent_application",
          subject: heading,
          headline: heading,
          intro,
          ctaLabel: "Open your dashboard",
          ctaPath: "/dashboard",
        }),
      ),
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/candidates");
}

/**
 * Kanban stage move. Fires from client-side drag-end handler with the
 * application id and new status. Wraps the update_application_status
 * SECURITY DEFINER RPC.
 */
export type KanbanStatus =
  | "invited"
  | "applied"
  | "interviewing"
  | "shortlisted"
  | "hired"
  | "rejected"
  | "withdrawn";

const KANBAN_STATUSES: KanbanStatus[] = [
  "invited",
  "applied",
  "interviewing",
  "shortlisted",
  "hired",
  "rejected",
  "withdrawn",
];

export async function moveApplication(
  applicationId: string,
  newStatus: KanbanStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!applicationId) return { ok: false, error: "Missing application id" };
  if (!KANBAN_STATUSES.includes(newStatus)) {
    return { ok: false, error: `Invalid status: ${newStatus}` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { error } = await supabase.rpc("update_application_status", {
    p_application_id: applicationId,
    p_new_status: newStatus,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Client dragged a bookmarked candidate onto Invited. Fires an invitation
 * (creating the application row via invite_candidate RPC), then removes
 * the bookmark so the card doesn't appear in two places.
 */
export async function convertBookmarkToInvite(
  candidateUserId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!candidateUserId) return { ok: false, error: "Missing candidate id" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { error: inviteErr } = await supabase.rpc("invite_candidate", {
    p_candidate_user_id: candidateUserId,
    p_message: null,
  });
  if (inviteErr) return { ok: false, error: inviteErr.message };

  // Remove the bookmark. Non-fatal if it fails.
  await supabase
    .from("bookmarks")
    .delete()
    .eq("owner_user_id", user.id)
    .eq("target_type", "candidate")
    .eq("target_id", candidateUserId);

  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Rep dragged a bookmarked listing onto Applied. Applies via apply_to_listing
 * (which creates the app + chat + notification), then removes the bookmark.
 */
export async function convertBookmarkToApply(
  listingId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!listingId) return { ok: false, error: "Missing listing id" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { error: applyErr } = await supabase.rpc("apply_to_listing", {
    p_listing_id: listingId,
    p_message: null,
  });
  if (applyErr) return { ok: false, error: applyErr.message };

  await supabase
    .from("bookmarks")
    .delete()
    .eq("owner_user_id", user.id)
    .eq("target_type", "listing")
    .eq("target_id", listingId);

  revalidatePath("/dashboard");
  return { ok: true };
}
