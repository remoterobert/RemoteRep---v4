"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const KINDS = [
  "chat",
  "talent_application",
  "client_application",
  "listing_update",
  "system",
] as const;
const CHANNELS = ["in_app_enabled", "email_enabled", "push_enabled"] as const;

export async function updateNotificationChannels(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const rows = KINDS.map((kind) => {
    const row: {
      user_id: string;
      kind: string;
      in_app_enabled: boolean;
      email_enabled: boolean;
      push_enabled: boolean;
    } = {
      user_id: user.id,
      kind,
      in_app_enabled: true,
      email_enabled: true,
      push_enabled: true,
    };
    for (const ch of CHANNELS) {
      row[ch] = formData.get(`${kind}:${ch}`) === "1";
    }
    return row;
  });

  const { error } = await supabase
    .from("notification_channels")
    .upsert(rows, { onConflict: "user_id,kind" });

  if (error) {
    redirect(
      `/settings/notifications?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/settings/notifications");
  redirect("/settings/notifications?saved=1");
}
