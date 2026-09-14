"use client";

import {
  SALES_ROLES,
  SALES_TYPES,
  DECISION_MAKERS,
  SALES_ENVIRONMENTS,
  SALES_CYCLES,
  DEAL_AMOUNTS,
  SALES_VOLUMES,
  LEAD_TYPES,
  TECHNOLOGIES,
  INDUSTRIES,
  EDUCATION_LEVELS,
} from "@/lib/listings/options";
import { FacetFilterBar, type Facet } from "@/components/FacetFilterBar";

/**
 * What a hiring team can filter reps by on /candidates.
 *
 * Deliberately mirrors the listing facets reps get on /opportunities — same
 * param names, same bar, same behaviour — so the two sides of the
 * marketplace stay symmetrical. Facets reps have that don't apply to a
 * person (commitment, compensation type, min. pay) are left out; those
 * describe a role, not someone's track record.
 */
const REP_FACETS: readonly Facet[] = [
  { param: "role", label: "Sales role", options: SALES_ROLES, kind: "multi" },
  {
    param: "min_exp",
    label: "Min. experience",
    kind: "numeric",
    placeholder: "3",
    formatChip: (v) => `Min. experience: ${v}+ yrs`,
  },
  { param: "education", label: "Education", options: EDUCATION_LEVELS, kind: "multi" },
  { param: "sales_type", label: "Sales type", options: SALES_TYPES, kind: "multi" },
  { param: "decision_maker", label: "Decision-maker", options: DECISION_MAKERS, kind: "multi" },
  { param: "environment", label: "Environment", options: SALES_ENVIRONMENTS, kind: "multi" },
  { param: "cycle", label: "Sales cycle", options: SALES_CYCLES, kind: "multi" },
  { param: "deal", label: "Deal size", options: DEAL_AMOUNTS, kind: "multi" },
  { param: "volume", label: "Annual volume", options: SALES_VOLUMES, kind: "multi" },
  { param: "lead", label: "Lead type", options: LEAD_TYPES, kind: "multi" },
  { param: "tech", label: "Tools", options: TECHNOLOGIES, kind: "multi" },
  { param: "industry", label: "Industry", options: INDUSTRIES, kind: "multi", searchable: true },
];

export function CandidateFilterPanel({
  showResultsCount,
}: {
  showResultsCount?: number;
}) {
  return (
    <FacetFilterBar
      facets={REP_FACETS}
      showResultsCount={showResultsCount}
      resultNoun="rep"
      // "Clear all" keeps the listing being scored against — that's a
      // comparison target, not a filter.
      preserveParams={["listing"]}
    />
  );
}
