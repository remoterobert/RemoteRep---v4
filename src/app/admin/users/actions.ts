"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
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
 * Wrapper: run an action, catch any non-redirect throw, and redirect
 * to the admin users page with the error message as a param instead
 * of surfacing a raw 500 to the user.
 */
async function safelyRun(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    if (isRedirectError(err)) throw err;
    const message =
      err instanceof Error ? err.message : "Unknown error";
    console.error("[admin action error]", err);
    redirect(
      `/admin/users?error=${encodeURIComponent(message.slice(0, 200))}`,
    );
  }
}

/**
 * Begin impersonating another user. Only platform admins allowed;
 * cannot impersonate other platform admins; cannot start a new
 * impersonation while already impersonating (must exit first).
 */
export async function impersonateUser(formData: FormData) {
  await safelyRun(async () => {
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

    const { data: target, error: lookupErr } = await adminClient
      .from("users")
      .select("id, email")
      .eq("id", targetUserId)
      .maybeSingle();
    if (lookupErr) {
      throw new Error(`Target lookup failed: ${lookupErr.message}`);
    }
    if (!target || !target.email) {
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

    // Audit — start.
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
    if (linkErr) {
      throw new Error(`Link generation failed: ${linkErr.message}`);
    }
    const token_hash = linkData?.properties?.hashed_token;
    if (!token_hash) {
      throw new Error("Link generation returned no token_hash");
    }

    // Marker cookie BEFORE flipping session so AppShell renders the
    // banner on the next request.
    await writeImpersonationMarker({
      original_user_id: admin.id,
      original_email: admin.email ?? "",
      target_user_id: target.id,
      target_email: target.email ?? "",
      started_at: new Date().toISOString(),
    });

    // Flip current server client's session to the target user.
    const supabase = await createClient();
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash,
    });
    if (verifyErr) {
      await clearImpersonationMarker();
      throw new Error(`Session verify failed: ${verifyErr.message}`);
    }

    redirect("/dashboard");
  });
}

/**
 * End impersonation and return to the original admin account.
 */
export async function stopImpersonation() {
  await safelyRun(async () => {
    const marker = await readImpersonationMarker();
    if (!marker) {
      redirect("/dashboard");
    }

    const adminClient = createAdminClient();

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

    const { data: linkData, error: linkErr } =
      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: marker.original_email,
      });
    if (linkErr) {
      await clearImpersonationMarker();
      throw new Error(`Return-link generation failed: ${linkErr.message}`);
    }
    const token_hash = linkData?.properties?.hashed_token;
    if (!token_hash) {
      await clearImpersonationMarker();
      throw new Error("Return-link generation returned no token_hash");
    }

    const supabase = await createClient();
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash,
    });

    await clearImpersonationMarker();

    if (verifyErr) {
      redirect("/login");
    }
    redirect("/admin");
  });
}

/**
 * Send a password-reset email to the target user. Uses the admin API
 * so the admin doesn't have to know the user's email password.
 */
export async function sendPasswordReset(formData: FormData) {
  await safelyRun(async () => {
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
    if (!target || !target.email) {
      redirect("/admin/users?error=target-not-found");
    }

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
  });
}
