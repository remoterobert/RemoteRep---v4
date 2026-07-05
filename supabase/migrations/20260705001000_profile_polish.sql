-- Profile-polish batch:
--   1. Add contact_email + phone to candidate_profiles
--   2. Rename candidate_goals company_*_max → company_*_min (semantics fix:
--      "I want a company at LEAST X people big" — the current max labels
--      were confusing/backwards).
--   3. Compress industry taxonomy from 68 long, oddly-specific labels
--      down to ~43 short and useful ones. Applied to every table that
--      stored industry strings.

-- =====================================================================
-- Step 1: contact fields
-- =====================================================================
alter table public.candidate_profiles
  add column if not exists contact_email text,
  add column if not exists phone text;

comment on column public.candidate_profiles.contact_email is
  'Preferred contact email — separate from users.email (their login).';
comment on column public.candidate_profiles.phone is
  'Preferred contact phone. Only shown to invited hiring managers.';

-- =====================================================================
-- Step 2: rename max → min on candidate_goals
-- =====================================================================
alter table public.candidate_goals rename column company_age_max to company_age_min;
alter table public.candidate_goals rename column company_headcount_max to company_headcount_min;

-- Update the check constraints on the renamed columns.
alter table public.candidate_goals drop constraint if exists candidate_goals_company_age_max_check;
alter table public.candidate_goals drop constraint if exists candidate_goals_company_headcount_max_check;
alter table public.candidate_goals
  add constraint candidate_goals_company_age_min_check
    check (company_age_min is null or company_age_min between 0 and 200),
  add constraint candidate_goals_company_headcount_min_check
    check (company_headcount_min is null or company_headcount_min between 0 and 100000);

-- =====================================================================
-- Step 3: industry taxonomy compression
-- =====================================================================

