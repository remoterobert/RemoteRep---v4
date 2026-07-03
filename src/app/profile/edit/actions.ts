"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSalesRole, type SalesRole } from "@/lib/sales-roles";
import {
  filterToKnown,
  SALES_TYPES,
  DECISION_MAKERS,
  SALES_ENVIRONMENTS,
  DEAL_AMOUNTS,
  LEAD_TYPES,
  type SalesType,
  type DecisionMaker,
  type SalesEnvironment,
  type DealAmount,
  type LeadType,
} from "@/lib/v3-enums";

export async function saveProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const headline = String(formData.get("headline") ?? "").trim();
  const about = String(formData.get("about") ?? "").trim();
  const visibility = formData.get("visibility") === "public" ? "public" : "hidden";

  const yearsRaw = String(formData.get("years_of_experience") ?? "").trim();
  const years_of_experience = yearsRaw === "" ? null : Math.max(0, Math.min(60, parseInt(yearsRaw, 10) || 0));

  const sales_types = filterToKnown<SalesType>(
    formData.getAll("sales_types").map(String),
    SALES_TYPES,
  );
  const decision_makers = filterToKnown<DecisionMaker>(
    formData.getAll("decision_makers").map(String),
    DECISION_MAKERS,
  );
  const sales_environments = filterToKnown<SalesEnvironment>(
    formData.getAll("sales_environments").map(String),
    SALES_ENVIRONMENTS,
  );
  const deal_amounts = filterToKnown<DealAmount>(
    formData.getAll("deal_amounts").map(String),
    DEAL_AMOUNTS,
  );
  const lead_types = filterToKnown<LeadType>(
    formData.getAll("lead_types").map(String),
    LEAD_TYPES,
  );

  const specialties = formData
    .getAll("specialties")
    .map(String)
    .filter(isSalesRole) as SalesRole[];

  // Upsert candidate_profiles (1:1 with user)
  const { error: profileError } = await supabase.from("candidate_profiles").upsert(
    {
      user_id: user.id,
      headline: headline || null,
      about: about || null,
      visibility,
      years_of_experience,
      sales_types: sales_types.length > 0 ? sales_types : null,
      decision_makers: decision_makers.length > 0 ? decision_makers : null,
      sales_environments: sales_environments.length > 0 ? sales_environments : null,
      deal_amounts: deal_amounts.length > 0 ? deal_amounts : null,
      lead_types: lead_types.length > 0 ? lead_types : null,
      onboarding_completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (profileError) {
    redirect(`/profile/edit?error=${encodeURIComponent(profileError.message)}`);
  }

  // Sync candidate_specialties: delete existing rows, insert new
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

  redirect("/dashboard?saved=1");
}
