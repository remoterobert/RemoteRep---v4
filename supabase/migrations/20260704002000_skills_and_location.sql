-- Adds free-text skills + location fields to candidate profiles, and
-- location fields to company profiles. These match v3's shareable-page
-- fields ("Location: Apalit, Pampanga, PH" for candidates and
-- "Calgary, Alberta, CA" for companies).
--
-- Skills is intentionally a free text column (not an array) — v3 stored
-- one giant paragraph ("B2B Sales, Cold Calling, Customer Service, …")
-- and copying that shape avoids forcing every rep into a fixed vocab.

alter table public.candidate_profiles
  add column if not exists skills text,
  add column if not exists city text,
  add column if not exists state_region text,
  add column if not exists country text;

alter table public.client_profiles
  add column if not exists city text,
  add column if not exists state_region text,
  add column if not exists country text;

comment on column public.candidate_profiles.skills is
  'Free-text skills paragraph. v3 stored a comma-separated list; we keep it flexible.';
comment on column public.candidate_profiles.state_region is
  'State / province / region. Named state_region to avoid conflict with Postgres "state" reserved-ish word.';
comment on column public.client_profiles.state_region is
  'State / province / region for the company HQ / primary location.';
