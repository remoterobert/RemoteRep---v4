"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { pseudoUuidFromString } from "@/lib/pseudo-uuid";

/**
 * Toggle a bookmark on an opportunity for the current user.
 * MVP: opportunity IDs are string literals from sample-opportunities.ts,
 * so we store them with target_type='listing' and stringify the id
 * into target_id (which is a uuid column). Since sample IDs aren't
 * valid uuids yet, we use a deterministic hash for now.
 *
 * When real listings ship, target_id becomes the real listings.id.
 */
export async function toggleOpportunityBookmark(formData: FormData) {
  const opportunityId = String(formData.get("opportunity_id") ?? "").trim();
  if (!opportunityId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Stable UUID derived from the sample opportunity id so bookmark rows
  // survive across page loads.
  const targetUuid = pseudoUuidFromString(opportunityId);

  // Check if bookmark already exists
  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("owner_user_id", user.id)
    .eq("target_type", "listing")
    .eq("target_id", targetUuid)
    .maybeSingle();

  if (existing) {
    await supabase.from("bookmarks").delete().eq("id", existing.id);
  } else {
    await supabase.from("bookmarks").insert({
      owner_user_id: user.id,
      target_type: "listing",
      target_id: targetUuid,
      note: `sample:${opportunityId}`,
    });
  }

  revalidatePath("/opportunities");
}

