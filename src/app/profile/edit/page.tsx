import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  saveProfile,
  uploadResume,
  deleteResume,
  uploadPhoto,
  deletePhoto,
} from "./actions";
import {
  ProfileEditForm,
  ProfileSaveBar,
  type ProfileDefaults,
  type GoalsDefaults,
} from "./ProfileEditForm";
import { ResumeSection } from "./ResumeSection";
import { PhotoSection } from "./PhotoSection";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string; saved?: string }>;

export default async function EditProfilePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Only candidates on this page — bounce hiring users to their dashboard.
  const { data: memberships } = await supabase
    .from("tenant_members")
    .select("role, tenants!inner(type)")
    .eq("user_id", user.id)
    .eq("status", "active");

  type MembershipRow = { role: string; tenants: { type: string } };
  const rows = (memberships ?? []) as unknown as MembershipRow[];
  const isCandidate = rows.some(
    (m) => m.role === "candidate" || m.tenants.type === "solo_talent",
  );
  if (!isCandidate) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  // ---- Fetch everything the form pre-fills from ----
  const [
    { data: profileRow },
    { data: goalsRow },
    { data: specialtiesRows },
    { data: resumeRow },
  ] = await Promise.all([
    supabase
      .from("candidate_profiles")
      .select(
        "headline, about, photo_url, video_url, skills, contact_email, phone, city, state_region, country, visibility, years_of_experience, education, industry_slugs, sales_types, decision_makers, sales_environments, sales_cycles, deal_amounts, sales_volumes, lead_types, technologies",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("candidate_goals")
      .select(
        "company_age_min, company_headcount_min, industries, sales_roles, commitment, benefits, compensation_types, minimum_compensation",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("candidate_specialties")
      .select("sales_role")
      .eq("user_id", user.id),
    supabase
      .from("candidate_files")
      .select("original_filename, size_bytes, uploaded_at")
      .eq("user_id", user.id)
      .eq("kind", "resume")
      .order("uploaded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const profileDefaults: ProfileDefaults = {
    headline: profileRow?.headline ?? "",
    about: profileRow?.about ?? "",
    video_url: profileRow?.video_url ?? "",
    skills: profileRow?.skills ?? "",
    contact_email: profileRow?.contact_email ?? "",
    phone: profileRow?.phone ?? "",
    city: profileRow?.city ?? "",
    state_region: profileRow?.state_region ?? "",
    country: profileRow?.country ?? "",
    visibility:
      (profileRow?.visibility as "public" | "hidden" | undefined) ?? "public",
    years_of_experience: profileRow?.years_of_experience ?? null,
    education: profileRow?.education ?? null,
    industry_slugs: profileRow?.industry_slugs ?? [],
    specialties: (specialtiesRows ?? []).map((s) => s.sales_role as string),
    sales_types: profileRow?.sales_types ?? [],
    decision_makers: profileRow?.decision_makers ?? [],
    sales_environments: profileRow?.sales_environments ?? [],
    sales_cycles: profileRow?.sales_cycles ?? [],
    deal_amounts: profileRow?.deal_amounts ?? [],
    sales_volumes: profileRow?.sales_volumes ?? [],
    lead_types: profileRow?.lead_types ?? [],
    technologies: profileRow?.technologies ?? [],
  };

  const goalsDefaults: GoalsDefaults = {
    company_age_min: goalsRow?.company_age_min ?? null,
    company_headcount_min: goalsRow?.company_headcount_min ?? null,
    industries: goalsRow?.industries ?? [],
    sales_roles: goalsRow?.sales_roles ?? [],
    commitment: goalsRow?.commitment ?? [],
    benefits: goalsRow?.benefits ?? [],
    compensation_types: goalsRow?.compensation_types ?? [],
    minimum_compensation: goalsRow?.minimum_compensation ?? null,
  };

  return (
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
      <h1 className="text-2xl font-semibold mb-1">Your profile</h1>
      <p className="text-sm text-light-grey mb-6">
        This is what hiring companies see when they browse candidates — and
        how listings get matched to you.
      </p>

      {params.error && (
        <div
          role="alert"
          className="mb-4 rounded border border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-900 p-3 text-sm text-red-800 dark:text-red-200"
        >
          {params.error}
        </div>
      )}
      {params.saved && (
        <div className="mb-4 rounded border border-success/40 bg-success/10 p-3 text-sm text-success">
          Saved.
        </div>
      )}

      <div className="space-y-6">
        {/* Photo lives outside ProfileEditForm because it has its own
            upload + delete forms — HTML forbids nested forms. */}
        <PhotoSection
          currentUrl={profileRow?.photo_url ?? null}
          uploadAction={uploadPhoto}
          deleteAction={deletePhoto}
        />

        <ProfileEditForm
          formId="profile-form"
          action={saveProfile}
          profile={profileDefaults}
          goals={goalsDefaults}
        />

        <ResumeSection
          currentFilename={resumeRow?.original_filename ?? null}
          currentSizeBytes={resumeRow?.size_bytes ?? null}
          uploadedAt={resumeRow?.uploaded_at ?? null}
          uploadAction={uploadResume}
          deleteAction={deleteResume}
        />

        <ProfileSaveBar formId="profile-form" />
      </div>
    </main>
  );
}
