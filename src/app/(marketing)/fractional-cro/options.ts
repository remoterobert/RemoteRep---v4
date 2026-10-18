// Answer choices for the Fractional CRO intake form. Shared by the form (to
// render the selects) and the server action (to validate submissions).

export const LEADERSHIP_YEARS = [
  "Less than 2 years",
  "2–5 years",
  "5–10 years",
  "10+ years",
] as const;

export const TEAM_SIZES = [
  "1–5 reps",
  "6–15 reps",
  "16–50 reps",
  "50+ reps",
] as const;

export const INCOME_RANGES = [
  "Under $100k",
  "$100k–$150k",
  "$150k–$250k",
  "$250k–$400k",
  "$400k+",
] as const;

export const TIMELINES = [
  "Ready now",
  "Within 3 months",
  "3–6 months",
  "Just exploring",
] as const;

export type IntakeState = { error: string | null };
