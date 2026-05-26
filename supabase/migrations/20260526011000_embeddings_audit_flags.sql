-- AI/ML embeddings (pgvector) + operational tables (audit log, feature flags).

-- ===========================================================
-- Candidate embeddings (1536-dim vector for OpenAI/Anthropic embedding APIs)
-- ===========================================================
create table public.candidate_embeddings (
  user_id uuid primary key references public.users(id) on delete cascade,
  model text not null,                          -- e.g., 'text-embedding-3-small'
  embedding extensions.vector(1536) not null,
  source_hash text not null,                    -- hash of source content; refresh when changes
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger candidate_embeddings_set_updated_at
  before update on public.candidate_embeddings
  for each row execute function public.set_updated_at();

-- HNSW index for fast similarity search
create index candidate_embeddings_hnsw_idx on public.candidate_embeddings
  using hnsw (embedding extensions.vector_cosine_ops);

alter table public.candidate_embeddings enable row level security;

-- Embeddings are queryable only by service role / authenticated app code via RPC.
-- No direct policy granted — adds explicit safety.

-- ===========================================================
-- Listing embeddings
-- ===========================================================
create table public.listing_embeddings (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  model text not null,
  embedding extensions.vector(1536) not null,
  source_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger listing_embeddings_set_updated_at
  before update on public.listing_embeddings
  for each row execute function public.set_updated_at();

create index listing_embeddings_hnsw_idx on public.listing_embeddings
  using hnsw (embedding extensions.vector_cosine_ops);

alter table public.listing_embeddings enable row level security;

-- ===========================================================
-- Audit log: security-relevant actions (separate from events table).
-- ===========================================================
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_actor_idx on public.audit_log(actor_user_id, created_at desc);
create index audit_log_target_idx on public.audit_log(target_type, target_id);
create index audit_log_action_idx on public.audit_log(action, created_at desc);

alter table public.audit_log enable row level security;

-- Only platform admins can read audit log.
create policy audit_log_select_platform_admin on public.audit_log
  for select using (public.is_platform_admin());

-- Inserts via service role.

-- ===========================================================
-- Feature flags: gradual rollout toggles.
-- ===========================================================
create table public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text,
  target jsonb not null default '{}'::jsonb,      -- e.g., {"tenant_ids": ["..."]}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger feature_flags_set_updated_at
  before update on public.feature_flags
  for each row execute function public.set_updated_at();

alter table public.feature_flags enable row level security;

-- Anyone authenticated can read flags (for gating UI features).
create policy feature_flags_select_authenticated on public.feature_flags
  for select using (auth.uid() is not null);

-- Writes via service role only.

comment on table public.candidate_embeddings is
  'Vector representations of candidate profiles for semantic search and ML matching.';
comment on table public.audit_log is
  'Security-relevant actions: impersonation, role changes, deletions. Separate from events table.';
