"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPlatformAdmin } from "@/lib/is-platform-admin";
import {
  readImpersonationMarker,
  writeImpersonationMarker,
  clearImpersonationMarker,
} from "@/lib/impersonation";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  const admin = await isPlatformAdmin();
  if (!admin) {
    redirect("/dashboard");
  }
  return { user, supabase };
}

/**
 * Begin impersonating another user. Only platform admins allowed;
 * cannot impersonate other platform admins; cannot start a new
 * impersonation while already impersonating (must exit first).
 *
 * Mechanism: uses the service-role API to generate a magic-link
 * `hashed_token` for the target user, then verifies it on the
 * current server client. That flips the auth session cookie to the
 * target. A marker cookie records the admin's identity so we can
 * unwind cleanly via stopImpersonation().
 */
export async function impersonateUser(formData: FormData) {
  const { user: admin } = await requireAdmin();

  const targetUserId = String(formData.get("target_user_id") ?? "").trim();
  if (!targetUserId) {
    redirect("/admin/users?error=missing-target");
  }
  if (targetUserId === admin.id) {
    redirect("/admin/users?error=self");
  }

  const existing = await readImpersonationMarker();
  if (existing) {
    redirect(
      `/admin/users?error=${encodeURIComponent("Already impersonating — exit first.")}`,
    );
  }

  const adminClient = createAdminClient();

  // Look up target's email (with admin API so RLS doesn't hide anyone).
  const { data: target, error: lookupErr } = await adminClient
    .from("users")
    .select("id, email")
    .eq("id", targetUserId)
    .maybeSingle();
  if (lookupErr || !target) {
    redirect(`/admin/users?error=target-not-found`);
  }

  // Guardrail: can't impersonate other platform admins.
  const { data: targetAdmin } = await adminClient
    .from("tenant_members")
    .select("id")
    .eq("user_id", targetUserId)
    .eq("role", "platform_admin")
    .eq("status", "active")
    .maybeSingle();
  if (targetAdmin) {
    redirect(
      `/admin/users?error=${encodeURIComponent("Cannot impersonate another platform admin.")}`,
    );
  }

  // Audit log — start.
  await adminClient.from("audit_log").insert({
    actor_user_id: admin.id,
    action: "impersonate_start",
    target_type: "user",
    target_id: targetUserId,
    metadata: {
      admin_email: admin.email ?? null,
      target_email: target.email ?? null,
    },
  });

  // Generate a magic-link hashed_token we can consume server-side.
  const { data: linkData, error: linkErr } =
    await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: target.email,
    });
  if (linkErr || !linkData?.properties?.hashed_token) {
    redirect(
      `/admin/users?error=${encodeURIComponent("Could not generate impersonation link.")}`,
    );
  }

  // Set the marker BEFORE flipping the session so the AppShell banner
  // renders next request. Include enough info to unwind.
  await writeImpersonationMarker({
    original_user_id: admin.id,
    original_email: admin.email ?? "",
    target_user_id: target.id,
    target_email: target.email ?? "",
    started_at: new Date().toISOString(),
  });

  // Flip the current server client's session to the target user by
  // verifying the OTP. This sets the auth cookies for us.
  const supabase = await createClient();
  const { error: verifyErr } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: linkData.properties.hashed_token,
  });
  if (verifyErr) {
    await clearImpersonationMarker();
    redirect(
      `/admin/users?error=${encodeURIComponent("Failed to establish impersonation session: " + verifyErr.message)}`,
    );
  }

  redirect("/dashboard");
}

/**
 * End impersonation and return to the original admin account.
 */
export async function stopImpersonation() {
  const marker = await readImpersonationMarker();
  if (!marker) {
    redirect("/dashboard");
  }

  const adminClient = createAdminClient();

  // Audit log — end.
  await adminClient.from("audit_log").insert({
    actor_user_id: marker.original_user_id,
    action: "impersonate_end",
    target_type: "user",
    target_id: marker.target_user_id,
    metadata: {
      admin_email: marker.original_email,
      target_email: marker.target_email,
      duration_seconds: Math.round(
        (Date.now() - new Date(marker.started_at).getTime()) / 1000,
      ),
    },
  });

  // Re-generate a magic link for the admin to unwind the session.
  const { data: linkData, error: linkErr } =
    await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: marker.original_email,
    });
  if (linkErr || !linkData?.properties?.hashed_token) {
    await clearImpersonationMarker();
    redirect(
      `/admin/users?error=${encodeURIComponent("Failed to restore admin session — please log in again.")}`,
    );
  }

  const supabase = await createClient();
  const { error: verifyErr } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: linkData.properties.hashed_token,
  });

  await clearImpersonationMarker();

  if (verifyErr) {
    redirect("/login");
  }
  redirect("/admin/users");
}

/**
 * Send a password-reset email to the target user. Uses the admin API
 * so the admin doesn't have to know the user's email password.
 */
export async function sendPasswordReset(formData: FormData) {
  const { user: admin } = await requireAdmin();

  const targetUserId = String(formData.get("target_user_id") ?? "").trim();
  if (!targetUserId) {
    redirect("/admin/users?error=missing-target");
  }

  const adminClient = createAdminClient();
  const { data: target } = await adminClient
    .from("users")
    .select("id, email")
    .eq("id", targetUserId)
    .maybeSingle();
  if (!target) {
    redirect("/admin/users?error=target-not-found");
  }

  // Supabase Admin: generate a recovery link. Supabase Auth will email
  // it automatically if email delivery is configured; either way the
  // link is emailed via project's SMTP + recovery template.
  const { error } = await adminClient.auth.admin.generateLink({
    type: "recovery",
    email: target.email,
  });

  await adminClient.from("audit_log").insert({
    actor_user_id: admin.id,
    action: "password_reset_sent",
    target_type: "user",
    target_id: targetUserId,
    metadata: {
      target_email: target.email,
      error: error?.message ?? null,
    },
  });

  if (error) {
    redirect(
      `/admin/users?error=${encodeURIComponent("Password reset failed: " + error.message)}`,
    );
  }
  redirect("/admin/users?ok=reset-sent");
}
