-- Affiliate (referral) program.
-- v3 stored visitors/leads/conversions/churned/revenue/commissions as nested arrays
-- in the referral row. v4 normalizes into typed event rows so we can run reports.

create table public.affiliate_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  code text not null unique check (code ~ '^[a-z0-9-]{1,32}$'),
  status public.affiliate_status not null default 'active',
  revenue_share_pct numeric not null default 50 check (revenue_share_pct between 0 and 100),
  stripe_connect_account_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index affiliate_codes_user_idx on public.affiliate_codes(user_id);
create index affiliate_codes_code_idx on public.affiliate_codes(code);

create trigger affiliate_codes_set_updated_at
  before update on public.affiliate_codes
  for each row execute function public.set_updated_at();

-- Each "event" type that v3 tracked as an array element becomes one row here.
create type public.referral_event_kind as enum (
  'visit',
  'lead',
  'conversion',
  'churn',
  'revenue',
  'commission'
);

create table public.referral_events (
  id uuid primary key default gen_random_uuid(),
  affiliate_code_id uuid not null references public.affiliate_codes(id) on delete cascade,
  kind public.referral_event_kind not null,
  referred_user_id uuid references public.users(id) on delete set null,
  amount_cents int,             -- populated for revenue/commission events
  paid boolean,                 -- on commission events: payout status
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index referral_events_code_kind_idx on public.referral_events(affiliate_code_id, kind, occurred_at desc);
create index referral_events_referred_user_idx on public.referral_events(referred_user_id);

-- RLS
alter table public.affiliate_codes enable row level security;
alter table public.referral_events enable row level security;

-- An affiliate sees their own code and events.
create policy affiliate_codes_select_own on public.affiliate_codes
  for select using (auth.uid() = user_id or public.is_platform_admin());

create policy referral_events_select_owner on public.referral_events
  for select using (
    exists (
      select 1 from public.affiliate_codes ac
      where ac.id = referral_events.affiliate_code_id
        and ac.user_id = auth.uid()
    )
    or public.is_platform_admin()
  );

comment on table public.affiliate_codes is
  'Active affiliate codes (one per affiliate). Code is the URL-safe public slug for referral links.';
comment on table public.referral_events is
  'One row per observed referral event (visit, lead, conversion, etc). Replaces v3 nested arrays.';
