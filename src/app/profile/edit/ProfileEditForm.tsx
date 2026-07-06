"use client";

import { ChipMulti } from "@/components/forms/ChipMulti";
import { SearchMulti } from "@/components/forms/SearchMulti";
import { SearchSelect } from "@/components/forms/SearchSelect";
import {
  SALES_ROLES,
  COMMITMENTS,
  BENEFITS,
  COMPENSATION_TYPES,
  EDUCATION_LEVELS,
  SALES_TYPES,
  DECISION_MAKERS,
  SALES_ENVIRONMENTS,
  SALES_CYCLES,
  DEAL_AMOUNTS,
  SALES_VOLUMES,
  LEAD_TYPES,
  TECHNOLOGIES,
  INDUSTRIES,
} from "@/lib/listings/options";
import { COUNTRIES, STATES } from "@/lib/locations";

const inputCls =
  "w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm";

export type ProfileDefaults = {
  headline: string;
  about: string;
  video_url: string;
  skills: string;
  contact_email: string;
  phone: string;
  city: string;
  state_region: string;
  country: string;
  visibility: "public" | "hidden";
  years_of_experience: number | null;
  education: string | null;
  industry_slugs: string[];
  specialties: string[];
  sales_types: string[];
  decision_makers: string[];
  sales_environments: string[];
  sales_cycles: string[];
  deal_amounts: string[];
  sales_volumes: string[];
  lead_types: string[];
  technologies: string[];
};

export type GoalsDefaults = {
  company_age_min: number | null;
  company_headcount_min: number | null;
  industries: string[];
  sales_roles: string[];
  commitment: string[];
  benefits: string[];
  compensation_types: string[];
  minimum_compensation: number | null;
};

