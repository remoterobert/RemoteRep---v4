// ============================================================
// Match-scoring engine
//
// Two independent scores per (candidate, listing) pair:
//
//   Experience match — "how qualified is the candidate for this role?"
//     Compares candidate's experience arrays vs listing's requirements.
//
//   Goals match — "how well does this role align with what the candidate
//                 says they want next?" Compares listing's details/tenant
//                 vs candidate's goals.
//
// Each returns a percentage (0-100) and a per-criterion breakdown so the
// UI can color-code chips green/yellow/red.
// ============================================================

export type MatchStatus = "match" | "partial" | "miss" | "not_required";

export type MatchCriterion = {
  key: string;
  label: string;
  status: MatchStatus;
  // Optional short human-readable detail, e.g. "2 of 3 matched".
  detail?: string;
};

export type MatchResult = {
  score: number; // 0-100 percentage. 0 if nothing scored.
  scored: number; // How many criteria were graded.
  criteria: MatchCriterion[];
};

// ============================================================
// Inputs — kept loose so callers can pass any subset that exists.
// ============================================================

export type CandidateForMatch = {
  years_of_experience?: number | null;
  education?: string | null;
  specialties?: string[] | null; // candidate_specialties.sales_role[]
  sales_types?: string[] | null;
  decision_makers?: string[] | null;
  sales_environments?: string[] | null;
  sales_cycles?: string[] | null;
  deal_amounts?: string[] | null;
  sales_volumes?: string[] | null;
  lead_types?: string[] | null;
  technologies?: string[] | null;
  industry_slugs?: string[] | null;
};

export type CandidateGoals = {
  minimum_compensation?: number | null;
  company_age_max?: number | null;
  company_headcount_max?: number | null;
  industries?: string[] | null;
  sales_roles?: string[] | null;
  commitment?: string[] | null;
  benefits?: string[] | null;
  compensation_types?: string[] | null;
};

export type ListingForMatch = {
  details?: {
    sales_role?: string | null;
    commitment?: string[] | null;
    compensation_type?: string[] | null;
    minimum_compensation?: number | null;
    benefits?: string[] | null;
  } | null;
  requirements?: {
    years_of_experience_min?: number | null;
    education?: string[] | null;
    industries?: string[] | null;
    sales_roles?: string[] | null;
    sales_types?: string[] | null;
    decision_makers?: string[] | null;
    sales_environments?: string[] | null;
    sales_cycles?: string[] | null;
    deal_amounts?: string[] | null;
    sales_volumes?: string[] | null;
    lead_types?: string[] | null;
    technologies?: string[] | null;
  } | null;
  tenant?: {
    founded_year?: number | null;
    headcount?: number | null;
    industry_slug?: string | null;
  } | null;
};

// ============================================================
// Helpers
// ============================================================

const EDUCATION_ORDER = [
  "High school",
  "Some college",
  "Associate degree",
  "Bachelor's degree",
  "Master's degree",
  "Doctorate",
] as const;

function educationRank(level: string | null | undefined): number {
  if (!level) return -1;
  return EDUCATION_ORDER.indexOf(level as (typeof EDUCATION_ORDER)[number]);
}

/**
 * Compare a candidate's array of experience values against a listing's
 * required array. Returns match if candidate covers 100% of what's required,
 * partial if there's *some* overlap, miss otherwise. If the listing
 * required is empty/null, returns "not_required" — we don't grade it.
 */
function overlapStatus(
  candidateValues: string[] | null | undefined,
  requiredValues: string[] | null | undefined,
): { status: MatchStatus; detail?: string } {
  if (!requiredValues || requiredValues.length === 0) {
    return { status: "not_required" };
  }
  const cSet = new Set(candidateValues ?? []);
  const hits = requiredValues.filter((v) => cSet.has(v)).length;
  if (hits === 0) {
    return { status: "miss", detail: `0 of ${requiredValues.length}` };
  }
  if (hits === requiredValues.length) {
    return { status: "match", detail: `${hits} of ${requiredValues.length}` };
  }
  return { status: "partial", detail: `${hits} of ${requiredValues.length}` };
}

