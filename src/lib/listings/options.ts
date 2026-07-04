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

export const INDUSTRIES = [
  "Affiliate marketing networks",
  "Artificial intelligence and machine learning companies",
  "Cloud storage and hosting services",
  "Content marketing agencies",
  "Cryptocurrency and blockchain companies",
  "Customer relationship management (CRM) software vendors",
  "Cybersecurity software providers",
  "Data analytics and business intelligence firms",
  "Digital marketing agencies",
  "E-commerce platforms",
  "E-learning platforms and Learning Management Systems (LMS)",
  "E-sports and online gaming platforms",
  "Email marketing services",
  "Freelance marketplaces",
  "Graphic design services",
  "Influencer marketing platforms",
  "Internet of Things (IoT) providers",
  "Language learning platforms",
  "Mobile app development companies",
  "Online advertising platforms",
  "Online art and design marketplaces",
  "Online auction and marketplace platforms",
  "Online automotive parts and services",
  "Online beauty and skincare products",
  "Online course providers",
  "Online dating and matchmaking services",
  "Online food ordering and delivery platforms",
  "Online fundraising and crowdfunding platforms",
  "Online gardening and landscaping services",
  "Online gift and specialty product sales",
  "Online insurance providers",
  "Online job boards",
  "Online office supply and stationery sales",
  "Online payment processing companies",
  "Online recruitment and staffing agencies",
  "Online research and data collection firms",
  "Online specialty food and beverage sales",
  "Online streaming services and content providers",
  "Online survey and polling tools",
  "Online ticketing and event management platforms",
  "Online travel agencies and booking platforms",
  "Online tutoring services",
  "Podcasting and audio content platforms",
  "Project management software providers",
  "Remote baby and childcare product sales",
  "Remote book and eBook sales",
  "Remote car sales and leasing services",
  "Remote coaching and personal development services",
  "Remote customer support services",
  "Remote electronics and gadget sales",
  "Remote event planning services",
  "Remote fashion and clothing sales",
  "Remote financial services and banking platforms",
  "Remote healthcare and telemedicine services",
  "Remote home improvement and maintenance services",
  "Remote legal and consultation services",
  "Remote music and audio production services",
  "Remote pet care and product sales",
  "Remote photography and image editing services",
  "Remote public relations agencies",
  "Remote real estate services",
  "Remote sports and outdoor equipment sales",
  "Remote translation services",
  "Renewable energy technology firms",
  "Search engine optimization (SEO) companies",
  "Smart home technology vendors",
  "Social media management firms",
  "Software as a Service (SaaS) companies",
  "Subscription box services",
  "Telecommunications providers",
  "Video production companies",
  "Virtual and remote collaboration tools",
  "Virtual assistant and chatbot providers",
  "Virtual event platforms",
  "Virtual fitness and wellness platforms",
  "Virtual office space providers",
  "Virtual reality and augmented reality developers",
  "Web development agencies",
  "Webinar and video conferencing platforms",
  "Website analytics and monitoring services",
  "Other",
] as const;

export const LISTING_STYLES = ["default", "repel", "inclusive"] as const;
export type ListingStyle = (typeof LISTING_STYLES)[number];
