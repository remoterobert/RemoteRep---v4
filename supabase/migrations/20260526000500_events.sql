-- Events table: every meaningful user action writes one row here.
-- Foundation for ML training data, dashboards, audit, analytics.
-- See docs/V4-ARCHITECTURE.md §2.5.A and V4-DATA-MODEL.md §4.10.

create table public.events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  actor_user_id uuid references public.users(id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  session_id uuid,
  created_at timestamptz not null default now()
);

-- Indexes for common query patterns
create index events_tenant_created_idx on public.events(tenant_id, created_at desc);
create index events_actor_created_idx on public.events(actor_user_id, created_at desc);
create index events_type_idx on public.events(event_type);
create index events_entity_idx on public.events(entity_type, entity_id);

-- RLS
alter table public.events enable row level security;

-- Members can read events for tenants they belong to.
create policy events_select_tenant_member on public.events
  for select using (
    tenant_id in (select public.user_tenant_ids())
  );

-- Platform admins can read all events.
create policy events_select_platform_admin on public.events
  for select using (public.is_platform_admin());

-- INSERT happens server-side via service role (no policy granted here).
-- This forces events to flow through wrapped logging code in API routes.

comment on table public.events is
  'Activity log. Every meaningful user action writes one row. ML/analytics/audit foundation.';
