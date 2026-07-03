// TypeScript mirrors of Postgres enums declared in
// supabase/migrations/20260526010000_v3_enums.sql.
// Keep values EXACTLY in sync — they're compared server-side.

export type SalesType = "B2B" | "B2C" | "B2G";
export const SALES_TYPES: SalesType[] = ["B2B", "B2C", "B2G"];

export type DecisionMaker = "Small business" | "C-suite" | "Consumer" | "Other";
export const DECISION_MAKERS: DecisionMaker[] = [
  "Small business",
  "C-suite",
  "Consumer",
  "Other",
];

export type SalesEnvironment =
  | "In-person"
  | "Phone"
  | "Zoom / video conference"
  | "Door-to-door"
  | "Other";
export const SALES_ENVIRONMENTS: SalesEnvironment[] = [
  "In-person",
  "Phone",
  "Zoom / video conference",
  "Door-to-door",
  "Other",
];

export type DealAmount =
  | "$0 - $5000"
  | "$5000 - $20,000"
  | "$20,000 - $50,000"
  | "$50,000 - $100,000"
  | "$100,000 - $500,000"
  | "$500,000 - $1M"
  | "$1M+";
export const DEAL_AMOUNTS: DealAmount[] = [
  "$0 - $5000",
  "$5000 - $20,000",
  "$20,000 - $50,000",
  "$50,000 - $100,000",
  "$100,000 - $500,000",
  "$500,000 - $1M",
  "$1M+",
];

export type LeadType = "Inbound" | "Outbound";
export const LEAD_TYPES: LeadType[] = ["Inbound", "Outbound"];

export function filterToKnown<T extends string>(
  values: string[],
  known: readonly T[],
): T[] {
  const known_set = new Set(known);
  return values.filter((v): v is T => known_set.has(v as T));
}
