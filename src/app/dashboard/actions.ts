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
