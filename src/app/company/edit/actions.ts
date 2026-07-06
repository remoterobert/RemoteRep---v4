"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_LOGO_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
]);
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};
const MAX_LOGO_BYTES = 5 * 1024 * 1024;

async function requireHiringAdminTenant() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["client_admin", "agency_admin"])
    .limit(1)
    .maybeSingle();
  if (!membership) {
    redirect(
      `/dashboard?error=${encodeURIComponent("Only client/agency admins can edit the company profile.")}`,
    );
  }
  return { supabase, user, tenantId: (membership as { tenant_id: string }).tenant_id };
}

export async function saveCompanyProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Find hiring tenant this user administers.
  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id, role, tenants!inner(type)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["client_admin", "agency_admin"])
    .limit(1)
    .maybeSingle();

  type MembershipRow = { tenant_id: string; role: string; tenants: { type: string } };
  const m = membership as unknown as MembershipRow | null;
  if (!m) {
    redirect(
      `/dashboard?error=${encodeURIComponent("Only client/agency admins can edit the company profile.")}`,
    );
  }

  const name = String(formData.get("name") ?? "").trim();
  const about = String(formData.get("about") ?? "").trim();
  const hiring_pitch = String(formData.get("hiring_pitch") ?? "").trim();
  const website_url = String(formData.get("website_url") ?? "").trim();
  const contact_email = String(formData.get("contact_email") ?? "").trim();
  const contact_phone = String(formData.get("contact_phone") ?? "").trim();
  const industry_slug = String(formData.get("industry_slug") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state_region = String(formData.get("state_region") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const headcountRaw = String(formData.get("headcount") ?? "").trim();
  const foundedYearRaw = String(formData.get("founded_year") ?? "").trim();
  const visibility =
    formData.get("visibility") === "hidden" ? "hidden" : "public";

  const headcount = headcountRaw === "" ? null : Math.max(0, parseInt(headcountRaw, 10) || 0);
  const founded_year =
    foundedYearRaw === "" ? null : parseInt(foundedYearRaw, 10) || null;

  // Update the tenant name if changed
  if (name.length > 0) {
    await supabase.from("tenants").update({ name }).eq("id", m.tenant_id);
  }

  const { error } = await supabase.from("client_profiles").upsert(
    {
      tenant_id: m.tenant_id,
      about: about || null,
      hiring_pitch: hiring_pitch || null,
      website_url: website_url || null,
      contact_email: contact_email || null,
      contact_phone: contact_phone || null,
      industry_slug: industry_slug || null,
      city: city || null,
      state_region: state_region || null,
      country: country || null,
      headcount,
      founded_year,
      visibility,
      onboarding_completed_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id" },
  );

  if (error) {
    redirect(`/company/edit?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard?saved=1");
}

/**
 * Upload a company logo. Public bucket `logos` under `{tenant_id}/logo-{ts}.{ext}`.
 * Removes any prior logo file so a tenant only has one on the shelf at a time,
 * then updates client_profiles.logo_url with the new public URL.
 */
export async function uploadLogo(formData: FormData) {
  const { supabase, tenantId } = await requireHiringAdminTenant();

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    redirect(
      `/company/edit?error=${encodeURIComponent("Pick a file to upload.")}`,
    );
  }
  const f = file as File;
  if (!ALLOWED_LOGO_MIME.has(f.type)) {
    redirect(
      `/company/edit?error=${encodeURIComponent("Logo must be JPG, PNG, GIF, WebP, SVG, or PDF.")}`,
    );
  }
  if (f.size > MAX_LOGO_BYTES) {
    redirect(
      `/company/edit?error=${encodeURIComponent("Logo must be under 5 MB.")}`,
    );
  }

  // Clear any prior logo — one-file-per-tenant policy keeps the bucket tidy.
  const { data: existing } = await supabase.storage
    .from("logos")
    .list(tenantId, { limit: 100 });
  if (existing && existing.length > 0) {
    const keys = existing.map((o) => `${tenantId}/${o.name}`);
    await supabase.storage.from("logos").remove(keys);
  }

  const ext = MIME_TO_EXT[f.type] ?? "bin";
  const storagePath = `${tenantId}/logo-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("logos")
    .upload(storagePath, f, {
      contentType: f.type,
      upsert: true,
    });
  if (uploadError) {
    redirect(
      `/company/edit?error=${encodeURIComponent("Upload failed: " + uploadError.message)}`,
    );
  }

  const { data: pub } = supabase.storage.from("logos").getPublicUrl(storagePath);
  const publicUrl = pub?.publicUrl ?? null;

  const { error: updateError } = await supabase
    .from("client_profiles")
    .upsert(
      { tenant_id: tenantId, logo_url: publicUrl },
      { onConflict: "tenant_id" },
    );
  if (updateError) {
    await supabase.storage.from("logos").remove([storagePath]);
    redirect(
      `/company/edit?error=${encodeURIComponent(updateError.message)}`,
    );
  }

  revalidatePath("/company/edit");
  revalidatePath("/dashboard");
  redirect("/company/edit?saved=1");
}

export async function deleteLogo() {
  const { supabase, tenantId } = await requireHiringAdminTenant();

  const { data: existing } = await supabase.storage
    .from("logos")
    .list(tenantId, { limit: 100 });
  if (existing && existing.length > 0) {
    const keys = existing.map((o) => `${tenantId}/${o.name}`);
    await supabase.storage.from("logos").remove(keys);
  }

  await supabase
    .from("client_profiles")
    .upsert(
      { tenant_id: tenantId, logo_url: null },
      { onConflict: "tenant_id" },
    );

  revalidatePath("/company/edit");
  revalidatePath("/dashboard");
  redirect("/company/edit?saved=1");
}
