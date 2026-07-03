"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  revalidatePath("/dashboard");
  revalidatePath("/candidates");
}
