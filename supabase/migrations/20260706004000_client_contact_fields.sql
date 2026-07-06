-- Company contact info for platform communications + future SMS.
--
-- Mirrors the candidate_profiles.contact_email + phone pair added in
-- 20260705001000_profile_polish.sql, kept on client_profiles so a hiring
-- tenant can be reached separately from the user's login email.

alter table public.client_profiles
  add column if not exists contact_email text,
  add column if not exists contact_phone text;

comment on column public.client_profiles.contact_email is
  'Preferred contact email for the company — separate from any user login email. Used for notifications and outreach we send to the tenant.';
comment on column public.client_profiles.contact_phone is
  'Preferred contact phone for the company. Used for SMS notifications when opted in.';
