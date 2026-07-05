"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendNotificationEmail } from "@/lib/notification-email";

export async function inviteCandidate(formData: FormData) {
  const candidateUserId = String(formData.get("candidate_user_id") ?? "").trim();
  if (!candidateUserId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("invite_candidate", {
    p_candidate_user_id: candidateUserId,
    p_message: null,
  });

  if (error) {
    // Bubble up via query param — page can render alert
    redirect(`/candidates?error=${encodeURIComponent(error.message)}`);
  }

  // The RPC already wrote the in-app notification. Send the email
  // in parallel — fire-and-forget so failures don't block the redirect.
  const { data: memb } = await supabase
    .from("tenant_members")
    .select("tenants!inner(name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["client_admin", "client_member", "agency_admin", "agency_member"])
    .limit(1)
    .maybeSingle();
  const tenantName =
    (memb as unknown as { tenants: { name: string } } | null)?.tenants.name ??
    "A hiring company";

  await sendNotificationEmail({
    userId: candidateUserId,
    kind: "client_application",
    subject: `${tenantName} invited you on RemoteRep`,
    headline: `${tenantName} is interested`,
    intro: `${tenantName} sent you a direct invitation on RemoteRep. Sign in and respond to start the conversation.`,
    ctaLabel: "Open your dashboard",
    ctaPath: "/dashboard",
  });

  revalidatePath("/candidates");
  revalidatePath("/dashboard");
}
