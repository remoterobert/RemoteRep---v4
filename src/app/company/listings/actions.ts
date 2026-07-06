"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Shared: resolve the hiring tenant this user administers or belongs to.
// Returns null if the user has no hiring-role membership.
async function getHiringTenantId(): Promise<{
  tenantId: string;
  userId: string;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", [
      "client_admin",
      "client_member",
      "agency_admin",
      "agency_member",
    ])
    .limit(1)
    .maybeSingle();

  if (!membership) return null;
  return { tenantId: membership.tenant_id, userId: user.id };
}

function getMulti(fd: FormData, name: string): string[] {
  return fd.getAll(name).map(String).filter(Boolean);
}

function getStr(fd: FormData, name: string): string {
  return String(fd.get(name) ?? "").trim();
}

function getNumOrNull(fd: FormData, name: string): number | null {
  const raw = getStr(fd, name);
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export async function createListing(formData: FormData) {
  const ctx = await getHiringTenantId();
  if (!ctx) redirect("/dashboard");

  const supabase = await createClient();

  const title = getStr(formData, "title");
  const description = getStr(formData, "description");
  const instructions = getStr(formData, "instructions");
  const calendar_link = getStr(formData, "calendar_link");
  const publish = getStr(formData, "publish") === "1";

  if (title.length < 10 || title.length > 80) {
    redirect(
      `/company/listings/new?error=${encodeURIComponent("Title must be 10–80 characters.")}`,
    );
  }
  if (description.length < 100 || description.length > 5000) {
    redirect(
      `/company/listings/new?error=${encodeURIComponent("Description must be 100–5000 characters.")}`,
    );
  }
  if (instructions && (instructions.length < 100 || instructions.length > 5000)) {
    redirect(
      `/company/listings/new?error=${encodeURIComponent("Instructions must be 100–5000 characters, or left blank.")}`,
    );
  }

  const sales_role = getStr(formData, "sales_role");
  const commitment = getMulti(formData, "commitment");
  const compensation_type = getMulti(formData, "compensation_type");
  const minimum_compensation = getNumOrNull(formData, "minimum_compensation");
  const compensation_details = getStr(formData, "compensation_details");
  const benefits = getMulti(formData, "benefits");

  const education = getMulti(formData, "education");
  const years_of_experience_min =
    getNumOrNull(formData, "years_of_experience_min") ?? 0;
  const industries = getMulti(formData, "industries");
  const sales_roles = getMulti(formData, "sales_roles");
  const sales_types = getMulti(formData, "sales_types");
  const decision_makers = getMulti(formData, "decision_makers");
  const sales_environments = getMulti(formData, "sales_environments");
  const sales_cycles = getMulti(formData, "sales_cycles");
  const deal_amounts = getMulti(formData, "deal_amounts");
  const sales_volumes = getMulti(formData, "sales_volumes");
  const lead_types = getMulti(formData, "lead_types");
  const technologies = getMulti(formData, "technologies");

  // Insert core listing row first so we can attach child rows by id.
  const now = new Date().toISOString();
  const { data: listing, error: listingErr } = await supabase
    .from("listings")
    .insert({
      tenant_id: ctx.tenantId,
      created_by_user_id: ctx.userId,
      title,
      description,
      instructions: instructions || null,
      calendar_link: calendar_link || null,
      status: publish ? "published" : "draft",
      visibility: publish ? "public" : "hidden",
      published_at: publish ? now : null,
    })
    .select("id")
    .single();

  if (listingErr || !listing) {
    redirect(
      `/company/listings/new?error=${encodeURIComponent(listingErr?.message ?? "Failed to create listing.")}`,
    );
  }

  const listingId = listing.id;

  const { error: detailsErr } = await supabase.from("listing_details").insert({
    listing_id: listingId,
    sales_role: sales_role || "Other",
    commitment: commitment.length ? commitment : null,
    benefits: benefits.length ? benefits : null,
    compensation_type: compensation_type.length ? compensation_type : null,
    minimum_compensation,
    compensation_details: compensation_details || null,
  });

  if (detailsErr) {
    redirect(
      `/company/listings/new?error=${encodeURIComponent(detailsErr.message)}`,
    );
  }

  const { error: reqErr } = await supabase.from("listing_requirements").insert({
    listing_id: listingId,
    education: education.length ? education : null,
    years_of_experience_min,
    industries: industries.length ? industries : null,
    sales_roles: sales_roles.length ? sales_roles : null,
    sales_types: sales_types.length ? sales_types : null,
    decision_makers: decision_makers.length ? decision_makers : null,
    sales_environments: sales_environments.length ? sales_environments : null,
    sales_cycles: sales_cycles.length ? sales_cycles : null,
    deal_amounts: deal_amounts.length ? deal_amounts : null,
    sales_volumes: sales_volumes.length ? sales_volumes : null,
    lead_types: lead_types.length ? lead_types : null,
    technologies: technologies.length ? technologies : null,
  });

  if (reqErr) {
    redirect(
      `/company/listings/new?error=${encodeURIComponent(reqErr.message)}`,
    );
  }

  await supabase.from("events").insert({
    tenant_id: ctx.tenantId,
    actor_user_id: ctx.userId,
    event_type: "listing.created",
    entity_type: "listing",
    entity_id: listingId,
    payload: { published: publish },
  });

  // Send the owner to the new listing's page with the featured-listing
  // upsell popped open. If they dismiss it, they land on a fully working
  // detail page. If they accept, boostListing fires and sets featured_until.
  redirect(`/company/listings/${listingId}?created=1&offer=featured`);
}

/**
 * Turn a listing's featured flag on for the requested period. Sets
 * featured_until to now + 30 days (monthly) or now + 365 days (annual).
 *
 * We deliberately don't send the email blast synchronously — that
 * happens later (real audience management + Resend contacts).
 */
export async function boostListing(formData: FormData) {
  const ctx = await getHiringTenantId();
  if (!ctx) redirect("/dashboard");

  const listingId = getStr(formData, "listing_id");
  const period = getStr(formData, "period"); // 'monthly' | 'annual'
  if (!listingId) redirect("/company/listings");

  const supabase = await createClient();

  const days = period === "annual" ? 365 : 30;
  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("listings")
    .update({
      featured_until: until,
      featured_reason: "urgent_hiring",
    })
    .eq("id", listingId)
    .eq("tenant_id", ctx.tenantId);

  if (error) {
    redirect(
      `/company/listings/${listingId}?error=${encodeURIComponent(error.message)}`,
    );
  }

  await supabase.from("events").insert({
    tenant_id: ctx.tenantId,
    actor_user_id: ctx.userId,
    event_type: "listing.featured",
    entity_type: "listing",
    entity_id: listingId,
    payload: { period, featured_until: until },
  });

  redirect(`/company/listings/${listingId}?boosted=1`);
}

export async function updateListing(formData: FormData) {
  const ctx = await getHiringTenantId();
  if (!ctx) redirect("/dashboard");

  const supabase = await createClient();

  const listingId = getStr(formData, "listing_id");
  if (!listingId) redirect("/company/listings");

  // Confirm this tenant owns the listing before touching anything.
  const { data: existing, error: existingErr } = await supabase
    .from("listings")
    .select("id, tenant_id, status")
    .eq("id", listingId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();

  if (existingErr || !existing) {
    redirect(
      `/company/listings?error=${encodeURIComponent("Listing not found or you don't have permission to edit it.")}`,
    );
  }

  const title = getStr(formData, "title");
  const description = getStr(formData, "description");
  const instructions = getStr(formData, "instructions");
  const calendar_link = getStr(formData, "calendar_link");
  const publish = getStr(formData, "publish") === "1";

  const errorRedirect = `/company/listings/${listingId}/edit`;

  if (title.length < 10 || title.length > 80) {
    redirect(
      `${errorRedirect}?error=${encodeURIComponent("Title must be 10–80 characters.")}`,
    );
  }
  if (description.length < 100 || description.length > 5000) {
    redirect(
      `${errorRedirect}?error=${encodeURIComponent("Description must be 100–5000 characters.")}`,
    );
  }
  if (instructions && (instructions.length < 100 || instructions.length > 5000)) {
    redirect(
      `${errorRedirect}?error=${encodeURIComponent("Instructions must be 100–5000 characters, or left blank.")}`,
    );
  }

  const sales_role = getStr(formData, "sales_role");
  const commitment = getMulti(formData, "commitment");
  const compensation_type = getMulti(formData, "compensation_type");
  const minimum_compensation = getNumOrNull(formData, "minimum_compensation");
  const compensation_details = getStr(formData, "compensation_details");
  const benefits = getMulti(formData, "benefits");

  const education = getMulti(formData, "education");
  const years_of_experience_min =
    getNumOrNull(formData, "years_of_experience_min") ?? 0;
  const industries = getMulti(formData, "industries");
  const sales_roles = getMulti(formData, "sales_roles");
  const sales_types = getMulti(formData, "sales_types");
  const decision_makers = getMulti(formData, "decision_makers");
  const sales_environments = getMulti(formData, "sales_environments");
  const sales_cycles = getMulti(formData, "sales_cycles");
  const deal_amounts = getMulti(formData, "deal_amounts");
  const sales_volumes = getMulti(formData, "sales_volumes");
  const lead_types = getMulti(formData, "lead_types");
  const technologies = getMulti(formData, "technologies");

  const now = new Date().toISOString();
  const wasPublished = existing.status === "published";

  const listingPatch: Record<string, unknown> = {
    title,
    description,
    instructions: instructions || null,
    calendar_link: calendar_link || null,
  };

  if (publish) {
    listingPatch.status = "published";
    listingPatch.visibility = "public";
    listingPatch.archived_at = null;
    if (!wasPublished) {
      listingPatch.published_at = now;
    }
  } else {
    listingPatch.status = "draft";
    listingPatch.visibility = "hidden";
  }

  const { error: listingErr } = await supabase
    .from("listings")
    .update(listingPatch)
    .eq("id", listingId)
    .eq("tenant_id", ctx.tenantId);

  if (listingErr) {
    redirect(
      `${errorRedirect}?error=${encodeURIComponent(listingErr.message)}`,
    );
  }

  const detailsPayload = {
    listing_id: listingId,
    sales_role: sales_role || "Other",
    commitment: commitment.length ? commitment : null,
    benefits: benefits.length ? benefits : null,
    compensation_type: compensation_type.length ? compensation_type : null,
    minimum_compensation,
    compensation_details: compensation_details || null,
  };

  const { error: detailsErr } = await supabase
    .from("listing_details")
    .upsert(detailsPayload, { onConflict: "listing_id" });

  if (detailsErr) {
    redirect(
      `${errorRedirect}?error=${encodeURIComponent(detailsErr.message)}`,
    );
  }

  const reqPayload = {
    listing_id: listingId,
    education: education.length ? education : null,
    years_of_experience_min,
    industries: industries.length ? industries : null,
    sales_roles: sales_roles.length ? sales_roles : null,
    sales_types: sales_types.length ? sales_types : null,
    decision_makers: decision_makers.length ? decision_makers : null,
    sales_environments: sales_environments.length ? sales_environments : null,
    sales_cycles: sales_cycles.length ? sales_cycles : null,
    deal_amounts: deal_amounts.length ? deal_amounts : null,
    sales_volumes: sales_volumes.length ? sales_volumes : null,
    lead_types: lead_types.length ? lead_types : null,
    technologies: technologies.length ? technologies : null,
  };

  const { error: reqErr } = await supabase
    .from("listing_requirements")
    .upsert(reqPayload, { onConflict: "listing_id" });

  if (reqErr) {
    redirect(
      `${errorRedirect}?error=${encodeURIComponent(reqErr.message)}`,
    );
  }

  await supabase.from("events").insert({
    tenant_id: ctx.tenantId,
    actor_user_id: ctx.userId,
    event_type: "listing.updated",
    entity_type: "listing",
    entity_id: listingId,
    payload: { published: publish, was_published: wasPublished },
  });

  redirect(`/company/listings?updated=1`);
}

export async function setListingStatus(formData: FormData) {
  const ctx = await getHiringTenantId();
  if (!ctx) redirect("/dashboard");
  const supabase = await createClient();

  const listingId = getStr(formData, "listing_id");
  const action = getStr(formData, "action");

  if (!listingId) redirect("/company/listings");

  const patch: Record<string, unknown> = {};
  const now = new Date().toISOString();

  switch (action) {
    case "publish":
      patch.status = "published";
      patch.visibility = "public";
      patch.published_at = now;
      patch.archived_at = null;
      break;
    case "unpublish":
      patch.status = "paused";
      patch.visibility = "hidden";
      break;
    case "archive":
      patch.status = "archived";
      patch.visibility = "hidden";
      patch.archived_at = now;
      break;
    default:
      redirect("/company/listings");
  }

  const { error } = await supabase
    .from("listings")
    .update(patch)
    .eq("id", listingId)
    .eq("tenant_id", ctx.tenantId);

  if (error) {
    redirect(
      `/company/listings?error=${encodeURIComponent(error.message)}`,
    );
  }

  await supabase.from("events").insert({
    tenant_id: ctx.tenantId,
    actor_user_id: ctx.userId,
    event_type: `listing.${action}`,
    entity_type: "listing",
    entity_id: listingId,
    payload: {},
  });

  redirect(`/company/listings?updated=1`);
}

export async function deleteListing(formData: FormData) {
  const ctx = await getHiringTenantId();
  if (!ctx) redirect("/dashboard");
  const supabase = await createClient();

  const listingId = getStr(formData, "listing_id");
  const confirm = getStr(formData, "confirm");
  if (!listingId || confirm !== "DELETE") {
    redirect(
      `/company/listings?error=${encodeURIComponent("Type DELETE to confirm.")}`,
    );
  }

  // Applications cascade-delete on listing removal per FK config, but we
  // record the event first so audit history survives the delete.
  await supabase.from("events").insert({
    tenant_id: ctx.tenantId,
    actor_user_id: ctx.userId,
    event_type: "listing.deleted",
    entity_type: "listing",
    entity_id: listingId,
    payload: {},
  });

  const { error } = await supabase
    .from("listings")
    .delete()
    .eq("id", listingId)
    .eq("tenant_id", ctx.tenantId);

  if (error) {
    redirect(
      `/company/listings?error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect(`/company/listings?deleted=1`);
}