/**
 * Same as overlapStatus but for cases where ANY overlap is a full match —
 * used when the listing's array represents "acceptable options" rather
 * than "all required." Applies to `sales_roles` on requirements (the
 * candidate needs experience in AT LEAST ONE of these roles, not all).
 */
function overlapAny(
  candidateValues: string[] | null | undefined,
  acceptableValues: string[] | null | undefined,
): { status: MatchStatus; detail?: string } {
  if (!acceptableValues || acceptableValues.length === 0) {
    return { status: "not_required" };
  }
  const cSet = new Set(candidateValues ?? []);
  const hits = acceptableValues.filter((v) => cSet.has(v)).length;
  if (hits === 0) {
    return { status: "miss", detail: "no overlap" };
  }
  return { status: "match", detail: `${hits} matched` };
}

// Weight per criterion. Sales role and years get more weight because
// they're the most load-bearing signals.
const WEIGHTS: Record<string, number> = {
  sales_role: 2,
  years_of_experience: 1.5,
  education: 1,
  industries: 1,
  sales_roles: 1,
  sales_types: 1,
  decision_makers: 1,
  sales_environments: 1,
  sales_cycles: 1,
  deal_amounts: 1,
  sales_volumes: 1,
  lead_types: 1,
  technologies: 1,
  // Goals side
  minimum_compensation: 2,
  commitment: 1.5,
  compensation_types: 1.5,
  benefits: 1,
  goal_industries: 1,
  goal_sales_roles: 1.5,
  company_headcount_max: 1,
  company_age_max: 1,
};

function statusValue(status: MatchStatus): number {
  switch (status) {
    case "match":
      return 1;
    case "partial":
      return 0.5;
    case "miss":
      return 0;
    case "not_required":
      return 0;
  }
}

/**
 * Weighted percentage: sum(weight * statusValue) / sum(weight) among the
 * criteria we actually scored (i.e. skip not_required). Returns a
 * whole-number percentage 0-100.
 */
function computePercent(criteria: MatchCriterion[]): {
  score: number;
  scored: number;
} {
  const scored = criteria.filter((c) => c.status !== "not_required");
  if (scored.length === 0) return { score: 0, scored: 0 };
  let weightedSum = 0;
  let totalWeight = 0;
  for (const c of scored) {
    const w = WEIGHTS[c.key] ?? 1;
    weightedSum += w * statusValue(c.status);
    totalWeight += w;
  }
  const pct = totalWeight === 0 ? 0 : (weightedSum / totalWeight) * 100;
  return { score: Math.round(pct), scored: scored.length };
}

// ============================================================
// EXPERIENCE MATCH — does the candidate meet the listing's requirements?
// ============================================================

