"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Toggle a bookmark on a listing for the current signed-in user.
 * Uses the real listings.id (UUID).
 */
export async function toggleOpportunityBookmark(formData: FormData) {
  const listingId = String(formData.get("opportunity_id") ?? "").trim();
  if (!listingId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("owner_user_id", user.id)
    .eq("target_type", "listing")
    .eq("target_id", listingId)
    .maybeSingle();

  if (existing) {
    await supabase.from("bookmarks").delete().eq("id", existing.id);
  } else {
    await supabase.from("bookmarks").insert({
      owner_user_id: user.id,
      target_type: "listing",
      target_id: listingId,
    });
  }

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${listingId}`);
}
