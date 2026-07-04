"use client";

import { useState } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { ChipMulti } from "@/components/forms/ChipMulti";
import { SearchMulti } from "@/components/forms/SearchMulti";
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
  LISTING_STYLES,
  type ListingStyle,
} from "@/lib/listings/options";

const STYLE_LABELS: Record<ListingStyle, { label: string; hint: string }> = {
  default: {
    label: "Default",
    hint: "Polished, neutral, professional — safe default.",
  },
  repel: {
    label: "Repel",
    hint: 'Bold "not for everyone" language. Filters mismatches.',
  },
  inclusive: {
    label: "Inclusive",
    hint: "Warm, welcoming, low-barrier. Encourages more applicants.",
  },
};

const inputCls =
  "w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm";

export function NewListingForm({
  action,
  companyName,
}: {
  action: (fd: FormData) => void;
  companyName: string;
}) {
  const [description, setDescription] = useState("");

  // AI panel state
  const [aiOpen, setAiOpen] = useState(false);
  const [style, setStyle] = useState<ListingStyle>("default");
  const [brief, setBrief] = useState({
    title: "",
    salesRole: "" as (typeof SALES_ROLES)[number] | "",
    commitment: "" as (typeof COMMITMENTS)[number] | "",
    compensation: "",
    sellingPoints: "",
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function generate() {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/write-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style,
          company: companyName,
          title: brief.title,
          salesRole: brief.salesRole,
          commitment: brief.commitment,
          compensation: brief.compensation,
          sellingPoints: brief.sellingPoints,
        }),
      });
      const json = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) {
        setAiError(json.error ?? `HTTP ${res.status}`);
        return;
      }
      if (json.text) {
        setDescription(json.text);
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <form action={action} className="space-y-6">
      {/* ============================================================
          Section 1 — Basics + AI writer
         ============================================================ */}
      <SectionCard
        step={1}
        title="Basics"
        subtitle="Title + description. Draft with AI or write your own."
      >

        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Job title <span className="text-danger">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            minLength={10}
            maxLength={80}
            required
            placeholder="Senior Account Executive — SaaS mid-market"
            className={inputCls}
          />
          <p className="text-xs text-light-grey mt-1">10–80 characters.</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="description"
              className="block text-sm font-medium"
            >
              Description <span className="text-danger">*</span>
            </label>
            <button
              type="button"
              onClick={() => setAiOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:opacity-80 font-medium"
            >
              <SparklesIcon className="h-4 w-4" />
              {aiOpen ? "Hide AI writer" : "Draft with AI"}
            </button>
          </div>

          {/* AI panel */}
          {aiOpen && (
            <div className="mb-3 rounded-lg border border-primary/30 bg-primary/[0.04] p-4 space-y-3">
              <div>
                <div className="text-xs font-semibold text-light-grey uppercase tracking-wider mb-2">
                  Style
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {LISTING_STYLES.map((s) => {
                    const meta = STYLE_LABELS[s];
                    const active = style === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStyle(s)}
                        className={`text-left rounded-md border p-2.5 transition-colors ${
                          active
                            ? "border-primary bg-primary/10"
                            : "border-zinc-300 dark:border-zinc-700 hover:border-primary/50"
                        }`}
                      >
                        <div className="text-sm font-semibold">{meta.label}</div>
                        <div className="text-[11px] text-light-grey leading-snug mt-0.5">
                          {meta.hint}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Draft title (optional)
                  </label>
                  <input
                    type="text"
                    value={brief.title}
                    onChange={(e) =>
                      setBrief((b) => ({ ...b, title: e.target.value }))
                    }
                    placeholder="If blank, the AI uses the title above."
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Compensation (optional)
                  </label>
                  <input
                    type="text"
                    value={brief.compensation}
                    onChange={(e) =>
                      setBrief((b) => ({ ...b, compensation: e.target.value }))
                    }
                    placeholder="e.g. $75k base + uncapped, $150k OTE"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Sales role
                  </label>
                  <select
                    value={brief.salesRole}
                    onChange={(e) =>
                      setBrief((b) => ({
                        ...b,
                        salesRole: e.target
                          .value as (typeof SALES_ROLES)[number],
                      }))
                    }
                    className={inputCls}
                  >
                    <option value="">—</option>
                    {SALES_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Commitment
                  </label>
                  <select
                    value={brief.commitment}
                    onChange={(e) =>
                      setBrief((b) => ({
                        ...b,
                        commitment: e.target
                          .value as (typeof COMMITMENTS)[number],
                      }))
                    }
                    className={inputCls}
                  >
                    <option value="">—</option>
                    {COMMITMENTS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Selling points (what makes this role great?)
                </label>
                <textarea
                  rows={3}
                  value={brief.sellingPoints}
                  onChange={(e) =>
                    setBrief((b) => ({ ...b, sellingPoints: e.target.value }))
                  }
                  placeholder="Warm inbound leads. Founder-led. Series B, 40% YoY. Sell to CROs at $10M+ SaaS. Nobody on the team has churned in 18 months."
                  className={inputCls}
                />
              </div>

              {aiError && (
                <div className="rounded border border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-900 p-2 text-xs text-red-800 dark:text-red-200">
                  {aiError}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={generate}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-1.5 rounded bg-primary text-white px-4 py-1.5 text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  <SparklesIcon className="h-3.5 w-3.5" />
                  {aiLoading
                    ? "Drafting…"
                    : description
                      ? "Regenerate"
                      : "Draft description"}
                </button>
                <span className="text-[11px] text-light-grey">
                  Nothing saves until you click Publish below.
                </span>
              </div>
            </div>
          )}

          <textarea
            id="description"
            name="description"
            rows={12}
            minLength={100}
            maxLength={5000}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the role. Who you sell to, what the day looks like, what a great rep at your company hits in the first 90 days."
            className={inputCls}
          />
          <p className="text-xs text-light-grey mt-1">
            {description.length} / 5000 characters — minimum 100.
          </p>
        </div>
      </SectionCard>

      {/* ============================================================
          Section 2 — Application instructions
         ============================================================ */}
      <SectionCard
        step={2}
        title="Application instructions"
        subtitle="How reps should apply. Optional — if blank, they just say “I'm interested.”"
      >

        <div>
          <label
            htmlFor="instructions"
            className="block text-sm font-medium mb-1"
          >
            Instructions for applicants (optional)
          </label>
          <textarea
            id="instructions"
            name="instructions"
            rows={4}
            minLength={100}
            maxLength={5000}
            placeholder="How should candidates apply? Anything they should include? If blank, they just say 'I'm interested.'"
            className={inputCls}
          />
          <p className="text-xs text-light-grey mt-1">
            If provided, must be 100–5000 characters.
          </p>
        </div>

        <div>
          <label
            htmlFor="calendar_link"
            className="block text-sm font-medium mb-1"
          >
            Calendar link (optional)
          </label>
          <input
            id="calendar_link"
            name="calendar_link"
            type="url"
            maxLength={500}
            placeholder="https://calendly.com/your-team/intro"
            className={inputCls}
          />
        </div>
      </SectionCard>

      {/* ============================================================
          Section 3 — Role details
         ============================================================ */}
      <SectionCard
        step={3}
        title="Role details"
        subtitle="Structured facts about the role. These are what reps filter by."
      >

        <div>
          <label
            htmlFor="sales_role"
            className="block text-sm font-medium mb-1"
          >
            Sales role <span className="text-danger">*</span>
          </label>
          <select
            id="sales_role"
            name="sales_role"
            required
            className={inputCls}
          >
            {SALES_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <p className="text-xs text-light-grey mt-1">
            Pick one — the primary role reps will be doing.
          </p>
        </div>

        <ChipMulti
          name="commitment"
          label="Commitment (pick every mode you'd accept)"
          options={COMMITMENTS}
        />

        <ChipMulti
          name="compensation_type"
          label="Compensation type (pick every structure you offer)"
          options={COMPENSATION_TYPES}
        />

        <div>
          <label
            htmlFor="minimum_compensation"
            className="block text-sm font-medium mb-1"
          >
            Minimum compensation (USD, optional)
          </label>
          <input
            id="minimum_compensation"
            name="minimum_compensation"
            type="number"
            min={0}
            max={1000000}
            className={inputCls}
          />
          <p className="text-xs text-light-grey mt-1">
            The number reps use for filtering. Fill in extra detail below.
          </p>
        </div>

        <div>
          <label
            htmlFor="compensation_details"
            className="block text-sm font-medium mb-1"
          >
            Compensation details (optional)
          </label>
          <textarea
            id="compensation_details"
            name="compensation_details"
            rows={3}
            maxLength={2000}
            placeholder="$75k base + uncapped, $150k OTE. 10% new-logo commission, 5% renewal. Quarterly SPIFFs on strategic accounts. $5k signing bonus."
            className={inputCls}
          />
          <p className="text-xs text-light-grey mt-1">
            Everything the structured fields can&apos;t capture — OTE, splits,
            bonuses, SPIFFs.
          </p>
        </div>

        <ChipMulti name="benefits" label="Benefits" options={BENEFITS} />
      </SectionCard>

      {/* ============================================================
          Section 4 — Requirements
         ============================================================ */}
      <SectionCard
        step={4}
        title="What the ideal rep brings"
        subtitle="Optional. These help us rank your listing for reps whose experience overlaps. Leave anything blank you don't care about."
      >

        <div>
          <label
            htmlFor="years_of_experience_min"
            className="block text-sm font-medium mb-1"
          >
            Minimum years of sales experience
          </label>
          <input
            id="years_of_experience_min"
            name="years_of_experience_min"
            type="number"
            min={0}
            max={100}
            defaultValue={0}
            className={inputCls}
          />
        </div>

        <ChipMulti
          name="education"
          label="Education (any acceptable level)"
          options={EDUCATION_LEVELS}
        />
        <ChipMulti
          name="sales_roles"
          label="Sales roles the rep should have done before"
          options={SALES_ROLES}
        />
        <ChipMulti name="sales_types" label="Sales types" options={SALES_TYPES} />
        <ChipMulti
          name="decision_makers"
          label="Decision-makers you sell to"
          options={DECISION_MAKERS}
        />
        <ChipMulti
          name="sales_environments"
          label="Sales environments"
          options={SALES_ENVIRONMENTS}
        />
        <ChipMulti
          name="sales_cycles"
          label="Sales cycles"
          options={SALES_CYCLES}
        />
        <ChipMulti
          name="deal_amounts"
          label="Deal amounts"
          options={DEAL_AMOUNTS}
        />
        <ChipMulti
          name="sales_volumes"
          label="Annual sales volumes"
          options={SALES_VOLUMES}
        />
        <ChipMulti name="lead_types" label="Lead types" options={LEAD_TYPES} />
        <ChipMulti
          name="technologies"
          label="Tools reps should know"
          options={TECHNOLOGIES}
        />
        <SearchMulti
          name="industries"
          label="Industries the rep should have sold in"
          options={INDUSTRIES}
          placeholder="Search 68 industries — e.g., SaaS, healthcare, real estate…"
        />
      </SectionCard>

      {/* ============================================================
          Submit — draft or publish
         ============================================================ */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          name="publish"
          value="1"
          className="rounded bg-primary text-white px-5 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Publish listing
        </button>
        <button
          type="submit"
          name="publish"
          value="0"
          className="rounded border border-zinc-300 dark:border-zinc-700 px-5 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
        >
          Save as draft
        </button>
        <a
          href="/company/listings"
          className="text-sm text-light-grey hover:text-primary transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}

function SectionCard({
  step,
  title,
  subtitle,
  children,
}: {
  step: number;
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
