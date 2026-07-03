// Sample listings for the /opportunities browse page — used until
// clients actually post real listings (Phase 3). Swap to a Supabase
// query at that point.

export type SampleOpportunity = {
  id: string;
  company: string;
  companyInitials: string;
  title: string;
  sales_role: string;
  compensation_summary: string;
  commitment: string;
  deal_range: string;
  industries: string[];
  short_description: string;
  posted_days_ago: number;
};

export const SAMPLE_OPPORTUNITIES: SampleOpportunity[] = [
  {
    id: "opp-1",
    company: "Northstar SaaS",
    companyInitials: "NS",
    title: "Enterprise Closer — Cybersecurity SaaS",
    sales_role: "Closer",
    compensation_summary: "$120K base + uncapped comm",
    commitment: "Full-time",
    deal_range: "$50,000 - $100,000",
    industries: ["Cybersecurity software providers"],
    short_description:
      "Warm inbound + qualified pipeline. 30% quota attainment club last 3 quarters. Fully remote.",
    posted_days_ago: 2,
  },
  {
    id: "opp-2",
    company: "Grove Labs",
    companyInitials: "GL",
    title: "SDR — B2B SaaS",
    sales_role: "SDR",
    compensation_summary: "$65K base + $25K OTE",
    commitment: "Full-time",
    deal_range: "$5000 - $20,000",
    industries: ["Project management software providers"],
    short_description:
      "Outbound + inbound blend. Modern stack (Outreach, Gong, HubSpot). Clear promotion path to AE.",
    posted_days_ago: 5,
  },
  {
    id: "opp-3",
    company: "Verto Health",
    companyInitials: "VH",
    title: "Account Executive — Digital Health",
    sales_role: "Account executive",
    compensation_summary: "$100K base + 6% comm",
    commitment: "Full-time",
    deal_range: "$20,000 - $50,000",
    industries: ["Remote healthcare and telemedicine services"],
    short_description:
      "Selling into clinics and specialty medical groups. Warm intros from marketing. Hybrid preferred.",
    posted_days_ago: 1,
  },
  {
    id: "opp-4",
    company: "Loom Interactive",
    companyInitials: "LI",
    title: "Appointment Setter — Coaching",
    sales_role: "Appointment-setter",
    compensation_summary: "$25/hr + $50/appt",
    commitment: "Part-time",
    deal_range: "$0 - $5000",
    industries: ["Remote coaching and personal development services"],
    short_description:
      "Book qualified discovery calls for high-ticket coaching offer. Hot leads provided.",
    posted_days_ago: 7,
  },
  {
    id: "opp-5",
    company: "Aperture Data",
    companyInitials: "AD",
    title: "Sales Manager — Data Analytics",
    sales_role: "Sales management",
    compensation_summary: "$150K base + team override",
    commitment: "Full-time",
    deal_range: "$100,000 - $500,000",
    industries: ["Data analytics and business intelligence firms"],
    short_description:
      "Build and lead a team of 5 AEs. Series B funded, 4x growth YoY.",
    posted_days_ago: 3,
  },
  {
    id: "opp-6",
    company: "Kite Real Estate",
    companyInitials: "KR",
    title: "Closer — Real Estate Investment",
    sales_role: "Closer",
    compensation_summary: "100% commission ($150K+ OTE)",
    commitment: "Full-time",
    deal_range: "$20,000 - $50,000",
    industries: ["Remote real estate services"],
    short_description:
      "Convert warm leads from investor education content. Pre-qualified pipeline.",
    posted_days_ago: 4,
  },
  {
    id: "opp-7",
    company: "Bloom EdTech",
    companyInitials: "BE",
    title: "BDR — Higher Ed SaaS",
    sales_role: "BDR",
    compensation_summary: "$55K base + $30K OTE",
    commitment: "Full-time",
    deal_range: "$50,000 - $100,000",
    industries: ["E-learning platforms and Learning Management Systems (LMS)"],
    short_description:
      "Prospect universities and community colleges. Long sales cycle, high ACV.",
    posted_days_ago: 9,
  },
  {
    id: "opp-8",
    company: "Signal Metric",
    companyInitials: "SM",
    title: "Executive Sales Lead — MarTech",
    sales_role: "Executive",
    compensation_summary: "$220K base + equity",
    commitment: "Full-time",
    deal_range: "$500,000 - $1M",
    industries: ["Digital marketing agencies"],
    short_description:
      "Close 6-figure ARR deals with enterprise brand teams. Extensive network preferred.",
    posted_days_ago: 12,
  },
];

/** Filter opportunities to those matching a candidate's specialty roles. */
export function filterByRoles(roles: string[]): SampleOpportunity[] {
  if (roles.length === 0) return SAMPLE_OPPORTUNITIES;
  return SAMPLE_OPPORTUNITIES.filter((o) => roles.includes(o.sales_role));
}
