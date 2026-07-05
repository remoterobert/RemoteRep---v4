// Canonical option sets for listing forms.
// Values here must match the Postgres enums / check constraints in the
// listing_details and listing_requirements migrations.

export const SALES_ROLES = [
  "Appointment-setter",
  "SDR",
  "BDR",
  "Account executive",
  "Closer",
  "Sales management",
  "Executive",
  "Other",
] as const;

export const COMMITMENTS = [
  "Full-time",
  "Part-time",
  "Temporary",
  "Internship",
  "Other",
] as const;

export const BENEFITS = [
  "Health insurance",
  "Dental coverage",
  "Vision coverage",
  "401k",
  "Stock options",
  "None",
] as const;

export const COMPENSATION_TYPES = [
  "Salary",
  "Base + comission",
  "Comission-only",
  "Draw against comission",
  "Hourly",
] as const;

export const EDUCATION_LEVELS = [
  "High school",
  "Some college",
  "Associate degree",
  "Bachelor's degree",
  "Master's degree",
  "Doctorate",
] as const;

export const SALES_TYPES = ["B2B", "B2C", "B2G"] as const;

export const DECISION_MAKERS = [
  "Small business",
  "C-suite",
  "Consumer",
  "Other",
] as const;

export const SALES_ENVIRONMENTS = [
  "In-person",
  "Phone",
  "Zoom / video conference",
  "Door-to-door",
  "Other",
] as const;

export const SALES_CYCLES = [
  "1 call",
  "1 week",
  "1 month",
  "6 months",
  "6 months+",
] as const;

export const DEAL_AMOUNTS = [
  "$0 - $5000",
  "$5000 - $20,000",
  "$20,000 - $50,000",
  "$50,000 - $100,000",
  "$100,000 - $500,000",
  "$500,000 - $1M",
  "$1M+",
] as const;

export const SALES_VOLUMES = [
  "$0 - $100,000",
  "$100,000 - $250,000",
  "$250,000 - $500,000",
  "$500,000 - $1M",
  "$1M - $2M",
  "$2M - $5M",
  "$5M+",
] as const;

export const LEAD_TYPES = ["Inbound", "Outbound"] as const;

export const TECHNOLOGIES = [
  "Google Drive",
  "Zoom",
  "Google Meet",
  "Google Calendar",
  "Powerpoint",
  "Keynote",
  "Canva",
  "Docusign",
  "Salesforce",
  "Hubspot",
] as const;

// Compressed short-name taxonomy — a rep or hiring manager should be able
// to scan the list and pick in a few seconds. Migration
// 20260705001000_profile_polish.sql maps the old 68 long labels to these.
export const INDUSTRIES = [
  "AI / ML",
  "Aerospace",
  "Agriculture",
  "Automotive",
  "Beauty",
  "Cloud infrastructure",
  "Construction",
  "Consulting",
  "Consumer goods",
  "Cybersecurity",
  "Data / Analytics",
  "Defense",
  "E-commerce",
  "Education",
  "Energy",
  "Fashion",
  "Financial services",
  "Fintech",
  "Food & Beverage",
  "Gaming",
  "Government",
  "Healthcare",
  "Home services",
  "Hospitality",
  "HR tech",
  "Insurance",
  "Legal services",
  "Manufacturing",
  "Marketing / Advertising",
  "MarTech",
  "Medical device",
  "Media / Entertainment",
  "Non-profit",
  "Pharma / Biotech",
  "Professional services",
  "Real estate",
  "Recruiting / Staffing",
  "Retail",
  "SaaS",
  "Sports / Fitness",
  "Telecom",
  "Transportation / Logistics",
  "Travel",
  "Other",
] as const;

export const LISTING_STYLES = ["default", "repel", "inclusive"] as const;
export type ListingStyle = (typeof LISTING_STYLES)[number];
