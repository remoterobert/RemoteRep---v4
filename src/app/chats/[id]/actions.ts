"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function sendMessage(formData: FormData) {
  const chatId = String(formData.get("chat_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!chatId || !body) return;
  if (body.length > 5000) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("messages").insert({
    chat_id: chatId,
    author_user_id: user.id,
    body,
  });

  if (error) {
    redirect(`/chats/${chatId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/chats/${chatId}`);
  revalidatePath("/chats");
}