export function computeExperienceMatch(
  candidate: CandidateForMatch,
  listing: ListingForMatch,
): MatchResult {
  const req = listing.requirements ?? {};
  const details = listing.details ?? {};
  const criteria: MatchCriterion[] = [];

  // Sales role (specialty match): does the candidate specialize in the
  // primary sales_role the listing is hiring for?
  if (details.sales_role) {
    const inSpecialties =
      candidate.specialties?.includes(details.sales_role) ?? false;
    criteria.push({
      key: "sales_role",
      label: "Sales role",
      status: inSpecialties ? "match" : "miss",
      detail: details.sales_role,
    });
  } else {
    criteria.push({
      key: "sales_role",
      label: "Sales role",
      status: "not_required",
    });
  }

  // Years of experience: candidate ≥ requirement (green); within 1 (yellow);
  // otherwise red.
  const yMin = req.years_of_experience_min ?? 0;
  const candYears = candidate.years_of_experience ?? 0;
  if (yMin > 0) {
    let status: MatchStatus;
    if (candYears >= yMin) status = "match";
    else if (yMin - candYears <= 1) status = "partial";
    else status = "miss";
    criteria.push({
      key: "years_of_experience",
      label: "Years of experience",
      status,
      detail: `${candYears} yrs (needs ${yMin}+)`,
    });
  } else {
    criteria.push({
      key: "years_of_experience",
      label: "Years of experience",
      status: "not_required",
    });
  }

  // Education: candidate at or above the highest of the acceptable list.
  // (Yes higher is fine — Master's satisfies a "Bachelor's" bar.)
  if (req.education && req.education.length > 0) {
    const candRank = educationRank(candidate.education ?? null);
    const minAcceptedRank = Math.min(
      ...req.education.map((e) => educationRank(e)),
    );
    const status: MatchStatus =
      candRank >= 0 && candRank >= minAcceptedRank ? "match" : "miss";
    criteria.push({
      key: "education",
      label: "Education",
      status,
      detail: candidate.education ?? "not set",
    });
  } else {
    criteria.push({
      key: "education",
      label: "Education",
      status: "not_required",
    });
  }

  // Overlap facets
  criteria.push({
    key: "industries",
    label: "Industries",
    ...overlapStatus(candidate.industry_slugs, req.industries),
  });
  criteria.push({
    key: "sales_roles",
    label: "Prior sales roles",
    ...overlapAny(candidate.specialties, req.sales_roles),
  });
  criteria.push({
    key: "sales_types",
    label: "Sales types",
    ...overlapStatus(candidate.sales_types, req.sales_types),
  });
  criteria.push({
    key: "decision_makers",
    label: "Decision-makers",
    ...overlapStatus(candidate.decision_makers, req.decision_makers),
  });
  criteria.push({
    key: "sales_environments",
    label: "Sales environments",
    ...overlapStatus(candidate.sales_environments, req.sales_environments),
  });
  criteria.push({
    key: "sales_cycles",
    label: "Sales cycles",
    ...overlapStatus(candidate.sales_cycles, req.sales_cycles),
  });
  criteria.push({
    key: "deal_amounts",
    label: "Deal amounts",
    ...overlapStatus(candidate.deal_amounts, req.deal_amounts),
  });
  criteria.push({
    key: "sales_volumes",
    label: "Annual volumes",
    ...overlapStatus(candidate.sales_volumes, req.sales_volumes),
  });
  criteria.push({
    key: "lead_types",
    label: "Lead types",
    ...overlapStatus(candidate.lead_types, req.lead_types),
  });
  criteria.push({
    key: "technologies",
    label: "Tools",
    ...overlapStatus(candidate.technologies, req.technologies),
  });

  const { score, scored } = computePercent(criteria);
  return { score, scored, criteria };
}

// ============================================================
// GOALS MATCH — does this listing satisfy the candidate's goals?
// ============================================================