export function ProfileEditForm({
  action,
  profile,
  goals,
  formId,
}: {
  action: (fd: FormData) => void;
  profile: ProfileDefaults;
  goals: GoalsDefaults;
  formId?: string;
}) {
  return (
    <form id={formId} action={action} className="space-y-6">
      {/* ============================================================
          Section 1 — Profile (public-facing)
         ============================================================ */}
      <SectionCard
        step={1}
        title="Profile"
        subtitle="What hiring companies see first."
      >
        <div>
          <label htmlFor="headline" className="block text-sm font-medium mb-1">
            Headline
          </label>
          <input
            id="headline"
            name="headline"
            type="text"
            maxLength={140}
            defaultValue={profile.headline}
            placeholder="Closer with 7 years SaaS experience — $1.2M ARR closed last year"
            className={inputCls}
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
            rows={5}
            maxLength={2000}
            defaultValue={profile.about}
            placeholder="What makes you effective? Include specific results if you can."
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="video_url" className="block text-sm font-medium mb-1">
            Intro video link (optional)
          </label>
          <input
            id="video_url"
            name="video_url"
            type="url"
            maxLength={500}
            defaultValue={profile.video_url}
            placeholder="https://www.loom.com/share/…"
            className={inputCls}
          />
          <p className="text-xs text-light-grey mt-1">
            Loom, YouTube, Vimeo — anywhere hiring companies can watch a 60–90
            second intro.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label htmlFor="city" className="block text-sm font-medium mb-1">
              City
            </label>
            <input
              id="city"
              name="city"
              type="text"
              maxLength={100}
              defaultValue={profile.city}
              placeholder="e.g. Austin"
              className={inputCls}
            />
          </div>
          <SearchSelect
            name="state_region"
            label="State / Region"
            options={STATES}
            defaultValue={profile.state_region}
            placeholder="Select…"
          />
          <SearchSelect
            name="country"
            label="Country"
            options={COUNTRIES}
            defaultValue={profile.country}
            placeholder="Select…"
          />
        </div>

        {/* Contact block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="contact_email"
              className="block text-sm font-medium mb-1"
            >
              Contact email
            </label>
            <input
              id="contact_email"
              name="contact_email"
              type="email"
              maxLength={200}
              defaultValue={profile.contact_email}
              placeholder="you@example.com"
              className={inputCls}
            />
            <p className="text-xs text-light-grey mt-1">
              Where we send platform notifications. Also shared with hiring
              managers once you accept an invitation.
            </p>
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              maxLength={50}
              defaultValue={profile.phone}
              placeholder="+1 (555) 555-0100"
              className={inputCls}
            />
            <p className="text-xs text-light-grey mt-1">
              Optional. Used for SMS notifications when you enable that
              channel. Same visibility rules as email.
            </p>
          </div>
        </div>

        <fieldset>
          <legend className="block text-sm font-medium mb-2">Visibility</legend>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="public"
                defaultChecked={profile.visibility === "public"}
              />
              Public — hiring companies can find me
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="hidden"
                defaultChecked={profile.visibility === "hidden"}
              />
              Hidden — I&apos;m not looking right now
            </label>
          </div>
        </fieldset>
      </SectionCard>

      {/* ============================================================
          Section 2 — Experience
         ============================================================ */}
      <SectionCard
        step={2}
        title="Your sales experience"
        subtitle="These get matched against every listing's requirements."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="years_of_experience"
              className="block text-sm font-medium mb-1"
            >
              Total years of sales experience
            </label>
            <input
              id="years_of_experience"
              name="years_of_experience"
              type="number"
              min={0}
              max={60}
              defaultValue={profile.years_of_experience ?? ""}
              className={inputCls}
            />
          </div>
          <div>
            <label
              htmlFor="education"
              className="block text-sm font-medium mb-1"
            >
              Highest education
            </label>
            <select
              id="education"
              name="education"
              defaultValue={profile.education ?? ""}
              className={inputCls}
            >
              <option value="">—</option>
              {EDUCATION_LEVELS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="skills" className="block text-sm font-medium mb-1">
            Skills
          </label>
          <textarea
            id="skills"
            name="skills"
            rows={3}
            maxLength={2000}
            defaultValue={profile.skills}
            placeholder="B2B sales, cold outreach, discovery, negotiation, MEDDIC, forecasting, closing, account expansion, objection handling…"
            className={inputCls}
          />
          <p className="text-xs text-light-grey mt-1">
            Comma-separated list of your sales skills. Show up in search.
          </p>
        </div>

        <ChipMulti
          name="specialties"
          label="Roles you specialize in"
          options={SALES_ROLES}
          defaultSelected={profile.specialties}
        />
        <ChipMulti
          name="sales_types"
          label="Types of selling you do"
          options={SALES_TYPES}
          defaultSelected={profile.sales_types}
        />
        <ChipMulti
          name="decision_makers"
          label="Who you sell to"
          options={DECISION_MAKERS}
          defaultSelected={profile.decision_makers}
        />
        <ChipMulti
          name="sales_environments"
          label="How you sell"
          options={SALES_ENVIRONMENTS}
          defaultSelected={profile.sales_environments}
        />
        <ChipMulti
          name="sales_cycles"
          label="Sales cycles you've worked"
          options={SALES_CYCLES}
          defaultSelected={profile.sales_cycles}
        />
        <ChipMulti
          name="deal_amounts"
          label="Typical deal sizes you close"
          options={DEAL_AMOUNTS}
          defaultSelected={profile.deal_amounts}
        />
        <ChipMulti
          name="sales_volumes"
          label="Annual sales volumes you've done"
          options={SALES_VOLUMES}
          defaultSelected={profile.sales_volumes}
        />
        <ChipMulti
          name="lead_types"
          label="Lead types you work best with"
          options={LEAD_TYPES}
          defaultSelected={profile.lead_types}
        />
        <ChipMulti
          name="technologies"
          label="Tools you know"
          options={TECHNOLOGIES}
          defaultSelected={profile.technologies}
        />
        <SearchMulti
          name="industry_slugs"
          label="Industries you've sold in"
          options={INDUSTRIES}
          defaultSelected={profile.industry_slugs}
          placeholder="Search 68 industries — e.g., SaaS, healthcare…"
        />
      </SectionCard>

      {/* ============================================================
          Section 3 — Goals
         ============================================================ */}
      <SectionCard
        step={3}
        title="What you want next"
        subtitle="Listings are also scored against your goals — comp, commitment, benefits, company size."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="minimum_compensation"
              className="block text-sm font-medium mb-1"
            >
              Minimum compensation (USD/year)
            </label>
            <input
              id="minimum_compensation"
              name="minimum_compensation"
              type="number"
              min={0}
              max={5_000_000}
              defaultValue={goals.minimum_compensation ?? ""}
              className={inputCls}
            />
          </div>
          <div>
            <label
              htmlFor="company_headcount_min"
              className="block text-sm font-medium mb-1"
            >
              Minimum company size (headcount)
            </label>
            <input
              id="company_headcount_min"
              name="company_headcount_min"
              type="number"
              min={0}
              max={100_000}
              defaultValue={goals.company_headcount_min ?? ""}
              placeholder="Leave blank for no minimum"
              className={inputCls}
            />
          </div>
          <div>
            <label
              htmlFor="company_age_min"
              className="block text-sm font-medium mb-1"
            >
              Minimum company age (years)
            </label>
            <input
              id="company_age_min"
              name="company_age_min"
              type="number"
              min={0}
              max={200}
              defaultValue={goals.company_age_min ?? ""}
              placeholder="Leave blank for no minimum"
              className={inputCls}
            />
          </div>
        </div>

        <ChipMulti
          name="goal_sales_roles"
          label="Roles you want next"
          options={SALES_ROLES}
          defaultSelected={goals.sales_roles}
        />
        <ChipMulti
          name="goal_commitment"
          label="Commitment you'll take"
          options={COMMITMENTS}
          defaultSelected={goals.commitment}
        />
        <ChipMulti
          name="goal_compensation_types"
          label="Compensation structures you'll accept"
          options={COMPENSATION_TYPES}
          defaultSelected={goals.compensation_types}
        />
        <ChipMulti
          name="goal_benefits"
          label="Benefits you want"
          options={BENEFITS}
          defaultSelected={goals.benefits}
        />
        <SearchMulti
          name="goal_industries"
          label="Industries you'd love to sell in"
          options={INDUSTRIES}
          defaultSelected={goals.industries}
          placeholder="Search 68 industries…"
        />
      </SectionCard>

    </form>
  );
}

/**
 * Renders the Save + Cancel row for the profile form. Lives outside
 * the <form> element (associated via HTML5's `form` attribute) so it
 * can visually sit below the resume upload section.
 */
export function ProfileSaveBar({ formId }: { formId: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      <button
        type="submit"
        form={formId}
        className="rounded bg-primary text-white px-5 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
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
  );
}

export function SectionCard({
  step,
  title,
  subtitle,
  children,
}: {
  step: number | string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-6 md:p-8">
      <header className="flex items-start gap-3 pb-5 mb-6 border-b border-zinc-100 dark:border-white/[0.04]">
        <div
          aria-hidden="true"
          className="h-9 w-9 shrink-0 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center shadow-sm"
        >
          {step}
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight text-dark-foreground dark:text-white leading-tight">
            {title}
          </h2>
          <p className="text-sm text-light-grey mt-0.5 leading-snug">
            {subtitle}
          </p>
        </div>
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
