"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSalesRole, type SalesRole } from "@/lib/sales-roles";

export async function completeHiringOnboarding(formData: FormData) {
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const companyName = String(formData.get("company_name") ?? "").trim();
  const hiringFor = String(formData.get("hiring_for") ?? "").trim();

  if (!firstName || !lastName || !companyName || !hiringFor) {
    redirect(
      `/onboarding/hiring?error=${encodeURIComponent("All fields are required.")}`,
    );
  }

  if (!isSalesRole(hiringFor)) {
    redirect(
      `/onboarding/hiring?error=${encodeURIComponent("Invalid sales role.")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_hiring_onboarding", {
    p_first_name: firstName,
    p_last_name: lastName,
    p_company_name: companyName,
    p_hiring_for: hiringFor,
  });

  if (error) {
    redirect(
      `/onboarding/hiring?error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect("/candidates");
}

export async function completeCandidateOnboarding(formData: FormData) {
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const specialties = formData
    .getAll("specialties")
    .map((v) => String(v))
    .filter(isSalesRole) as SalesRole[];

  if (!firstName || !lastName || specialties.length === 0) {
    redirect(
      `/onboarding/candidate?error=${encodeURIComponent("Please fill in your name and pick at least one role.")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_candidate_onboarding", {
    p_first_name: firstName,
    p_last_name: lastName,
    p_specialty_roles: specialties,
  });

  if (error) {
    redirect(
      `/onboarding/candidate?error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect("/dashboard");
}
