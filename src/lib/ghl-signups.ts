import { createAdminClient } from "@/lib/supabase/admin";
import { logGhl, syncLead, type GhlLead } from "@/lib/ghl";

/**
 * Push a newly onboarded user into GoHighLevel and remember the GHL ids in
 * `ghl_user_state`. Called from onboarding via `after()`, so it runs once the
 * user's response has been sent and never slows or breaks signup.
 */
export async function syncSignupToGhl(
  userId: string,
  lead: Omit<GhlLead, "source"> & { type: "rep" | "client" },
) {
  const result = await syncLead({ ...lead, source: "RemoteRep website — signup" });
  logGhl(`${lead.type}-signup`, result);
  if (result.status === "skipped" || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  try {
    const { error } = await createAdminClient()
      .from("ghl_user_state")
      .upsert(
        {
          user_id: userId,
          pipeline: lead.type === "rep" ? "talent" : "client",
          contact_id: result.status === "synced" ? result.contactId : null,
          opportunity_id: result.status === "synced" ? result.opportunityId : null,
          tags: lead.tags,
          last_synced_at: new Date().toISOString(),
          sync_error:
            result.status === "failed"
              ? result.error
              : result.warnings.length
                ? result.warnings.join("; ")
                : null,
        },
        { onConflict: "user_id,pipeline" },
      );
    if (error) console.error("[ghl] could not record sync state:", error.message);
  } catch (e) {
    console.error("[ghl] could not record sync state:", e);
  }
}
