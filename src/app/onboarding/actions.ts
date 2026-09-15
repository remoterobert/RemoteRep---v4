"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSalesRole, type SalesRole } from "@/lib/sales-roles";
import { syncUserToGhl } from "@/lib/ghl/sync";

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

  // Create the GoHighLevel contact + opportunity in the client pipeline.
  // This is the point v4 first knows they're a hiring team — v3 knew at
  // signup, but v4's signup only takes an email and password.
  //
  // `after` runs once the response has been sent, so a slow or failing CRM
  // can never hold up onboarding. It still fires even though we redirect
  // below.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) after(() => syncUserToGhl(user.id));

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

  // Same as the hiring path, into the talent pipeline. See the comment there.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) after(() => syncUserToGhl(user.id));

  // See comment in completeHiringOnboarding — force layout revalidation
  // so AppShell's tenant_members query re-runs and the sidebar appears.
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
