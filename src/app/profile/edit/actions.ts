"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function getStr(fd: FormData, name: string): string {
  return String(fd.get(name) ?? "").trim();
}

function getMulti(fd: FormData, name: string): string[] {
  return fd.getAll(name).map(String).filter(Boolean);
}

function getNumOrNull(fd: FormData, name: string, min = 0, max = 1_000_000_000): number | null {
  const raw = getStr(fd, name);
  if (raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, n));
}

/**
 * Save the candidate's full profile in one shot. Upserts three tables
 * (candidate_profiles, candidate_goals, candidate_specialties) so a
 * single Save button covers everything except the resume, which has
 * its own dedicated action.
 */
export async function saveProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // --- Section 1: profile personal info ---
  const headline = getStr(formData, "headline");
  const about = getStr(formData, "about");
  const photo_url = getStr(formData, "photo_url");
  const video_url = getStr(formData, "video_url");
  const skills = getStr(formData, "skills");
  const contact_email = getStr(formData, "contact_email");
  const phone = getStr(formData, "phone");
  const city = getStr(formData, "city");
  const state_region = getStr(formData, "state_region");
  const country = getStr(formData, "country");
  const visibility = formData.get("visibility") === "public" ? "public" : "hidden";

  // --- Section 2: experience summary ---
  const years_of_experience = getNumOrNull(formData, "years_of_experience", 0, 60);
  const education = getStr(formData, "education") || null;
  const industry_slugs = getMulti(formData, "industry_slugs");
  const specialties = getMulti(formData, "specialties");
  const sales_types = getMulti(formData, "sales_types");
  const decision_makers = getMulti(formData, "decision_makers");
  const sales_environments = getMulti(formData, "sales_environments");
  const sales_cycles = getMulti(formData, "sales_cycles");
  const deal_amounts = getMulti(formData, "deal_amounts");
  const sales_volumes = getMulti(formData, "sales_volumes");
  const lead_types = getMulti(formData, "lead_types");
  const technologies = getMulti(formData, "technologies");

  // --- Section 3: goals ---
  const company_age_min = getNumOrNull(formData, "company_age_min", 0, 200);
  const company_headcount_min = getNumOrNull(formData, "company_headcount_min", 0, 100_000);
  const goal_industries = getMulti(formData, "goal_industries");
  const goal_sales_roles = getMulti(formData, "goal_sales_roles");
  const goal_commitment = getMulti(formData, "goal_commitment");
  const goal_benefits = getMulti(formData, "goal_benefits");
  const goal_compensation_types = getMulti(formData, "goal_compensation_types");
  const minimum_compensation = getNumOrNull(formData, "minimum_compensation", 0, 5_000_000);

  // ---------- candidate_profiles upsert ----------
  const { error: profileError } = await supabase.from("candidate_profiles").upsert(
    {
      user_id: user.id,
      headline: headline || null,
      about: about || null,
      photo_url: photo_url || null,
      video_url: video_url || null,
      skills: skills || null,
      contact_email: contact_email || null,
      phone: phone || null,
      city: city || null,
      state_region: state_region || null,
      country: country || null,
      visibility,
      years_of_experience,
      education,
      industry_slugs: industry_slugs.length ? industry_slugs : null,
      sales_types: sales_types.length ? sales_types : null,
      decision_makers: decision_makers.length ? decision_makers : null,
      sales_environments: sales_environments.length ? sales_environments : null,
      sales_cycles: sales_cycles.length ? sales_cycles : null,
      deal_amounts: deal_amounts.length ? deal_amounts : null,
      sales_volumes: sales_volumes.length ? sales_volumes : null,
      lead_types: lead_types.length ? lead_types : null,
      technologies: technologies.length ? technologies : null,
      onboarding_completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (profileError) {
    redirect(`/profile/edit?error=${encodeURIComponent(profileError.message)}`);
  }

  // ---------- candidate_specialties sync ----------
  await supabase.from("candidate_specialties").delete().eq("user_id", user.id);
  if (specialties.length > 0) {
    const rows = specialties.map((r) => ({ user_id: user.id, sales_role: r }));
    const { error: specError } = await supabase
      .from("candidate_specialties")
      .insert(rows);
    if (specError) {
      redirect(`/profile/edit?error=${encodeURIComponent(specError.message)}`);
    }
  }

  // ---------- candidate_goals upsert ----------
  const { error: goalsError } = await supabase.from("candidate_goals").upsert(
    {
      user_id: user.id,
      company_age_min,
      company_headcount_min,
      industries: goal_industries.length ? goal_industries : null,
      sales_roles: goal_sales_roles.length ? goal_sales_roles : null,
      commitment: goal_commitment.length ? goal_commitment : null,
      benefits: goal_benefits.length ? goal_benefits : null,
      compensation_types: goal_compensation_types.length
        ? goal_compensation_types
        : null,
      minimum_compensation,
    },
    { onConflict: "user_id" },
  );

  if (goalsError) {
    redirect(`/profile/edit?error=${encodeURIComponent(goalsError.message)}`);
  }

  redirect("/profile/edit?saved=1");
}

/**
 * Upload a resume PDF to Supabase Storage and record it in candidate_files.
 * Deletes any prior resume so a candidate only has one on file at a time.
 */
export async function uploadResume(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const file = formData.get("resume");
  if (!(file instanceof File) || file.size === 0) {
    redirect(
      `/profile/edit?error=${encodeURIComponent("Pick a PDF file to upload.")}`,
    );
  }

  const f = file as File;
  if (f.type !== "application/pdf") {
    redirect(
      `/profile/edit?error=${encodeURIComponent("Resume must be a PDF file.")}`,
    );
  }
  if (f.size > 5 * 1024 * 1024) {
    redirect(
      `/profile/edit?error=${encodeURIComponent("Resume must be under 5 MB.")}`,
    );
  }

  // Remove any prior resume file rows + storage objects so there's only ever
  // one resume per candidate at a time.
  const { data: prior } = await supabase
    .from("candidate_files")
    .select("id, r2_key")
    .eq("user_id", user.id)
    .eq("kind", "resume");

  if (prior && prior.length > 0) {
    const keys = prior.map((p) => p.r2_key as string);
    await supabase.storage.from("resumes").remove(keys);
    await supabase.from("candidate_files").delete().eq("user_id", user.id).eq("kind", "resume");
  }

  // Path: {user_id}/resume-{timestamp}.pdf. The user_id folder is what RLS
  // checks so only this candidate can write here.
  const storagePath = `${user.id}/resume-${Date.now()}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(storagePath, f, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    redirect(
      `/profile/edit?error=${encodeURIComponent("Upload failed: " + uploadError.message)}`,
    );
  }

  const { error: metaError } = await supabase.from("candidate_files").insert({
    user_id: user.id,
    kind: "resume",
    r2_key: storagePath,
    original_filename: f.name,
    size_bytes: f.size,
    mime_type: "application/pdf",
  });

  if (metaError) {
    // Roll back the upload if metadata insert fails, so we don't leave
    // orphan files behind.
    await supabase.storage.from("resumes").remove([storagePath]);
    redirect(
      `/profile/edit?error=${encodeURIComponent(metaError.message)}`,
    );
  }

  revalidatePath("/profile/edit");
  redirect("/profile/edit?saved=1");
}

export async function deleteResume() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: files } = await supabase
    .from("candidate_files")
    .select("id, r2_key")
    .eq("user_id", user.id)
    .eq("kind", "resume");

  if (files && files.length > 0) {
    const keys = files.map((f) => f.r2_key as string);
    await supabase.storage.from("resumes").remove(keys);
    await supabase.from("candidate_files").delete().eq("user_id", user.id).eq("kind", "resume");
  }

  revalidatePath("/profile/edit");
  redirect("/profile/edit?saved=1");
}
