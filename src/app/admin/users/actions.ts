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
 * Update editable user fields — tags, notes, access_level, admin
 * role. Called by the Edit User modal.
 */
export async function updateUserFields(formData: FormData) {
  await safelyRun(async () => {
    const { user: admin } = await requireAdmin();
    const targetUserId = String(formData.get("target_user_id") ?? "").trim();
    if (!targetUserId) redirect("/admin/users?error=missing-target");

    const notes = String(formData.get("notes") ?? "").trim();
    const tagsRaw = String(formData.get("tags") ?? "").trim();
    const tags = tagsRaw
      ? tagsRaw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    const accessLevel = String(formData.get("access_level") ?? "free").trim();
    const referenceSource = String(
      formData.get("reference_source") ?? "",
    ).trim();
    const makeAdmin = formData.get("make_admin") === "1";

    const adminClient = createAdminClient();

    const { error: updErr } = await adminClient
      .from("users")
      .update({
        tags: tags.length ? tags : null,
        notes: notes || null,
        access_level: accessLevel,
        reference_source: referenceSource || null,
      })
      .eq("id", targetUserId);
    if (updErr) throw new Error(`Update failed: ${updErr.message}`);

    // Admin role toggle: platform_admin is stored via tenant_members.
    // For MVP the admin role lives on the target's *first* tenant
    // membership. If the user has no tenant, we skip the toggle silently.
    const { data: firstMembership } = await adminClient
      .from("tenant_members")
      .select("id, tenant_id, role")
      .eq("user_id", targetUserId)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (firstMembership) {
      const desiredRole = makeAdmin ? "platform_admin" : firstMembership.role;
      if (
        makeAdmin &&
        firstMembership.role !== "platform_admin"
      ) {
        await adminClient
          .from("tenant_members")
          .update({ role: "platform_admin" })
          .eq("id", firstMembership.id);
      } else if (
        !makeAdmin &&
        firstMembership.role === "platform_admin"
      ) {
        // Downgrade — pick a sensible non-admin role based on tenant type.
        const { data: tenant } = await adminClient
          .from("tenants")
          .select("type")
          .eq("id", firstMembership.tenant_id)
          .maybeSingle();
        const fallback =
          tenant?.type === "client_company" || tenant?.type === "agency"
            ? "client_member"
            : "candidate";
        await adminClient
          .from("tenant_members")
          .update({ role: fallback })
          .eq("id", firstMembership.id);
      }
      // Log the role change.
      await adminClient.from("audit_log").insert({
        actor_user_id: admin.id,
        action: "user_role_changed",
        target_type: "user",
        target_id: targetUserId,
        metadata: {
          previous_role: firstMembership.role,
          new_role: desiredRole,
        },
      });
    }

    await adminClient.from("audit_log").insert({
      actor_user_id: admin.id,
      action: "user_fields_updated",
      target_type: "user",
      target_id: targetUserId,
      metadata: {
        fields: ["tags", "notes", "access_level", "reference_source"],
      },
    });

    redirect("/admin/users?ok=updated");
  });
}

/**
 * Toggle access_level = 'comp' for a non-paying user. Admin-granted
 * premium access for testing / VIP treatment.
 */
export async function toggleComp(formData: FormData) {
  await safelyRun(async () => {
    const { user: admin } = await requireAdmin();
    const targetUserId = String(formData.get("target_user_id") ?? "").trim();
    if (!targetUserId) redirect("/admin/users?error=missing-target");

    const adminClient = createAdminClient();
    const { data: current } = await adminClient
      .from("users")
      .select("access_level")
      .eq("id", targetUserId)
      .maybeSingle();

    const nextLevel = current?.access_level === "comp" ? "free" : "comp";

    const { error } = await adminClient
      .from("users")
      .update({ access_level: nextLevel })
      .eq("id", targetUserId);
    if (error) throw new Error(error.message);

    await adminClient.from("audit_log").insert({
      actor_user_id: admin.id,
      action: nextLevel === "comp" ? "premium_granted" : "premium_revoked",
      target_type: "user",
      target_id: targetUserId,
      metadata: { access_level: nextLevel },
    });

    redirect("/admin/users?ok=access-updated");
  });
}

/**
 * Soft-archive (or unarchive) a user account.
 */
export async function toggleArchive(formData: FormData) {
  await safelyRun(async () => {
    const { user: admin } = await requireAdmin();
    const targetUserId = String(formData.get("target_user_id") ?? "").trim();
    if (!targetUserId) redirect("/admin/users?error=missing-target");

    const adminClient = createAdminClient();
    const { data: current } = await adminClient
      .from("users")
      .select("archived_at")
      .eq("id", targetUserId)
      .maybeSingle();

    const nextValue = current?.archived_at ? null : new Date().toISOString();

    const { error } = await adminClient
      .from("users")
      .update({ archived_at: nextValue })
      .eq("id", targetUserId);
    if (error) throw new Error(error.message);

    await adminClient.from("audit_log").insert({
      actor_user_id: admin.id,
      action: nextValue ? "user_archived" : "user_unarchived",
      target_type: "user",
      target_id: targetUserId,
      metadata: {},
    });

    redirect(
      `/admin/users?ok=${nextValue ? "archived" : "unarchived"}`,
    );
  });
}

/**
 * Permanently delete a user account and all associated data. Uses the
 * admin auth API so both auth.users and public.users are removed;
 * child rows cascade via FK.
 */
export async function deleteUserPermanently(formData: FormData) {
  await safelyRun(async () => {
    const { user: admin } = await requireAdmin();
    const targetUserId = String(formData.get("target_user_id") ?? "").trim();
    const confirmText = String(formData.get("confirm") ?? "").trim();
    if (!targetUserId) redirect("/admin/users?error=missing-target");
    if (confirmText !== "DELETE") {
      redirect(
        `/admin/users?error=${encodeURIComponent("Type DELETE to confirm.")}`,
      );
    }

    if (targetUserId === admin.id) {
      redirect(
        `/admin/users?error=${encodeURIComponent("Cannot delete yourself.")}`,
      );
    }

    const adminClient = createAdminClient();

    // Snapshot for audit before deletion.
    const { data: target } = await adminClient
      .from("users")
      .select("id, email, first_name, last_name")
      .eq("id", targetUserId)
      .maybeSingle();

    // Delete from Supabase Auth — this cascades to public.users via
    // the ON DELETE CASCADE FK on public.users.id → auth.users.id.
    const { error: authErr } =
      await adminClient.auth.admin.deleteUser(targetUserId);
    if (authErr) throw new Error(`Auth delete failed: ${authErr.message}`);

    await adminClient.from("audit_log").insert({
      actor_user_id: admin.id,
      action: "user_deleted",
      target_type: "user",
      target_id: targetUserId,
      metadata: {
        deleted_email: target?.email ?? null,
        deleted_name:
          target?.first_name || target?.last_name
            ? `${target?.first_name ?? ""} ${target?.last_name ?? ""}`.trim()
            : null,
      },
    });

    redirect("/admin/users?ok=deleted");
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
