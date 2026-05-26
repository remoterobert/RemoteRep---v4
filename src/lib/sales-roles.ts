// Sales role enum values. MUST match the Postgres `sales_role` enum
// declared in supabase/migrations/20260526010000_v3_enums.sql.

export type SalesRole =
  | "Appointment-setter"
  | "SDR"
  | "BDR"
  | "Account executive"
  | "Closer"
  | "Sales management"
  | "Executive"
  | "Other";

export const SALES_ROLES: SalesRole[] = [
  "Appointment-setter",
  "SDR",
  "BDR",
  "Account executive",
  "Closer",
  "Sales management",
  "Executive",
  "Other",
];

export function isSalesRole(value: unknown): value is SalesRole {
  return typeof value === "string" && SALES_ROLES.includes(value as SalesRole);
}