export function computeGoalsMatch(
  goals: CandidateGoals | null | undefined,
  listing: ListingForMatch,
): MatchResult {
  const g = goals ?? {};
  const details = listing.details ?? {};
  const tenant = listing.tenant ?? {};
  const criteria: MatchCriterion[] = [];

  // Minimum compensation: listing's min_comp must meet candidate's goal.
  if (g.minimum_compensation != null && g.minimum_compensation > 0) {
    if (
      details.minimum_compensation != null &&
      details.minimum_compensation >= g.minimum_compensation
    ) {
      criteria.push({
        key: "minimum_compensation",
        label: "Minimum compensation",
        status: "match",
        detail: `$${details.minimum_compensation.toLocaleString()} ≥ $${g.minimum_compensation.toLocaleString()}`,
      });
    } else if (details.minimum_compensation == null) {
      criteria.push({
        key: "minimum_compensation",
        label: "Minimum compensation",
        status: "partial",
        detail: "not listed — ask them",
      });
    } else {
      criteria.push({
        key: "minimum_compensation",
        label: "Minimum compensation",
        status: "miss",
        detail: `$${details.minimum_compensation.toLocaleString()} < your $${g.minimum_compensation.toLocaleString()}`,
      });
    }
  } else {
    criteria.push({
      key: "minimum_compensation",
      label: "Minimum compensation",
      status: "not_required",
    });
  }

  // Commitment: listing must offer at least one commitment mode the candidate accepts.
  criteria.push({
    key: "commitment",
    label: "Commitment",
    ...overlapAny(details.commitment, g.commitment),
  });

  // Compensation type: same overlap logic.
  criteria.push({
    key: "compensation_types",
    label: "Compensation type",
    ...overlapAny(details.compensation_type, g.compensation_types),
  });

  // Benefits: candidate wants these; listing offers these. Every want should be offered → match; some → partial; none → miss.
  criteria.push({
    key: "benefits",
    label: "Benefits",
    ...overlapStatus(details.benefits, g.benefits),
  });

  // Industries the candidate wants: does the tenant's industry match?
  if (g.industries && g.industries.length > 0) {
    if (tenant.industry_slug && g.industries.includes(tenant.industry_slug)) {
      criteria.push({
        key: "goal_industries",
        label: "Company industry",
        status: "match",
        detail: tenant.industry_slug,
      });
    } else {
      criteria.push({
        key: "goal_industries",
        label: "Company industry",
        status: "miss",
        detail: tenant.industry_slug ?? "not listed",
      });
    }
  } else {
    criteria.push({
      key: "goal_industries",
      label: "Company industry",
      status: "not_required",
    });
  }

  // Sales role: candidate wants any of these; listing offers primary role.
  if (g.sales_roles && g.sales_roles.length > 0) {
    if (details.sales_role && g.sales_roles.includes(details.sales_role)) {
      criteria.push({
        key: "goal_sales_roles",
        label: "Role type",
        status: "match",
        detail: details.sales_role,
      });
    } else {
      criteria.push({
        key: "goal_sales_roles",
        label: "Role type",
        status: "miss",
        detail: details.sales_role ?? "not listed",
      });
    }
  } else {
    criteria.push({
      key: "goal_sales_roles",
      label: "Role type",
      status: "not_required",
    });
  }

  // Company size cap: tenant.headcount ≤ candidate's max.
  if (g.company_headcount_max != null && g.company_headcount_max > 0) {
    if (tenant.headcount == null) {
      criteria.push({
        key: "company_headcount_max",
        label: "Company size",
        status: "partial",
        detail: "not listed",
      });
    } else if (tenant.headcount <= g.company_headcount_max) {
      criteria.push({
        key: "company_headcount_max",
        label: "Company size",
        status: "match",
        detail: `${tenant.headcount} ≤ ${g.company_headcount_max}`,
      });
    } else {
      criteria.push({
        key: "company_headcount_max",
        label: "Company size",
        status: "miss",
        detail: `${tenant.headcount} > your ${g.company_headcount_max}`,
      });
    }
  } else {
    criteria.push({
      key: "company_headcount_max",
      label: "Company size",
      status: "not_required",
    });
  }

  // Company age cap: (thisYear - founded_year) ≤ candidate's max.
  if (g.company_age_max != null && g.company_age_max > 0) {
    if (tenant.founded_year == null) {
      criteria.push({
        key: "company_age_max",
        label: "Company age",
        status: "partial",
        detail: "not listed",
      });
    } else {
      const age = new Date().getFullYear() - tenant.founded_year;
      const status: MatchStatus =
        age <= g.company_age_max ? "match" : "miss";
      criteria.push({
        key: "company_age_max",
        label: "Company age",
        status,
        detail: `${age} yrs old (max ${g.company_age_max})`,
      });
    }
  } else {
    criteria.push({
      key: "company_age_max",
      label: "Company age",
      status: "not_required",
    });
  }

  const { score, scored } = computePercent(criteria);
  return { score, scored, criteria };
}

// ============================================================
// UI helpers — mapping status → color class + label.
// ============================================================

export const STATUS_COLOR: Record<MatchStatus, string> = {
  match: "bg-success/15 text-success ring-1 ring-success/30",
  partial: "bg-warning/15 text-warning ring-1 ring-warning/30",
  miss: "bg-danger/15 text-danger ring-1 ring-danger/30",
  not_required: "bg-zinc-100 dark:bg-white/[0.06] text-light-grey",
};

export const STATUS_LABEL: Record<MatchStatus, string> = {
  match: "Match",
  partial: "Partial",
  miss: "Miss",
  not_required: "Not required",
};

/**
 * Get a color tone based on percentage — used for the top-level match
 * badges so 80%+ reads green, 40-79% yellow, <40% red.
 */
export function scoreColor(score: number): string {
  if (score >= 80) return STATUS_COLOR.match;
  if (score >= 40) return STATUS_COLOR.partial;
  return STATUS_COLOR.miss;
}
