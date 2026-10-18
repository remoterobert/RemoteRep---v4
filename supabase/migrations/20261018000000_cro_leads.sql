-- Fractional CRO program applications, captured by the intake form on the
-- public /fractional-cro landing page. Additive only: no existing table changes.
--
-- Inserts happen server-side via the service role (the form's server action),
-- so no insert policy is granted. Only platform admins can read leads.

create table public.cro_leads (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (char_length(first_name) between 1 and 100),
  last_name text not null check (char_length(last_name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 200),
  phone text not null check (char_length(phone) between 7 and 40),
  linkedin_url text check (char_length(linkedin_url) <= 300),
  current_title text not null check (char_length(current_title) between 2 and 150),
  leadership_years text not null,
  team_size text not null,
  income_range text not null,
  timeline text not null,
  why_now text check (char_length(why_now) <= 3000),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'booked', 'enrolled', 'not_a_fit')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cro_leads_created_idx on public.cro_leads(created_at desc);
create index cro_leads_email_idx on public.cro_leads(lower(email));

create trigger cro_leads_set_updated_at
  before update on public.cro_leads
  for each row execute function public.set_updated_at();

alter table public.cro_leads enable row level security;

create policy cro_leads_select_platform_admin on public.cro_leads
  for select using (public.is_platform_admin());

comment on table public.cro_leads is
  'Applications for the Fractional CRO program from the /fractional-cro landing page.';
