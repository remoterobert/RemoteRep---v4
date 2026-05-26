// Hardcoded sample candidates so the Phase 1d UI has data to render
// before real candidates exist in the system. Swap to a Supabase query in
// Phase 2 when real candidate profiles are populated.

export type SampleCandidate = {
  id: string;
  initials: string;
  display_name: string;
  headline: string;
  years_experience: number;
  specialty_roles: string[];
  industries: string[];
  avg_deal_size: string;
  preferred_environments: string[];
};

export const SAMPLE_CANDIDATES: SampleCandidate[] = [
  {
    id: "sample-1",
    initials: "MR",
    display_name: "Morgan Reyes",
    headline:
      "Closer • 7 years SaaS • Closed $1.2M ARR in 2025",
    years_experience: 7,
    specialty_roles: ["Closer", "Account executive"],
    industries: ["SaaS companies", "Cybersecurity software providers"],
    avg_deal_size: "$20,000 - $50,000",
    preferred_environments: ["Zoom / video conference", "Phone"],
  },
  {
    id: "sample-2",
    initials: "JT",
    display_name: "Jamie Tanaka",
    headline: "SDR/BDR specialist • 4 years outbound • 60+ meetings booked/mo",
    years_experience: 4,
    specialty_roles: ["SDR", "BDR", "Appointment-setter"],
    industries: ["CRM software vendors", "Email marketing services"],
    avg_deal_size: "$5000 - $20,000",
    preferred_environments: ["Phone", "Zoom / video conference"],
  },
  {
    id: "sample-3",
    initials: "AS",
    display_name: "Alex Sutton",
    headline:
      "Sales Manager • 12 years • Built and scaled a 30-person team from zero",
    years_experience: 12,
    specialty_roles: ["Sales management", "Closer"],
    industries: ["SaaS companies", "Digital marketing agencies"],
    avg_deal_size: "$50,000 - $100,000",
    preferred_environments: ["Zoom / video conference", "In-person"],
  },
  {
    id: "sample-4",
    initials: "PD",
    display_name: "Priya Desai",
    headline: "Account Executive • 5 years • 130% quota attainment last 3 yrs",
    years_experience: 5,
    specialty_roles: ["Account executive", "Closer"],
    industries: [
      "Data analytics and business intelligence firms",
      "Project management software providers",
    ],
    avg_deal_size: "$20,000 - $50,000",
    preferred_environments: ["Zoom / video conference"],
  },
  {
    id: "sample-5",
    initials: "DL",
    display_name: "Devon Lee",
    headline:
      "Appointment-setter • 2 years • Outbound + warm callback specialist",
    years_experience: 2,
    specialty_roles: ["Appointment-setter", "SDR"],
    industries: ["Online insurance providers", "Telecommunications providers"],
    avg_deal_size: "$0 - $5000",
    preferred_environments: ["Phone"],
  },
  {
    id: "sample-6",
    initials: "RC",
    display_name: "Riley Chen",
    headline: "Executive sales lead • 15 years • C-suite enterprise selling",
    years_experience: 15,
    specialty_roles: ["Executive", "Sales management"],
    industries: [
      "Cybersecurity software providers",
      "AI and machine learning companies",
    ],
    avg_deal_size: "$500,000 - $1M",
    preferred_environments: ["In-person", "Zoom / video conference"],
  },
];

/**
 * Filter sample candidates by a sales role (used when a hiring tenant
 * states they're hiring for a specific role).
 */
export function filterByRole(role: string | null): SampleCandidate[] {
  if (!role) return SAMPLE_CANDIDATES;
  return SAMPLE_CANDIDATES.filter((c) => c.specialty_roles.includes(role));
}
