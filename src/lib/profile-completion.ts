// Computes profile completion % + which sections are done + prioritized
// improvement suggestions. Used by the candidate dashboard's right-side
// wizard and suggestions area.

export type CandidateProfileForCompletion = {
  headline?: string | null;
  about?: string | null;
  visibility?: string | null;
  years_of_experience?: number | null;
  sales_types?: string[] | null;
  decision_makers?: string[] | null;
  sales_environments?: string[] | null;
  deal_amounts?: string[] | null;
  lead_types?: string[] | null;
};

type Input = CandidateProfileForCompletion & {
  specialties: string[];
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

/**
 * Order of fields = order of priority in suggestions.
 * Weights sum to 100.
 */
const FIELDS = [
  {
    key: "headline",
    label: "Add a headline",
    weight: 15,
    suggestion:
      "Add a headline. Profiles with headlines get about 40% more views.",
    isDone: (p: Input) => Boolean(p.headline && p.headline.trim().length > 0),
  },
  {
    key: "about",
    label: "Write an about section",
    weight: 15,
    suggestion:
      'Write a 2-3 sentence "About" — include one specific result (quota %, deal size, etc.). Boosts profile-to-interest conversion.',
    isDone: (p: Input) => Boolean(p.about && p.about.trim().length > 20),
  },
  {
    key: "years_of_experience",
    label: "Set years of experience",
    weight: 10,
    suggestion: "Fill in your years of sales experience — used for matching.",
    isDone: (p: Input) =>
      p.years_of_experience !== null && p.years_of_experience !== undefined,
  },
  {
    key: "specialties",
    label: "Pick specialty roles",
    weight: 10,
    suggestion: "Pick the sales roles you're strongest in — drives what companies show you.",
    isDone: (p: Input) => p.specialties.length > 0,
  },
  {
    key: "sales_types",
    label: "Sales types (B2B/B2C/B2G)",
    weight: 10,
    suggestion:
      "Choose the sales types you handle — B2B, B2C, or B2G. Companies filter by this.",
    isDone: (p: Input) => Boolean(p.sales_types && p.sales_types.length > 0),
  },
  {
    key: "deal_amounts",
    label: "Typical deal sizes",
    weight: 10,
    suggestion:
      "Add your typical deal sizes. Companies looking for enterprise vs. SMB closers need this.",
    isDone: (p: Input) => Boolean(p.deal_amounts && p.deal_amounts.length > 0),
  },
  {
    key: "decision_makers",
    label: "Who you sell to",
    weight: 10,
    suggestion:
      "Add who you sell to (C-suite, small business, consumer). Major matching signal.",
    isDone: (p: Input) =>
      Boolean(p.decision_makers && p.decision_makers.length > 0),
  },
  {
    key: "sales_environments",
    label: "How you sell",
    weight: 10,
    suggestion:
      "Set your sales environments (phone, video, in-person). Companies filter for remote-first candidates.",
    isDone: (p: Input) =>
      Boolean(p.sales_environments && p.sales_environments.length > 0),
  },
  {
    key: "lead_types",
    label: "Lead types (inbound/outbound)",
    weight: 5,
    suggestion:
      "Note whether you're strong at inbound, outbound, or both. Small but useful signal.",
    isDone: (p: Input) => Boolean(p.lead_types && p.lead_types.length > 0),
  },
  {
    key: "visibility",
    label: "Set visibility to public",
    weight: 5,
    suggestion:
      "Set your profile visibility to public. Otherwise no hiring company can see you.",
    isDone: (p: Input) => p.visibility === "public",
  },
];

export function computeProfileCompletion(input: Input | null): CompletionResult {
  const p: Input = input ?? { specialties: [] };
  let earned = 0;
  const fields: CompletionField[] = [];
  const missing: { text: string; impactPct: number }[] = [];

  for (const f of FIELDS) {
    const done = f.isDone(p);
    if (done) earned += f.weight;
    fields.push({ key: f.key, label: f.label, done, weight: f.weight });
    if (!done) {
      missing.push({ text: f.suggestion, impactPct: f.weight });
    }
  }

  return {
    percent: Math.round(earned),
    completedCount: fields.filter((f) => f.done).length,
    totalFields: fields.length,
    fields,
    suggestions: missing.slice(0, 5), // top 5 by weight (natural since order matches)
  };
}
