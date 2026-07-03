"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  revalidatePath("/candidates");
  revalidatePath("/dashboard");
}
