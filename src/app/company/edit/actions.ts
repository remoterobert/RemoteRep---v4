"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
  const industry_slug = String(formData.get("industry_slug") ?? "").trim();
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
      industry_slug: industry_slug || null,
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
