"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function markAllNotificationsSeen() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("notifications")
    .update({ seen_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("seen_at", null);

  revalidatePath("/notifications");
  revalidatePath("/", "layout"); // refresh bell badge
}

export async function markNotificationSeen(formData: FormData) {
  const id = String(formData.get("notification_id") ?? "").trim();
  const href = String(formData.get("href") ?? "/notifications").trim();
  if (!id) redirect(href);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("notifications")
    .update({ seen_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  redirect(href);
}
