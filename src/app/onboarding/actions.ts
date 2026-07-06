"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSalesRole, type SalesRole } from "@/lib/sales-roles";

export async function completeHiringOnboarding(formData: FormData) {
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const companyName = String(formData.get("company_name") ?? "").trim();
  const hiringFor = formData
    .getAll("hiring_for")
    .map((v) => String(v))
    .filter(isSalesRole) as SalesRole[];

  if (!firstName || !lastName || !companyName || hiringFor.length === 0) {
    redirect(
      `/onboarding/hiring?error=${encodeURIComponent("Please fill in your name and company, and pick at least one role.")}`,
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

  // Force the whole app shell (sidebar + membership lookup) to re-render
  // with the freshly-created tenant_members row before we redirect. Fixes
  // the "you got dumped on a signed-out-looking page" bug where the layout
  // read its data faster than the RPC's row had propagated to the request.
  revalidatePath("/", "layout");
  redirect("/dashboard");
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

  // See comment in completeHiringOnboarding — force layout revalidation
  // so AppShell's tenant_members query re-runs and the sidebar appears.
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
