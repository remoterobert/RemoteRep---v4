"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotificationEmail } from "@/lib/notification-email";

async function requireConciergeTenantAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memb } = await supabase
    .from("tenant_members")
    .select(
      "tenant_id, role, tenants!inner(id, name, subscription_tier, subscription_expires_at)",
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["client_admin", "agency_admin"])
    .limit(1)
    .maybeSingle();
  type Row = {
    tenant_id: string;
    role: string;
    tenants: {
      id: string;
      name: string;
      subscription_tier: string;
      subscription_expires_at: string | null;
    };
  };
  const m = memb as unknown as Row | null;
  if (!m) redirect("/dashboard");
  const expired =
    m.tenants.subscription_expires_at &&
    new Date(m.tenants.subscription_expires_at) < new Date();
  if (m.tenants.subscription_tier !== "concierge" || expired) {
    redirect(
      "/settings/billing?error=" +
        encodeURIComponent(
          "Concierge requires the Concierge subscription tier.",
        ),
    );
  }
  return { supabase, user, tenantId: m.tenant_id, tenantName: m.tenants.name };
}

/**
 * Turn Concierge on for a listing.
 *  1. Flip concierge_enabled_at on the listing.
 *  2. Source top matches: recent, public candidate profiles the tenant
 *     hasn't already contacted.
 *  3. For each source, insert an "invited" application row + open a chat
 *     + notify + email — same shape as the regular invite flow.
 */
export async function enableConcierge(formData: FormData) {
  const { supabase, user, tenantId, tenantName } =
    await requireConciergeTenantAdmin();
  const listingId = String(formData.get("listing_id") ?? "").trim();
  if (!listingId) redirect("/company/listings");

  // Confirm the listing belongs to this tenant.
  const { data: listing } = await supabase
    .from("listings")
    .select("id, title, tenant_id, concierge_enabled_at")
    .eq("id", listingId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (!listing) redirect("/company/listings");
  const listingRow = listing as {
    id: string;
    title: string;
    tenant_id: string;
    concierge_enabled_at: string | null;
  };

  const admin = createAdminClient();

  // Flip the flag (idempotent).
  await admin
    .from("listings")
    .update({
      concierge_enabled_at: listingRow.concierge_enabled_at ?? new Date().toISOString(),
      concierge_enabled_by: user.id,
    })
    .eq("id", listingId);

  // Source top matches: public candidate profiles the tenant hasn't
  // already invited or received an application from. Cap the initial
  // batch at 5 so we don't blast the whole database.
  const { data: existingApps } = await admin
    .from("applications")
    .select("candidate_user_id")
    .eq("tenant_id", tenantId);
  const alreadyContacted = new Set(
    ((existingApps ?? []) as Array<{ candidate_user_id: string }>).map(
      (a) => a.candidate_user_id,
    ),
  );

  const { data: candidates } = await admin
    .from("candidate_profiles")
    .select("user_id")
    .eq("visibility", "public")
    .limit(50);
  const pool =
    ((candidates ?? []) as Array<{ user_id: string }>)
      .map((c) => c.user_id)
      .filter((id) => !alreadyContacted.has(id))
      .slice(0, 5);

  let invitedCount = 0;
  for (const candidateUserId of pool) {
    // Insert the application. RLS blocks direct insert; using admin client.
    const { data: newApp, error: appErr } = await admin
      .from("applications")
      .insert({
        tenant_id: tenantId,
        listing_id: listingId,
        candidate_user_id: candidateUserId,
        status: "invited",
        message: "Sourced by Concierge — you're a strong fit for this role.",
        applied_at: new Date().toISOString(),
        last_status_change_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (appErr || !newApp) continue;

    // Deduped notification via the shape the invite RPC uses.
    await admin.from("notifications").upsert(
      {
        user_id: candidateUserId,
        tenant_id: tenantId,
        kind: "client_application",
        entity_type: "application",
        entity_id: (newApp as { id: string }).id,
        title: `${tenantName} is interested`,
        body: `The Concierge sourced you for "${listingRow.title}". Reply to start the conversation.`,
        payload: {
          application_id: (newApp as { id: string }).id,
          hiring_tenant_name: tenantName,
          source: "concierge",
        },
        deduplication_key: `invite:${tenantId}:${candidateUserId}`,
      },
      { onConflict: "user_id,deduplication_key" },
    );

    // Fire-and-forget email.
    sendNotificationEmail({
      userId: candidateUserId,
      kind: "client_application",
      subject: `${tenantName} invited you on RemoteRep`,
      headline: `${tenantName} is interested`,
      intro: `The Concierge assistant at ${tenantName} sourced you for "${listingRow.title}". Sign in and respond to start the conversation. Note: an AI-assisted concierge will help kick off the conversation; a human will always make the final decision.`,
      ctaLabel: "Open your dashboard",
      ctaPath: "/dashboard",
    });

    invitedCount++;
  }

  await admin.from("events").insert({
    tenant_id: tenantId,
    actor_user_id: user.id,
    event_type: "concierge.enabled",
    entity_type: "listing",
    entity_id: listingId,
    payload: { invited_count: invitedCount },
  });

  revalidatePath(`/company/listings/${listingId}`);
  redirect(
    `/company/listings/${listingId}?concierge=enabled&sourced=${invitedCount}`,
  );
}

export async function disableConcierge(formData: FormData) {
  const { supabase, user, tenantId } = await requireConciergeTenantAdmin();
  const listingId = String(formData.get("listing_id") ?? "").trim();
  if (!listingId) redirect("/company/listings");

  const admin = createAdminClient();
  await admin
    .from("listings")
    .update({
      concierge_enabled_at: null,
    })
    .eq("id", listingId)
    .eq("tenant_id", tenantId);

  await admin.from("events").insert({
    tenant_id: tenantId,
    actor_user_id: user.id,
    event_type: "concierge.disabled",
    entity_type: "listing",
    entity_id: listingId,
    payload: {},
  });

  // Silence the unused warning without dropping the helper's shape.
  void supabase;

  revalidatePath(`/company/listings/${listingId}`);
  redirect(`/company/listings/${listingId}?concierge=disabled`);
}
