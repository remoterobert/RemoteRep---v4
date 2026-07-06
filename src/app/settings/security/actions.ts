"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function getStr(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

// ============================================================
// Password
// ============================================================

export async function changePassword(formData: FormData) {
  const currentPassword = getStr(formData, "current_password");
  const newPassword = getStr(formData, "new_password");
  const confirmPassword = getStr(formData, "confirm_password");

  const errors: string[] = [];
  if (!currentPassword) errors.push("Current password required.");
  if (newPassword.length < 8) errors.push("New password must be 8+ characters.");
  if (newPassword !== confirmPassword)
    errors.push("New password and confirmation don't match.");
  if (errors.length) {
    redirect(
      `/settings/security?error=${encodeURIComponent(errors.join(" "))}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");

  // Verify the current password by re-signing-in. Prevents a stolen
  // session from silently rotating the password.
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (signInErr) {
    redirect(
      `/settings/security?error=${encodeURIComponent("Current password didn't match.")}`,
    );
  }

  const { error: updateErr } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (updateErr) {
    redirect(
      `/settings/security?error=${encodeURIComponent(updateErr.message)}`,
    );
  }

  redirect("/settings/security?saved=password");
}

// ============================================================
// Sessions
// ============================================================

/**
 * Revoke every session for this user EXCEPT the one making the request.
 * Useful if you suspect your account may have been used on a device you
 * no longer control.
 */
export async function signOutOtherSessions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.auth.signOut({ scope: "others" });
  if (error) {
    redirect(
      `/settings/security?error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect("/settings/security?saved=sessions");
}

// ============================================================
// Deactivate / reactivate account
// ============================================================

/**
 * Soft-pause: marks the user archived and flips their public profile
 * to hidden so they stop appearing in browse. Reversible from the same
 * page. Preserves chats, applications, and every historical row.
 */
export async function deactivateAccount() {
  const admin = createAdminClient();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Refuse for super admins — protects business-owner accounts from
  // accidental self-pause.
  const { data: userRow } = await admin
    .from("users")
    .select("is_super_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (userRow?.is_super_admin) {
    redirect(
      `/settings/security?error=${encodeURIComponent("Super Admin accounts can't be deactivated from the UI.")}`,
    );
  }

  await admin
    .from("users")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", user.id);

  await admin
    .from("candidate_profiles")
    .update({ visibility: "hidden" })
    .eq("user_id", user.id);

  await admin
    .from("client_profiles")
    .update({ visibility: "hidden" })
    .in(
      "tenant_id",
      (
        await admin
          .from("tenant_members")
          .select("tenant_id")
          .eq("user_id", user.id)
          .in("role", ["client_admin", "agency_admin"])
      ).data?.map((r) => (r as { tenant_id: string }).tenant_id) ?? [],
    );

  revalidatePath("/settings/security");
  revalidatePath("/dashboard");
  redirect("/settings/security?saved=deactivated");
}

export async function reactivateAccount() {
  const admin = createAdminClient();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await admin.from("users").update({ archived_at: null }).eq("id", user.id);

  // We don't auto-flip visibility back to public — the user might have
  // intentionally been hidden before. They can re-enable it from their
  // profile if they want to be findable again.

  revalidatePath("/settings/security");
  revalidatePath("/dashboard");
  redirect("/settings/security?saved=reactivated");
}

// ============================================================
// Permanent delete
// ============================================================

/**
 * Nuke the auth.users row via the admin API. FK cascade removes
 * public.users, candidate_profiles, chats participation, applications,
 * etc. Irreversible. Requires the user to type DELETE.
 */
export async function deleteAccount(formData: FormData) {
  const confirmText = getStr(formData, "confirm");
  if (confirmText !== "DELETE") {
    redirect(
      `/settings/security?error=${encodeURIComponent("Type DELETE to confirm.")}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: userRow } = await admin
    .from("users")
    .select("is_super_admin, email")
    .eq("id", user.id)
    .maybeSingle();
  if (userRow?.is_super_admin) {
    redirect(
      `/settings/security?error=${encodeURIComponent("Super Admin accounts can't be deleted from the UI.")}`,
    );
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    redirect(
      `/settings/security?error=${encodeURIComponent(error.message)}`,
    );
  }

  // Clear the caller's session (their user is now gone) and land them
  // on the goodbye page.
  await supabase.auth.signOut();
  redirect("/?deleted=1");
}
