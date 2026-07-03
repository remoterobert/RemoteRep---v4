-- Add "profile summary" fields to candidate_profiles. These are the
-- at-a-glance fields shown on browse cards (Phase MVP-2) and drive
-- role-filter matching.
--
-- Rich per-role detail (education/technologies/sales_volumes/etc.) stays
-- on candidate_experiences for the future resume-history feature.

alter table public.candidate_profiles
  add column if not exists years_of_experience int,
  add column if not exists sales_types public.sales_type[],
  add column if not exists deal_amounts public.deal_amount[],
  add column if not exists decision_makers public.decision_maker[],
  add column if not exists sales_environments public.sales_environment[],
  add column if not exists lead_types public.lead_type[],
  add column if not exists industry_slugs text[];

comment on column public.candidate_profiles.years_of_experience is
  'Total years of sales experience. Shown on browse cards.';
comment on column public.candidate_profiles.industry_slugs is
  'Slug references to public.industries. Free-text array, not FK, for flexibility.';
