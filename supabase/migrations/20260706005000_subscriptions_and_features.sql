-- Subscription tiers, featured listings, AI-agent scaffolding, and consent.
--
-- We defer the Stripe/checkout wiring for later. This migration ships the
-- data model so admins can grant tiers manually and the app can gate
-- premium behavior against a real column.
--
--   free        — no AI
--   premium     — basic AI (listing writer, profile helpers) $59/mo one-off
--                 features here don't have a tier of their own; they're
--                 available to premium+concierge.
--   concierge   — everything premium has PLUS the agentic concierge that
--                 sources, invites, chats with, and books interviews with
--                 candidates on the tenant's behalf. $299/mo or $2874/yr.
--
-- Consent + AI author_kind are added upfront because we need them in place
-- BEFORE any concierge conversation is possible for legal compliance.

-- =====================================================================
-- Subscription tier on tenants
-- =====================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'subscription_tier') then
    create type public.subscription_tier as enum ('free', 'premium', 'concierge');
  end if;
end $$;

alter table public.tenants
  add column if not exists subscription_tier public.subscription_tier
    not null default 'free',
  add column if not exists subscription_expires_at timestamptz,
  add column if not exists subscription_period text
    check (subscription_period is null or subscription_period in ('monthly', 'annual')),
  add column if not exists subscription_updated_by uuid references public.users(id),
  add column if not exists subscription_updated_at timestamptz;

create index if not exists tenants_subscription_tier_idx on public.tenants(subscription_tier);

comment on column public.tenants.subscription_tier is
  'free/premium/concierge. Grants access to AI features and the concierge assistant. Admin-flip only until Stripe lands.';
comment on column public.tenants.subscription_expires_at is
  'When the current subscription lapses. NULL for perpetual grants (comp).';

-- =====================================================================
-- Featured listings (the $59/mo boost)
-- =====================================================================

alter table public.listings
  add column if not exists featured_until timestamptz,
  add column if not exists featured_reason text,
  add column if not exists featured_boosted_at timestamptz;

create index if not exists listings_featured_idx
  on public.listings(featured_until desc)
  where featured_until is not null;

comment on column public.listings.featured_until is
  'Listing is featured (badge + top of feed + email blast) until this timestamp.';
comment on column public.listings.featured_boosted_at is
  'When the email blast to the user database went out. NULL means the feature was purchased but the blast has not yet fired.';

-- =====================================================================
-- Concierge per-listing enablement
-- =====================================================================

alter table public.listings
  add column if not exists concierge_enabled_at timestamptz,
  add column if not exists concierge_enabled_by uuid references public.users(id);

create index if not exists listings_concierge_idx
  on public.listings(concierge_enabled_at)
  where concierge_enabled_at is not null;

comment on column public.listings.concierge_enabled_at is
  'When the concierge agent was activated for this listing. NULL = not enabled.';

-- =====================================================================
-- Message author_kind — so we can render AI messages differently and
-- audit AI-generated content.
-- =====================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'message_author_kind') then
    create type public.message_author_kind as enum ('user', 'ai_concierge', 'system');
  end if;
end $$;

alter table public.messages
  add column if not exists author_kind public.message_author_kind
    not null default 'user';

comment on column public.messages.author_kind is
  'Who authored the message. `user` for humans, `ai_concierge` for the AI assistant, `system` for platform-generated notices (welcome, disclosures).';

-- =====================================================================
-- Candidate AI consent
--
-- Legal requirement: before an AI agent interacts with a candidate on
-- behalf of a hiring tenant, the candidate must be informed of the AI's
-- involvement and consent. Tracks per-tenant so a candidate can consent
-- for Tenant A but not Tenant B.
--
-- Covered regulations:
--   - NYC Local Law 144: notice + right to alternative process
--   - Colorado AI Act (2026): notice + right to explanation + right to opt out
--   - Illinois AI Video Interview Act (extended concept)
--   - EEOC guidance: disparate impact — enforced in app logic, not schema
--   - EU AI Act (high-risk hiring systems): transparency + human oversight
-- =====================================================================

create table if not exists public.candidate_ai_consent (
  user_id uuid not null references public.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  consented_at timestamptz not null default now(),
  revoked_at timestamptz,
  disclosure_version text not null,
  disclosure_shown text not null,
  ip_address inet,
  user_agent text,
  primary key (user_id, tenant_id)
);

create index if not exists candidate_ai_consent_user_idx
  on public.candidate_ai_consent(user_id);
create index if not exists candidate_ai_consent_tenant_idx
  on public.candidate_ai_consent(tenant_id);

alter table public.candidate_ai_consent enable row level security;

-- Candidate sees their own consents.
create policy candidate_ai_consent_select_own on public.candidate_ai_consent
  for select using (auth.uid() = user_id);

-- Tenant sees consents granted to them.
create policy candidate_ai_consent_select_tenant on public.candidate_ai_consent
  for select using (tenant_id in (select public.user_tenant_ids()));

-- Candidate can insert their own consent.
create policy candidate_ai_consent_insert_own on public.candidate_ai_consent
  for insert with check (auth.uid() = user_id);

-- Candidate can revoke (update revoked_at).
create policy candidate_ai_consent_update_own on public.candidate_ai_consent
  for update using (auth.uid() = user_id);

-- Platform admin bypass.
create policy candidate_ai_consent_admin on public.candidate_ai_consent
  for all using (public.is_platform_admin());

comment on table public.candidate_ai_consent is
  'Per-tenant record that a candidate has been shown the AI-hiring disclosure and consented to interact with the concierge agent. Required by NYC LL144, Colorado AI Act, EU AI Act, etc. Candidate can revoke at any time.';
