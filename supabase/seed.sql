-- ================================================================
-- Sample-data seed for RemoteRep v4
--
-- Adds 5 fake hiring companies + 10 sample job listings so you can see
-- how /opportunities and /company/listings look with real content.
--
-- Safe to re-run — uses stable UUIDs + ON CONFLICT DO NOTHING, so
-- running twice is a no-op instead of a duplicate.
--
-- To wipe all demo data later:
--   DELETE FROM public.tenants WHERE name LIKE '[Demo]%';
-- (child rows cascade off tenant delete)
-- ================================================================

DO $$
DECLARE
  v_creator_id uuid;
BEGIN
  -- Find any real user to attach as created_by on the listings (a NOT NULL
  -- FK). Prefer hiring-side users; fall back to any user.
  SELECT tm.user_id INTO v_creator_id
  FROM public.tenant_members tm
  WHERE tm.status = 'active'
    AND tm.role IN ('client_admin', 'client_member', 'agency_admin', 'agency_member')
  ORDER BY tm.created_at ASC
  LIMIT 1;

  IF v_creator_id IS NULL THEN
    SELECT id INTO v_creator_id FROM public.users ORDER BY created_at ASC LIMIT 1;
  END IF;

  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'No users found — sign up at least once before running the seed.';
  END IF;

  -- =====================================================================
  -- Companies (tenants)
  -- =====================================================================
  INSERT INTO public.tenants (id, slug, name, type) VALUES
    ('d0000001-0000-4000-8000-000000000001', 'demo-northstar-saas',       '[Demo] Northstar SaaS',       'client_company'),
    ('d0000002-0000-4000-8000-000000000002', 'demo-verto-health',         '[Demo] Verto Health',         'client_company'),
    ('d0000003-0000-4000-8000-000000000003', 'demo-blackrock-security',   '[Demo] Blackrock Security',   'client_company'),
    ('d0000004-0000-4000-8000-000000000004', 'demo-threadline-commerce',  '[Demo] Threadline Commerce',  'client_company'),
    ('d0000005-0000-4000-8000-000000000005', 'demo-meadow-real-estate',   '[Demo] Meadow Real Estate',   'client_company')
  ON CONFLICT (id) DO NOTHING;

  -- =====================================================================
  -- Client profiles
  -- =====================================================================
  INSERT INTO public.client_profiles
    (tenant_id, about, hiring_pitch, industry_slug, headcount, founded_year, visibility)
  VALUES
    ('d0000001-0000-4000-8000-000000000001',
     'Northstar helps mid-market SaaS teams cut their sales-tool spend by 30% with an all-in-one revenue platform.',
     'Series B, growing 40% YoY, profitable. Warm inbound leads, no politics. Nobody has churned off our sales team in 18 months.',
     'saas-companies', 120, 2019, 'public'),
    ('d0000002-0000-4000-8000-000000000002',
     'Verto Health connects patients with primary care doctors over video, covered by most insurance plans.',
     'Sell a product people genuinely need. Founder was an ER doctor. Series C, 300+ patient signups per day.',
     'healthcare', 340, 2018, 'public'),
    ('d0000003-0000-4000-8000-000000000003',
     'Blackrock Security ships zero-trust access control for regulated industries — finance, healthcare, government.',
     'Enterprise deals with 6-figure ACVs. Selling to CIOs at $500M+ orgs. Long cycle but generous accelerators.',
     'cybersecurity', 85, 2020, 'public'),
    ('d0000004-0000-4000-8000-000000000004',
     'Threadline is the ops backbone for Shopify brands: inventory, orders, and returns in one dashboard.',
     'Mid-market ecomm brands love us — under 5% churn. Sell a product with 4.8 stars on G2.',
     'e-commerce', 55, 2021, 'public'),
    ('d0000005-0000-4000-8000-000000000005',
     'Meadow is the remote-first agency helping investors buy and sell luxury properties without leaving home.',
     'Uncapped commission on real closings. Sell to high-net-worth individuals who are ready to transact.',
     'real-estate', 22, 2022, 'public')
  ON CONFLICT (tenant_id) DO NOTHING;

  -- =====================================================================
  -- Hiring intents
  -- =====================================================================
  INSERT INTO public.tenant_hiring_intents (tenant_id, sales_role, status) VALUES
    ('d0000001-0000-4000-8000-000000000001', 'Account executive', 'active'),
    ('d0000001-0000-4000-8000-000000000001', 'SDR', 'active'),
    ('d0000002-0000-4000-8000-000000000002', 'Account executive', 'active'),
    ('d0000003-0000-4000-8000-000000000003', 'Closer', 'active'),
    ('d0000003-0000-4000-8000-000000000003', 'SDR', 'active'),
    ('d0000004-0000-4000-8000-000000000004', 'Appointment-setter', 'active'),
    ('d0000005-0000-4000-8000-000000000005', 'Closer', 'active')
  ON CONFLICT DO NOTHING;

  -- =====================================================================
  -- Listings (10 total)
  -- =====================================================================
  INSERT INTO public.listings
    (id, tenant_id, created_by_user_id, title, description, instructions, calendar_link, status, visibility, published_at)
  VALUES
    -- Northstar (3: 2 published, 1 draft)
    ('a0000001-0000-4000-8000-000000000001', 'd0000001-0000-4000-8000-000000000001', v_creator_id,
     'Senior Account Executive — Mid-market SaaS',
     E'## About Northstar\n\nWe help mid-market SaaS teams cut their sales-tool spend by 30% with an all-in-one revenue platform. Series B, growing 40% YoY, and profitable.\n\n## What you''ll do\n\n- Own the full sales cycle from qualified inbound lead to close\n- Sell to VP Sales and CROs at 200–2,000 person SaaS companies\n- Run ~15 calls a week and close 3–4 deals per quarter\n\n## What we''re looking for\n\n- 3+ years of full-cycle SaaS AE experience\n- Comfortable running demos and negotiating multi-year deals\n- Consistent quota attainment (bring your last 4 quarters)\n\n## What we offer\n\n$100k base + uncapped commission ($220k OTE). Full health, dental, vision. 401k with 4% match. Fully remote.',
     'Send a short note about your last full-cycle deal — who you sold to, how long the cycle took, and what actually closed it. We usually respond within 48 hours.',
     'https://calendly.com/demo-northstar/ae-intro',
     'published', 'public', now() - interval '3 days'),

    ('a0000001-0000-4000-8000-000000000002', 'd0000001-0000-4000-8000-000000000001', v_creator_id,
     'SDR — Outbound to SaaS Founders',
     E'We''re building a repeatable outbound motion into 200–500 person SaaS companies. This role owns the top of that funnel.\n\n## What you''ll do\n\n- 60–80 outbound touches a day across email, LinkedIn, and phone\n- Book 8–12 qualified meetings a week for our AEs\n- Own your ICP research and messaging tests\n\n## What we''re looking for\n\n- 1+ year of SaaS outbound SDR experience\n- Not afraid of the phone — you can hold your own with a founder\n- Comfortable with Outreach or Salesloft\n\n## What we offer\n\n$65k base + $25k variable ($90k OTE). Clear promotion path to AE in 12–18 months.',
     NULL, NULL,
     'published', 'public', now() - interval '5 days'),

    ('a0000001-0000-4000-8000-000000000003', 'd0000001-0000-4000-8000-000000000001', v_creator_id,
     'Sales Manager — Building a Team',
     'Draft posting — first-line sales manager to run our AE pod. Owns hiring, coaching, forecasting. This is a working draft, not published yet.',
     NULL, NULL,
     'draft', 'hidden', NULL),

    -- Verto (2)
    ('a0000002-0000-4000-8000-000000000001', 'd0000002-0000-4000-8000-000000000002', v_creator_id,
     'Account Executive — Telemedicine Growth',
     E'Verto connects patients with primary care doctors over video. We''re Series C and expanding into 12 new states this year.\n\n## What you''ll do\n\n- Close employer partnerships (100–5,000 employees) as a healthcare benefit\n- Work inbound leads from HR platforms + light outbound to benefits brokers\n- Average deal size: $40k ARR. Cycle: 6–8 weeks.\n\n## What we''re looking for\n\n- 2+ years selling into HR, benefits, or healthcare\n- Consultative — you educate before you pitch\n- Bachelor''s degree or equivalent experience\n\n## What we offer\n\n$85k base + commission ($170k OTE). Full benefits day one.',
     'Tell us about a healthcare or benefits deal you''ve closed — who the buyer was, how you got in the door, and what made the deal stick after signing. A short paragraph is enough.',
     'https://calendly.com/demo-verto/intro',
     'published', 'public', now() - interval '2 days'),

    ('a0000002-0000-4000-8000-000000000002', 'd0000002-0000-4000-8000-000000000002', v_creator_id,
     'BDR — Healthcare Providers Only',
     E'Book qualified meetings with independent primary care practices considering adding telemedicine.\n\n## What you''ll do\n\n- 40–60 outbound touches a day to practice owners and office managers\n- 6 booked meetings/week target\n- Own a territory of ~1,500 practices\n\n## What we''re looking for\n\n- 6+ months of B2B outbound experience OR healthcare industry experience\n- Empathetic and patient — practice owners are busy and skeptical\n\n## What we offer\n\n$55k base + $15k variable. Full health day one. Promotion to AE at 12 months for top 30%.',
     NULL, NULL,
     'published', 'public', now() - interval '8 days'),

    -- Blackrock (3: 2 published, 1 paused)
    ('a0000003-0000-4000-8000-000000000001', 'd0000003-0000-4000-8000-000000000003', v_creator_id,
     'Enterprise Closer — Cybersecurity',
     E'## This role is not for you if\n\n- You need warm inbound to hit your number\n- You get uncomfortable with 9-month sales cycles\n- You want a soft target\n\n## This role IS for you if\n\n- You''ve closed $500k+ ACV deals into Fortune 1000 CIOs\n- You know how to navigate procurement, legal, and CFO objection cycles\n- You want $300k+ OTE with real accelerators past quota\n\n## The bar\n\n5+ years enterprise cyber sales. Track record of $2M+ annual bookings. References required.\n\n## What we offer\n\n$150k base + variable ($300k OTE) with 2x accelerators. 3 named accounts + open territory.',
     'Share a redacted deal desk memo from a $500k+ deal you closed — feel free to anonymize the customer name, deal value, and any sensitive numbers. What matters is how you navigated the org.',
     'https://calendly.com/demo-blackrock/intro',
     'published', 'public', now() - interval '1 day'),

    ('a0000003-0000-4000-8000-000000000002', 'd0000003-0000-4000-8000-000000000003', v_creator_id,
     'Cyber SDR — Zero-Trust Products',
     E'Book demos with Directors of Security and CISOs at 1,000+ employee organizations. Deep-vertical SDR role.\n\n## What you''ll do\n\n- Land-and-expand outbound into named accounts\n- Master the zero-trust and identity narrative — we''ll train you\n- 5 booked meetings a week from a 200-account list\n\n## What we''re looking for\n\n- 1+ year of B2B SaaS SDR — bonus for cyber or infra\n- Genuine intellectual curiosity about how enterprises secure themselves\n\n## What we offer\n\n$70k base + $30k variable ($100k OTE). Clear promotion to AE at 18–24 months.',
     NULL, NULL,
     'published', 'public', now() - interval '10 days'),

    ('a0000003-0000-4000-8000-000000000003', 'd0000003-0000-4000-8000-000000000003', v_creator_id,
     'Sales Executive — Government Accounts',
     'FedRAMP-focused role. Currently paused while we finalize compliance milestones — will re-open in Q4.',
     NULL, NULL,
     'paused', 'hidden', now() - interval '45 days'),

    -- Threadline (1)
    ('a0000004-0000-4000-8000-000000000001', 'd0000004-0000-4000-8000-000000000004', v_creator_id,
     'Appointment Setter — E-commerce Brands',
     E'Book demos with founders and heads of ops at Shopify brands doing $1M–$50M in annual revenue.\n\n## What you''ll do\n\n- Outbound via LinkedIn + email to a curated list of 800 brands\n- 4 booked demos/week target\n- Warm handoff to AE — you don''t pitch product\n\n## Part-time or full-time — your call\n\nWe hire people who want steady evening hours as well as full-time closers-in-training.\n\n## What we''re looking for\n\n- Great writer\n- Comfortable with Apollo, Instantly, or similar\n- E-commerce enthusiasm is a big plus\n\n## What we offer\n\n$45k–$65k base (depending on FT/PT) + per-meeting spiff.',
     NULL, NULL,
     'published', 'public', now() - interval '6 days'),

    -- Meadow (1)
    ('a0000005-0000-4000-8000-000000000001', 'd0000005-0000-4000-8000-000000000005', v_creator_id,
     'Closer — Luxury Remote Real Estate',
     E'Close inbound leads from high-net-worth individuals looking to buy or sell $2M+ properties. Everything happens over video and phone.\n\n## What you''ll do\n\n- Convert 60–80 warm inbound leads per month into signed listing/buyer agreements\n- Coordinate with local field agents for showings\n- Own the client experience end-to-end\n\n## What we''re looking for\n\n- Active real estate license (any state)\n- 3+ years closing luxury or investment property deals\n- Executive presence — our clients are founders, athletes, and retired execs\n\n## What we offer\n\nCommission-only, uncapped. Top closers hit $400k+. Every lead is pre-qualified.',
     'Include your license number, the state it''s active in, and your last 3 closed deals (property addresses optional but helpful). We move fast on qualified applicants.',
     'https://calendly.com/demo-meadow/intro',
     'published', 'public', now() - interval '4 days')
  ON CONFLICT (id) DO NOTHING;

  -- =====================================================================
  -- Listing details (arrays for multi commitment + comp type)
  -- =====================================================================
  INSERT INTO public.listing_details
    (listing_id, sales_role, commitment, compensation_type, minimum_compensation, compensation_details, benefits)
  VALUES
    ('a0000001-0000-4000-8000-000000000001', 'Account executive',
      ARRAY['Full-time']::public.commitment_type[],
      ARRAY['Base + comission']::public.compensation_type[],
      100000, '$100k base + uncapped commission. $220k OTE at plan. 2x accelerator past 120% quota. Equity refresh at year 2.',
      ARRAY['Health insurance','Dental coverage','Vision coverage','401k','Stock options']::public.benefit[]),

    ('a0000001-0000-4000-8000-000000000002', 'SDR',
      ARRAY['Full-time']::public.commitment_type[],
      ARRAY['Base + comission']::public.compensation_type[],
      65000, '$65k base + $25k variable ($90k OTE). Promotion to AE track with $30k comp bump at 12–18 months.',
      ARRAY['Health insurance','Dental coverage','401k']::public.benefit[]),

    ('a0000001-0000-4000-8000-000000000003', 'Sales management',
      ARRAY['Full-time']::public.commitment_type[],
      ARRAY['Salary','Base + comission']::public.compensation_type[],
      140000, NULL,
      ARRAY['Health insurance','Dental coverage','Vision coverage','401k','Stock options']::public.benefit[]),

    ('a0000002-0000-4000-8000-000000000001', 'Account executive',
      ARRAY['Full-time']::public.commitment_type[],
      ARRAY['Base + comission']::public.compensation_type[],
      85000, '$85k base + variable ($170k OTE). Health from day one. Team-wide bonus on new-state launches.',
      ARRAY['Health insurance','Dental coverage','Vision coverage','401k']::public.benefit[]),

    ('a0000002-0000-4000-8000-000000000002', 'BDR',
      ARRAY['Full-time']::public.commitment_type[],
      ARRAY['Base + comission']::public.compensation_type[],
      55000, '$55k base + $15k variable ($70k OTE). Promotion to AE at 12 months for top 30%.',
      ARRAY['Health insurance','Dental coverage']::public.benefit[]),

    ('a0000003-0000-4000-8000-000000000001', 'Closer',
      ARRAY['Full-time']::public.commitment_type[],
      ARRAY['Base + comission']::public.compensation_type[],
      150000, '$150k base + variable ($300k OTE at plan). 2x accelerator past 100%. Deal desk backs you.',
      ARRAY['Health insurance','Dental coverage','Vision coverage','401k','Stock options']::public.benefit[]),

    ('a0000003-0000-4000-8000-000000000002', 'SDR',
      ARRAY['Full-time']::public.commitment_type[],
      ARRAY['Base + comission']::public.compensation_type[],
      70000, '$70k base + $30k variable ($100k OTE).',
      ARRAY['Health insurance','Dental coverage','Vision coverage','401k']::public.benefit[]),

    ('a0000003-0000-4000-8000-000000000003', 'Executive',
      ARRAY['Full-time']::public.commitment_type[],
      ARRAY['Base + comission']::public.compensation_type[],
      170000, NULL,
      ARRAY['Health insurance','Dental coverage','Vision coverage','401k','Stock options']::public.benefit[]),

    ('a0000004-0000-4000-8000-000000000001', 'Appointment-setter',
      ARRAY['Full-time','Part-time']::public.commitment_type[],
      ARRAY['Salary','Base + comission']::public.compensation_type[],
      45000, 'Base scales with hours. Per-meeting SPIFF on every held demo.',
      ARRAY['Health insurance']::public.benefit[]),

    ('a0000005-0000-4000-8000-000000000001', 'Closer',
      ARRAY['Full-time','Part-time']::public.commitment_type[],
      ARRAY['Comission-only']::public.compensation_type[],
      NULL, 'Commission-only, uncapped. Top closers hit $400k+. Every lead is pre-qualified.',
      NULL)
  ON CONFLICT (listing_id) DO NOTHING;

  -- =====================================================================
  -- Listing requirements
  -- =====================================================================
  INSERT INTO public.listing_requirements
    (listing_id, education, years_of_experience_min, industries, sales_roles,
     sales_types, decision_makers, sales_environments, sales_cycles, deal_amounts,
     sales_volumes, lead_types, technologies)
  VALUES
    -- Northstar Senior AE
    ('a0000001-0000-4000-8000-000000000001',
      ARRAY['Bachelor''s degree']::public.education_level[], 3,
      ARRAY['Software as a Service (SaaS) companies','Customer relationship management (CRM) software vendors'],
      ARRAY['Account executive','Closer']::public.sales_role[],
      ARRAY['B2B']::public.sales_type[],
      ARRAY['C-suite']::public.decision_maker[],
      ARRAY['Zoom / video conference']::public.sales_environment[],
      ARRAY['1 month','6 months']::public.sales_cycle[],
      ARRAY['$20,000 - $50,000','$50,000 - $100,000']::public.deal_amount[],
      ARRAY['$1M - $2M','$2M - $5M']::public.sales_volume[],
      ARRAY['Inbound','Outbound']::public.lead_type[],
      ARRAY['Salesforce','Zoom','Google Meet']::public.technology[]),

    -- Northstar SDR
    ('a0000001-0000-4000-8000-000000000002',
      NULL, 1,
      ARRAY['Software as a Service (SaaS) companies'],
      ARRAY['SDR','BDR']::public.sales_role[],
      ARRAY['B2B']::public.sales_type[],
      ARRAY['C-suite']::public.decision_maker[],
      ARRAY['Phone','Zoom / video conference']::public.sales_environment[],
      ARRAY['1 call','1 week']::public.sales_cycle[],
      NULL, NULL,
      ARRAY['Outbound']::public.lead_type[],
      ARRAY['Salesforce']::public.technology[]),

    -- Northstar Manager (draft)
    ('a0000001-0000-4000-8000-000000000003',
      ARRAY['Bachelor''s degree']::public.education_level[], 5,
      ARRAY['Software as a Service (SaaS) companies'],
      ARRAY['Sales management']::public.sales_role[],
      ARRAY['B2B']::public.sales_type[],
      ARRAY['C-suite']::public.decision_maker[],
      NULL,
      ARRAY['1 month','6 months']::public.sales_cycle[],
      NULL, NULL, NULL, NULL),

    -- Verto AE
    ('a0000002-0000-4000-8000-000000000001',
      ARRAY['Bachelor''s degree']::public.education_level[], 2,
      ARRAY['Remote healthcare and telemedicine services','Online insurance providers'],
      ARRAY['Account executive']::public.sales_role[],
      ARRAY['B2B']::public.sales_type[],
      ARRAY['C-suite','Other']::public.decision_maker[],
      ARRAY['Zoom / video conference']::public.sales_environment[],
      ARRAY['1 month']::public.sales_cycle[],
      ARRAY['$20,000 - $50,000']::public.deal_amount[],
      ARRAY['$500,000 - $1M','$1M - $2M']::public.sales_volume[],
      ARRAY['Inbound','Outbound']::public.lead_type[],
      ARRAY['Salesforce','Zoom']::public.technology[]),

    -- Verto BDR
    ('a0000002-0000-4000-8000-000000000002',
      NULL, 0,
      ARRAY['Remote healthcare and telemedicine services'],
      ARRAY['BDR','SDR']::public.sales_role[],
      ARRAY['B2B']::public.sales_type[],
      ARRAY['Small business','Other']::public.decision_maker[],
      ARRAY['Phone']::public.sales_environment[],
      ARRAY['1 call','1 week']::public.sales_cycle[],
      NULL, NULL,
      ARRAY['Outbound']::public.lead_type[],
      ARRAY['Hubspot']::public.technology[]),

    -- Blackrock Closer
    ('a0000003-0000-4000-8000-000000000001',
      ARRAY['Bachelor''s degree']::public.education_level[], 5,
      ARRAY['Cybersecurity software providers','Remote financial services and banking platforms','Remote legal and consultation services'],
      ARRAY['Closer','Account executive']::public.sales_role[],
      ARRAY['B2B','B2G']::public.sales_type[],
      ARRAY['C-suite']::public.decision_maker[],
      ARRAY['Zoom / video conference','In-person']::public.sales_environment[],
      ARRAY['6 months','6 months+']::public.sales_cycle[],
      ARRAY['$100,000 - $500,000','$500,000 - $1M','$1M+']::public.deal_amount[],
      ARRAY['$2M - $5M','$5M+']::public.sales_volume[],
      ARRAY['Outbound']::public.lead_type[],
      ARRAY['Salesforce','Zoom']::public.technology[]),

    -- Blackrock SDR
    ('a0000003-0000-4000-8000-000000000002',
      NULL, 1,
      ARRAY['Cybersecurity software providers','Software as a Service (SaaS) companies'],
      ARRAY['SDR','BDR']::public.sales_role[],
      ARRAY['B2B']::public.sales_type[],
      ARRAY['C-suite']::public.decision_maker[],
      ARRAY['Phone','Zoom / video conference']::public.sales_environment[],
      ARRAY['1 week','1 month']::public.sales_cycle[],
      NULL, NULL,
      ARRAY['Outbound']::public.lead_type[],
      ARRAY['Salesforce']::public.technology[]),

    -- Blackrock Gov (paused)
    ('a0000003-0000-4000-8000-000000000003',
      ARRAY['Bachelor''s degree']::public.education_level[], 7,
      ARRAY['Cybersecurity software providers'],
      ARRAY['Executive','Closer']::public.sales_role[],
      ARRAY['B2G']::public.sales_type[],
      ARRAY['Other']::public.decision_maker[],
      ARRAY['In-person','Zoom / video conference']::public.sales_environment[],
      ARRAY['6 months+']::public.sales_cycle[],
      ARRAY['$500,000 - $1M','$1M+']::public.deal_amount[],
      ARRAY['$5M+']::public.sales_volume[],
      ARRAY['Outbound']::public.lead_type[], NULL),

    -- Threadline Appt-setter
    ('a0000004-0000-4000-8000-000000000001',
      NULL, 0,
      ARRAY['E-commerce platforms','Subscription box services','Online beauty and skincare products'],
      ARRAY['Appointment-setter','SDR']::public.sales_role[],
      ARRAY['B2B']::public.sales_type[],
      ARRAY['Small business']::public.decision_maker[],
      ARRAY['Phone','Zoom / video conference']::public.sales_environment[],
      ARRAY['1 call','1 week']::public.sales_cycle[],
      NULL, NULL,
      ARRAY['Outbound']::public.lead_type[],
      ARRAY['Google Meet','Zoom']::public.technology[]),

    -- Meadow Closer
    ('a0000005-0000-4000-8000-000000000001',
      NULL, 3,
      ARRAY['Remote real estate services'],
      ARRAY['Closer','Account executive']::public.sales_role[],
      ARRAY['B2C']::public.sales_type[],
      ARRAY['Consumer']::public.decision_maker[],
      ARRAY['Zoom / video conference','Phone']::public.sales_environment[],
      ARRAY['1 month','6 months']::public.sales_cycle[],
      ARRAY['$500,000 - $1M','$1M+']::public.deal_amount[],
      ARRAY['$1M - $2M','$2M - $5M']::public.sales_volume[],
      ARRAY['Inbound']::public.lead_type[],
      ARRAY['Docusign','Zoom']::public.technology[])
  ON CONFLICT (listing_id) DO NOTHING;

  RAISE NOTICE '';
  RAISE NOTICE '===============================================================';
  RAISE NOTICE '  Demo seed complete.';
  RAISE NOTICE '  5 companies, 10 listings (8 live, 1 draft, 1 paused).';
  RAISE NOTICE '  Refresh /opportunities to see them.';
  RAISE NOTICE '===============================================================';
END $$;
