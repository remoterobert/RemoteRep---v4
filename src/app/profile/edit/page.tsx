import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SALES_ROLES } from "@/lib/sales-roles";
import {
  SALES_TYPES,
  DECISION_MAKERS,
  SALES_ENVIRONMENTS,
  DEAL_AMOUNTS,
  LEAD_TYPES,
} from "@/lib/v3-enums";
import { saveProfile } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string }>;

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

  // Only candidates should be on this page. Redirect hiring users elsewhere.
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
  const error = params.error;

  // Existing profile (may be null if this is the first save)
  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select(
      "headline, about, visibility, years_of_experience, sales_types, decision_makers, sales_environments, deal_amounts, lead_types",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: specialtiesData } = await supabase
    .from("candidate_specialties")
    .select("sales_role")
    .eq("user_id", user.id);

  const currentSpecialties = new Set(
    (specialtiesData ?? []).map((s) => s.sales_role as string),
  );
  const currentSalesTypes = new Set(profile?.sales_types ?? []);
  const currentDecisionMakers = new Set(profile?.decision_makers ?? []);
  const currentSalesEnvironments = new Set(profile?.sales_environments ?? []);
  const currentDealAmounts = new Set(profile?.deal_amounts ?? []);
  const currentLeadTypes = new Set(profile?.lead_types ?? []);

  return (
    <div className="p-6 max-w-2xl mx-auto w-full">
      <h1 className="text-xl font-semibold mb-2">Your profile</h1>
      <p className="text-sm text-light-grey mb-6">
        This is what hiring companies see when they browse candidates.
      </p>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded border border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-900 p-3 text-sm text-red-800 dark:text-red-200"
        >
          {error}
        </div>
      )}

      <form action={saveProfile} className="space-y-8">
        {/* === PUBLIC PROFILE === */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-light-grey uppercase tracking-wider">
            Public profile
          </h2>

          <div>
            <label htmlFor="headline" className="block text-sm font-medium mb-1">
              Headline
            </label>
            <input
              id="headline"
              name="headline"
              type="text"
              maxLength={140}
              defaultValue={profile?.headline ?? ""}
              placeholder="e.g., Closer with 7 years SaaS experience — $1.2M ARR closed last year"
              className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            />
            <p className="text-xs text-light-grey mt-1">
              One line. Shown at the top of your card.
            </p>
          </div>

          <div>
            <label htmlFor="about" className="block text-sm font-medium mb-1">
              About
            </label>
            <textarea
              id="about"
              name="about"
              rows={4}
              maxLength={2000}
              defaultValue={profile?.about ?? ""}
              placeholder="Tell hiring companies what makes you effective. Include specific results if you can."
              className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            />
          </div>

          <fieldset>
            <legend className="block text-sm font-medium mb-2">
              Visibility
            </legend>
            <div className="flex items-center gap-6 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  defaultChecked={
                    !profile || profile.visibility === "public"
                  }
                />
                Public — hiring companies can find me
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="hidden"
                  defaultChecked={profile?.visibility === "hidden"}
                />
                Hidden — I&apos;m not looking right now
              </label>
            </div>
          </fieldset>
        </section>

        {/* === BACKGROUND === */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-light-grey uppercase tracking-wider">
            Your sales background
          </h2>

          <div>
            <label
              htmlFor="years_of_experience"
              className="block text-sm font-medium mb-1"
            >
              Years of sales experience
            </label>
            <input
              id="years_of_experience"
              name="years_of_experience"
              type="number"
              min={0}
              max={60}
              defaultValue={profile?.years_of_experience ?? ""}
              className="w-32 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            />
          </div>

          <CheckboxGroup
            legend="Types of selling you do"
            name="sales_types"
            options={SALES_TYPES}
            current={currentSalesTypes as Set<string>}
          />

          <CheckboxGroup
            legend="Roles you specialize in"
            name="specialties"
            options={SALES_ROLES}
            current={currentSpecialties}
          />

          <CheckboxGroup
            legend="Typical deal sizes you close"
            name="deal_amounts"
            options={DEAL_AMOUNTS}
            current={currentDealAmounts as Set<string>}
          />

          <CheckboxGroup
            legend="Who you sell to"
            name="decision_makers"
            options={DECISION_MAKERS}
            current={currentDecisionMakers as Set<string>}
          />

          <CheckboxGroup
            legend="How you sell"
            name="sales_environments"
            options={SALES_ENVIRONMENTS}
            current={currentSalesEnvironments as Set<string>}
          />

          <CheckboxGroup
            legend="Lead types you work best with"
            name="lead_types"
            options={LEAD_TYPES}
            current={currentLeadTypes as Set<string>}
          />
        </section>

        <div className="flex items-center gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="submit"
            className="rounded bg-primary text-white px-5 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Save profile
          </button>
          <a
            href="/dashboard"
            className="text-sm text-light-grey hover:text-primary transition-colors"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}

function CheckboxGroup({
  legend,
  name,
  options,
  current,
}: {
  legend: string;
  name: string;
  options: readonly string[];
  current: Set<string>;
}) {
  return (
    <fieldset>
      <legend className="block text-sm font-medium mb-2">{legend}</legend>
      <div className="grid grid-cols-2 gap-1">
        {options.map((opt) => (
          <label
            key={opt}
            className="flex items-center gap-2 text-sm py-1 cursor-pointer"
          >
            <input
              type="checkbox"
              name={name}
              value={opt}
              defaultChecked={current.has(opt)}
              className="rounded"
            />
            {opt}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
