-- All canonical value lists from v3, recreated as Postgres enums.
-- Values match v3 EXACTLY so user migration is straightforward.
-- See v3-archive/server/src/utilities/validateRequest.ts for original source.

-- Sales role types (used by listings and candidate specialties)
create type public.sales_role as enum (
  'Appointment-setter',
  'SDR',
  'BDR',
  'Account executive',
  'Closer',
  'Sales management',
  'Executive',
  'Other'
);

-- Sales types (market segments)
create type public.sales_type as enum (
  'B2B',
  'B2C',
  'B2G'
);

-- Education level (single value per person OR array on listing requirements)
create type public.education_level as enum (
  'High school',
  'Some college',
  'Associate degree',
  'Bachelor''s degree',
  'Master''s degree',
  'Doctorate'
);

-- Who the seller talks to
create type public.decision_maker as enum (
  'Small business',
  'C-suite',
  'Consumer',
  'Other'
);

-- Where selling happens
create type public.sales_environment as enum (
  'In-person',
  'Phone',
  'Zoom / video conference',
  'Door-to-door',
  'Other'
);

-- Typical deal length
create type public.sales_cycle as enum (
  '1 call',
  '1 week',
  '1 month',
  '6 months',
  '6 months+'
);

-- Typical deal size
create type public.deal_amount as enum (
  '$0 - $5000',
  '$5000 - $20,000',
  '$20,000 - $50,000',
  '$50,000 - $100,000',
  '$100,000 - $500,000',
  '$500,000 - $1M',
  '$1M+'
);

-- Sales volume the candidate has personally handled
create type public.sales_volume as enum (
  '$0 - $100,000',
  '$100,000 - $250,000',
  '$250,000 - $500,000',
  '$500,000 - $1M',
  '$1M - $2M',
  '$2M - $5M',
  '$5M+'
);

-- Lead source
create type public.lead_type as enum (
  'Inbound',
  'Outbound'
);

-- Tools/tech the candidate or role uses
create type public.technology as enum (
  'Google Drive',
  'Zoom',
  'Google Meet',
  'Google Calendar',
  'Powerpoint',
  'Keynote',
  'Canva',
  'Docusign',
  'Salesforce',
  'Hubspot'
);

-- Job commitment type
create type public.commitment_type as enum (
  'Full-time',
  'Part-time',
  'Temporary',
  'Internship',
  'Other'
);

-- Benefits offered / desired
create type public.benefit as enum (
  'Health insurance',
  'Dental coverage',
  'Vision coverage',
  '401k',
  'Stock options',
  'None'
);

-- Compensation structures
create type public.compensation_type as enum (
  'Salary',
  'Base + comission',          -- yes, v3 has typo "comission" — match for migration
  'Comission-only',
  'Draw against comission',
  'Hourly'
);

-- Application lifecycle (used in applications + notifications)
create type public.application_status as enum (
  'bookmarked',
  'invited',
  'applied',
  'interviewing',
  'shortlisted',
  'hired',
  'rejected',
  'withdrawn'
);

-- Rating an employer can give an applicant (matches v3: -1, 0, 1)
create type public.application_rating as enum (
  'down',   -- -1 in v3
  'neutral', -- 0 in v3
  'up'       -- 1 in v3
);

-- Listing lifecycle
create type public.listing_status as enum (
  'draft',
  'pending_payment',
  'published',
  'paused',
  'archived'
);

-- Notification categories
create type public.notification_kind as enum (
  'chat',
  'talent_application',
  'client_application',
  'listing_update',
  'system'
);

-- Payment purposes
create type public.payment_purpose as enum (
  'listing',
  'access'   -- v3 "full access" subscription
);

-- Stripe subscription state (mirrors Stripe's subscription.status field)
create type public.stripe_subscription_status as enum (
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused'
);

-- Affiliate status
create type public.affiliate_status as enum (
  'active',
  'suspended'
);

-- File upload categories
create type public.file_kind as enum (
  'resume',
  'profile_photo',
  'company_logo',
  'income_doc',
  'portfolio',
  'other'
);

-- Visibility flag (used on profiles, listings)
create type public.visibility as enum (
  'public',
  'hidden'
);

-- The 68-value industry list is preserved as a SEEDED REFERENCE TABLE,
-- not an enum. Reason: enums are painful to extend; industries change
-- often. See 20260526010050_industries.sql.
