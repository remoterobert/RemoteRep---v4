-- Stripe customer / subscription / payment records.
-- v3 stored these as a nested object on the user row; v4 normalizes.
-- Stripe webhooks (Phase 3) populate these tables.

create table public.stripe_customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Either tenant_id or user_id should be set (the customer of record)
  check (tenant_id is not null or user_id is not null)
);

create index stripe_customers_tenant_idx on public.stripe_customers(tenant_id);
create index stripe_customers_user_idx on public.stripe_customers(user_id);

create trigger stripe_customers_set_updated_at
  before update on public.stripe_customers
  for each row execute function public.set_updated_at();

create table public.stripe_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  stripe_price_id text not null,
  status public.stripe_subscription_status not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index stripe_subscriptions_tenant_idx on public.stripe_subscriptions(tenant_id, status);
create index stripe_subscriptions_status_idx on public.stripe_subscriptions(status);

create trigger stripe_subscriptions_set_updated_at
  before update on public.stripe_subscriptions
  for each row execute function public.set_updated_at();

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  stripe_payment_intent_id text unique,
  stripe_charge_id text,
  amount_cents int not null,
  currency text not null default 'usd',
  purpose public.payment_purpose not null,
  status text not null,  -- mirrors Stripe payment intent status
  related_entity_type text,
  related_entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index payments_tenant_idx on public.payments(tenant_id, paid_at desc);
create index payments_purpose_idx on public.payments(purpose);

-- Links payment to specific listing (the v3 $299 model)
create table public.listing_payments (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  payment_id uuid not null references public.payments(id) on delete restrict,
  paid_at timestamptz not null default now()
);

-- RLS
alter table public.stripe_customers enable row level security;
alter table public.stripe_subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.listing_payments enable row level security;

-- Tenant members can see their tenant's payment data
create policy stripe_customers_select_member on public.stripe_customers
  for select using (
    tenant_id in (select public.user_tenant_ids())
    or auth.uid() = user_id
    or public.is_platform_admin()
  );

create policy stripe_subscriptions_select_member on public.stripe_subscriptions
  for select using (
    tenant_id in (select public.user_tenant_ids())
    or public.is_platform_admin()
  );

create policy payments_select_member on public.payments
  for select using (
    tenant_id in (select public.user_tenant_ids())
    or auth.uid() = user_id
    or public.is_platform_admin()
  );

create policy listing_payments_select_member on public.listing_payments
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = listing_payments.listing_id
        and (l.tenant_id in (select public.user_tenant_ids()) or public.is_platform_admin())
    )
  );

-- Writes happen via service role (Stripe webhook handlers).

comment on table public.stripe_subscriptions is
  'Active and historical Stripe subscriptions. Synced via Stripe webhooks (Phase 3).';
comment on table public.listing_payments is
  'Marks that a specific listing has been paid for (v3 $299 listing-fee model).';
