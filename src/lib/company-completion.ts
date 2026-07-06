// Company profile completion — mirror of profile-completion.ts but for
// hiring tenants (client_profiles).

export type ClientProfileForCompletion = {
  about?: string | null;
  logo_url?: string | null;
  website_url?: string | null;
  industry_slug?: string | null;
  headcount?: number | null;
  founded_year?: number | null;
  hiring_pitch?: string | null;
  visibility?: string | null;
};

type Input = ClientProfileForCompletion & {
  tenant_name: string;
  hiring_intent_count: number;
};

export type CompletionField = {
  key: string;
  label: string;
  done: boolean;
  weight: number;
};

export type Suggestion = {
  text: string;
  impactPct: number;
};

export type CompletionResult = {
  percent: number;
  completedCount: number;
  totalFields: number;
  fields: CompletionField[];
  suggestions: Suggestion[];
};

// Order = priority for suggestions. Weights sum to 100.
const FIELDS = [
  {
    key: "company_name",
    label: "Company name",
    weight: 5,
    suggestion:
      "Set a real company name in your tenant settings — placeholder shows to candidates.",
    isDone: (p: Input) =>
      Boolean(
        p.tenant_name && p.tenant_name.trim().length > 0 && p.tenant_name.trim() !== "tenant",
      ),
  },
  {
    key: "about",
    label: "About the company",
    weight: 15,
    suggestion:
      "Write a 2-3 sentence About. Candidates skip companies with no context — this is the biggest single lift.",
    isDone: (p: Input) => Boolean(p.about && p.about.trim().length > 20),
  },
  {
    key: "hiring_pitch",
    label: "Hiring pitch",
    weight: 15,
    suggestion:
      "Add a hiring pitch — why should a top rep join YOUR team? Boosts invite acceptance rate.",
    isDone: (p: Input) =>
      Boolean(p.hiring_pitch && p.hiring_pitch.trim().length > 20),
  },
  {
    key: "industry_slug",
    label: "Industry",
    weight: 10,
    suggestion: "Pick your industry — used for matching and shown on cards.",
    isDone: (p: Input) => Boolean(p.industry_slug && p.industry_slug.length > 0),
  },
  {
    key: "headcount",
    label: "Company size",
    weight: 10,
    suggestion:
      "Fill in your company size (headcount). Reps filter for early-stage vs enterprise.",
    isDone: (p: Input) => p.headcount != null && p.headcount > 0,
  },
  {
    key: "website_url",
    label: "Website",
    weight: 10,
    suggestion:
      "Link your website. Reps click through to validate before responding.",
    isDone: (p: Input) => Boolean(p.website_url && p.website_url.length > 0),
  },
  {
    key: "hiring_intent",
    label: "At least one hiring role",
    weight: 10,
    suggestion:
      "Add at least one role you're hiring for — otherwise no candidates get filtered in.",
    isDone: (p: Input) => p.hiring_intent_count > 0,
  },
  {
    key: "logo_url",
    label: "Logo",
    weight: 10,
    suggestion:
      "Upload a company logo. Cards with logos get significantly more click-through.",
    isDone: (p: Input) => Boolean(p.logo_url && p.logo_url.length > 0),
  },
  {
    key: "visibility",
    label: "Set visibility to public",
    weight: 10,
    suggestion:
      "Make your company profile public so candidates can find you when they search.",
    isDone: (p: Input) => p.visibility === "public",
  },
  {
    key: "founded_year",
    label: "Founded year",
    weight: 5,
    suggestion:
      "Add your founded year. Signals maturity to candidates evaluating startup risk.",
    isDone: (p: Input) => p.founded_year != null && p.founded_year > 0,
  },
];

export function computeCompanyCompletion(
  input: Input,
): CompletionResult {
  let earned = 0;
  const fields: CompletionField[] = [];
  const missing: { text: string; impactPct: number }[] = [];

  for (const f of FIELDS) {
    const done = f.isDone(input);
    if (done) earned += f.weight;
    fields.push({ key: f.key, label: f.label, done, weight: f.weight });
    if (!done) missing.push({ text: f.suggestion, impactPct: f.weight });
  }

  return {
    percent: Math.round(earned),
    completedCount: fields.filter((f) => f.done).length,
    totalFields: fields.length,
    fields,
    suggestions: missing.slice(0, 5),
  };
}