-- Helper: return the compressed short-name equivalent for any old label.
-- Anything not in the map passes through unchanged (safe default for
-- new labels or anything already using the new taxonomy).
create or replace function public.migrate_industry_name(v text)
returns text language sql immutable as $$
  select case v
    when 'Affiliate marketing networks'                                     then 'Marketing / Advertising'
    when 'Artificial intelligence and machine learning companies'           then 'AI / ML'
    when 'Cloud storage and hosting services'                               then 'Cloud infrastructure'
    when 'Content marketing agencies'                                       then 'Marketing / Advertising'
    when 'Cryptocurrency and blockchain companies'                          then 'Fintech'
    when 'Customer relationship management (CRM) software vendors'          then 'SaaS'
    when 'Cybersecurity software providers'                                 then 'Cybersecurity'
    when 'Data analytics and business intelligence firms'                   then 'Data / Analytics'
    when 'Digital marketing agencies'                                       then 'Marketing / Advertising'
    when 'E-commerce platforms'                                             then 'E-commerce'
    when 'E-learning platforms and Learning Management Systems (LMS)'       then 'Education'
    when 'E-sports and online gaming platforms'                             then 'Gaming'
    when 'Email marketing services'                                         then 'MarTech'
    when 'Freelance marketplaces'                                           then 'SaaS'
    when 'Graphic design services'                                          then 'Professional services'
    when 'Influencer marketing platforms'                                   then 'MarTech'
    when 'Internet of Things (IoT) providers'                               then 'Manufacturing'
    when 'Language learning platforms'                                      then 'Education'
    when 'Mobile app development companies'                                 then 'Professional services'
    when 'Online advertising platforms'                                     then 'Marketing / Advertising'
    when 'Online art and design marketplaces'                               then 'E-commerce'
    when 'Online auction and marketplace platforms'                         then 'E-commerce'
    when 'Online automotive parts and services'                             then 'Automotive'
    when 'Online beauty and skincare products'                              then 'Beauty'
    when 'Online course providers'                                          then 'Education'
    when 'Online dating and matchmaking services'                           then 'Consumer goods'
    when 'Online food ordering and delivery platforms'                      then 'Food & Beverage'
    when 'Online fundraising and crowdfunding platforms'                    then 'Non-profit'
    when 'Online gardening and landscaping services'                        then 'Home services'
    when 'Online gift and specialty product sales'                          then 'Retail'
    when 'Online insurance providers'                                       then 'Insurance'
    when 'Online job boards'                                                then 'Recruiting / Staffing'
    when 'Online office supply and stationery sales'                        then 'Retail'
    when 'Online payment processing companies'                              then 'Fintech'
    when 'Online recruitment and staffing agencies'                         then 'Recruiting / Staffing'
    when 'Online research and data collection firms'                        then 'Consulting'
    when 'Online specialty food and beverage sales'                         then 'Food & Beverage'
    when 'Online streaming services and content providers'                  then 'Media / Entertainment'
    when 'Online survey and polling tools'                                  then 'SaaS'
    when 'Online ticketing and event management platforms'                  then 'Media / Entertainment'
    when 'Online travel agencies and booking platforms'                     then 'Travel'
    when 'Online tutoring services'                                         then 'Education'
    when 'Podcasting and audio content platforms'                           then 'Media / Entertainment'
    when 'Project management software providers'                            then 'SaaS'
    when 'Remote baby and childcare product sales'                          then 'Consumer goods'
    when 'Remote book and eBook sales'                                      then 'Media / Entertainment'
    when 'Remote car sales and leasing services'                            then 'Automotive'
    when 'Remote coaching and personal development services'                then 'Professional services'
    when 'Remote customer support services'                                 then 'Professional services'
    when 'Remote electronics and gadget sales'                              then 'Retail'
    when 'Remote event planning services'                                   then 'Hospitality'
    when 'Remote fashion and clothing sales'                                then 'Fashion'
    when 'Remote financial services and banking platforms'                  then 'Financial services'
    when 'Remote healthcare and telemedicine services'                      then 'Healthcare'
    when 'Remote home improvement and maintenance services'                 then 'Home services'
    when 'Remote legal and consultation services'                           then 'Legal services'
    when 'Remote music and audio production services'                       then 'Media / Entertainment'
    when 'Remote pet care and product sales'                                then 'Consumer goods'
    when 'Remote photography and image editing services'                    then 'Professional services'
    when 'Remote public relations agencies'                                 then 'Marketing / Advertising'
    when 'Remote real estate services'                                      then 'Real estate'
    when 'Remote sports and outdoor equipment sales'                        then 'Sports / Fitness'
    when 'Remote translation services'                                      then 'Professional services'
    when 'Renewable energy technology firms'                                then 'Energy'
    when 'Search engine optimization (SEO) companies'                       then 'MarTech'
    when 'Smart home technology vendors'                                    then 'Consumer goods'
    when 'Social media management firms'                                    then 'MarTech'
    when 'Software as a Service (SaaS) companies'                           then 'SaaS'
    when 'Subscription box services'                                        then 'E-commerce'
    when 'Telecommunications providers'                                     then 'Telecom'
    when 'Video production companies'                                       then 'Media / Entertainment'
    when 'Virtual and remote collaboration tools'                           then 'SaaS'
    when 'Virtual assistant and chatbot providers'                          then 'SaaS'
    when 'Virtual event platforms'                                          then 'SaaS'
    when 'Virtual fitness and wellness platforms'                           then 'Sports / Fitness'
    when 'Virtual office space providers'                                   then 'Real estate'
    when 'Virtual reality and augmented reality developers'                 then 'Gaming'
    when 'Web development agencies'                                         then 'Professional services'
    when 'Webinar and video conferencing platforms'                         then 'SaaS'
    when 'Website analytics and monitoring services'                        then 'SaaS'
    else v
  end
$$;

-- Apply mapping to every table with industry strings.
update public.candidate_profiles
  set industry_slugs = array(
    select public.migrate_industry_name(x) from unnest(industry_slugs) as x
  )
  where industry_slugs is not null;

update public.candidate_goals
  set industries = array(
    select public.migrate_industry_name(x) from unnest(industries) as x
  )
  where industries is not null;

update public.listing_requirements
  set industries = array(
    select public.migrate_industry_name(x) from unnest(industries) as x
  )
  where industries is not null;

update public.client_profiles
  set industry_slug = public.migrate_industry_name(industry_slug)
  where industry_slug is not null;

-- Drop the helper. It has done its job.
drop function public.migrate_industry_name(text);
