# V4-DATA-MODEL.md — How v4's Database Is Organized

> **Status:** Draft for owner review.
> **Audience:** Non-technical owner. Schema described in plain English first, table structure second.
> **Purpose:** Decide what data v4 stores and how it's organized **before** any code is written. This is the most consequential planning doc — schema decisions cost the most to change later.

---

## 0. How To Read This Doc

The "database" is the set of tables that hold every piece of information v4 manages. Designing it well now saves months of pain later. This doc is divided into three layers:

- **Section 1–3:** The big-picture concepts (what categories of data exist, how multi-tenancy works, how users + roles work). **Everyone should read these.**
- **Section 4:** Detailed table-by-table catalog. Each table has a plain-English description first, then a structure summary. **Skim it; dig into the tables you care about.**
- **Section 5–7:** What's different from v3, what's deferred, what decisions need your input.

If something is unclear, that's important feedback — the data model has to make sense to you before we build on top of it.

---

## 1. The Big Idea

v4 organizes data around three concepts, layered on top of each other:

```
       ┌───────────────────────────────────────────┐
       │  TENANTS    (organizations / accounts)    │  ← "who owns this data"
       └───────────────┬───────────────────────────┘
                       │
       ┌───────────────▼───────────────────────────┐
       │  USERS + ROLES   (people + what they do)  │  ← "who can do what"
       └───────────────┬───────────────────────────┘
                       │
       ┌───────────────▼───────────────────────────┐
       │  BUSINESS DATA   (listings, applications, │
       │  chats, files, payments, events, etc.)    │  ← the actual work
       └───────────────────────────────────────────┘
```

**Tenants** are the top-level boundary. Every piece of business data belongs to a tenant. A recruiter at Agency A only sees Agency A's data because the database itself refuses to return anyone else's. This is multi-tenancy.

**Users** are individual people with login accounts. Users belong to one or more tenants, with specific roles inside each.

**Business data** (the bulk of the database) carries a `tenant_id` so the database knows which tenant owns it.

### One important nuance: talent is global

Sales reps (talent) are searchable across **all** client tenants — otherwise there's no marketplace. So talent profiles live in the database WITHOUT a tenant_id (or with a special "global pool" tenant). What's tenant-scoped is the **pipeline data**: which talent a client has bookmarked, contacted, hired, etc.

In plain English:
- 🌍 **Global:** talent profiles, listings (when published), the talent pool itself
- 🔒 **Tenant-scoped:** a client's bookmarks, application records, chats, payment history, notes

---

## 2. Multi-Tenancy In Detail

### What "tenant" means in RemoteRep

| Tenant type | Examples | Who's inside |
|---|---|---|
| **Hiring company** | "Acme Corp" | One or more recruiters from Acme |
| **Agency** | "Talent Partners LLC" | One or more recruiters representing multiple clients |
| **RemoteRep itself** | RemoteRep Inc. | Admins, support staff |
| **Solo talent** | "Jane Smith (individual)" | Just Jane — talent users are typically their own tiny tenant of one |

A talent user might be "tenant of one" (just them) — this gives them a place to own their profile, files, and payment data while keeping the model uniform.

### How isolation is enforced

**Two layers, both required** (per the architecture decision):

1. **API route checks** — every API call confirms the authenticated user is allowed to see/modify the requested data.
2. **Postgres Row-Level Security (RLS)** — the database refuses queries that try to read another tenant's rows, even if the API code somehow gets it wrong.

This is "defense in depth." Either layer alone would work for the common case; both together protect against bugs in either layer.

### Cross-tenant users (admins, agency staff at multiple clients)

Some users legitimately need to see across tenants:
- RemoteRep admins (impersonating users, viewing platform-wide analytics)
- Agency staff who manage multiple client tenants

The `tenant_members` table (Section 4) supports a user being in many tenants. RLS policies grant access based on what tenants you're a member of.

---

## 3. User Identity And Roles (RBAC)

### The user concept, refactored from v3

**v3:** One giant `v3-users` row holds everything about a person: identity, password, talent profile, client profile, Stripe customer, GHL state, push subscriptions, affiliate stuff…

**v4:** Splits these apart:
- **Identity + login** → Supabase Auth handles this (separate from our schema)
- **App-level user record** → `users` table, minimal fields (just the link to auth)
- **Talent profile** → `candidate_profiles` table (only for users who are talent)
- **Client/recruiter org membership** → `tenant_members` table
- **Stripe state, GHL state, etc.** → separate dedicated tables

This is "normalization." It makes the database easier to reason about, faster to query, and easier to evolve.

### Roles (RBAC) — list will grow

Initial v4 roles:

| Role | What they can do |
|---|---|
| `candidate` | Talent users. Build a profile, apply to listings, message clients. |
| `client_member` | Someone inside a hiring company tenant. Browse talent, post listings, manage applications. |
| `client_admin` | Top-level admin of a hiring company. Manage members, billing. |
| `agency_member` | Recruiter inside an agency tenant. Same as client_member but tied to an agency. |
| `agency_admin` | Top-level admin of an agency. |
| `platform_admin` | RemoteRep staff. Cross-tenant access. |
| `platform_support` | RemoteRep support staff. Limited cross-tenant access (read-only or scoped). |

A user can have **different roles in different tenants** (e.g., be a `client_admin` in their own company AND a `platform_admin` in the RemoteRep tenant). The `tenant_members` table captures this.

### What replaces v3's "authority level: > 100 = active, 99 = suspended"

v4 uses a clean `status` enum on the `users` table: `active`, `suspended`, `deleted`, `pending_verification`. No magic numbers.

---

## 4. The Tables (Plain English + Structure)

This is the bulk of the doc. Each table has:
- **What it is:** the plain-English description
- **Key fields:** the columns that matter (not every column)
- **Why it's separate from other tables:** the design rationale

### 4.1 — Identity & Tenancy

#### `tenants`
**What it is:** Every organization (company, agency, RemoteRep itself, individual talent) has one row here.
**Key fields:**
- `id` (uuid)
- `name` (text — display name)
- `slug` (text — URL-friendly unique id, e.g., "acme-corp")
- `type` (enum: `client_company`, `agency`, `solo_talent`, `platform`)
- `status` (enum: `active`, `suspended`, `deleted`)
- `created_at`, `updated_at` (timestamps)
**Why separate:** Tenants are the top-level boundary. Everything tenant-scoped joins back to this table.

#### `users`
**What it is:** One row per person with a login. Identity/credentials are in Supabase Auth; this table holds app-level user data.
**Key fields:**
- `id` (uuid — matches Supabase Auth user id)
- `email` (text — denormalized from auth for query convenience)
- `display_name` (text)
- `phone` (text, nullable)
- `timezone` (text)
- `status` (enum: `active`, `suspended`, `deleted`, `pending_verification`)
- `last_seen_at` (timestamp)
- `created_at`, `updated_at`
**Why separate:** Identity belongs to Supabase Auth. We keep a minimal mirror so we can join user data to business data without round-tripping to auth on every query.

#### `tenant_members`
**What it is:** Links users to tenants with a role. A user can be in many tenants; a tenant has many members.
**Key fields:**
- `tenant_id` (uuid → tenants.id)
- `user_id` (uuid → users.id)
- `role` (enum — the role values from Section 3)
- `invited_by` (uuid → users.id, nullable)
- `joined_at` (timestamp)
- `status` (enum: `active`, `invited`, `removed`)
**Why separate:** This table IS the multi-tenancy + RBAC mechanism. Every permission check ultimately consults this.

### 4.2 — Talent (Candidate) Data

#### `candidate_profiles`
**What it is:** A talent user's profile (public-facing info clients can search). One row per talent.
**Key fields:**
- `user_id` (uuid → users.id, primary key)
- `headline` (text — short tagline)
- `about` (text — bio)
- `video_url` (text, nullable)
- `photo_url` (text — points to R2)
- `visibility` (enum: `public`, `hidden`)
- `onboarding_completed_at` (timestamp, nullable)
- `created_at`, `updated_at`
**Why separate:** Cleaner than packing it into `users`. Also makes "talent profile" a first-class entity that can be searched and indexed independently.
**Note:** No `tenant_id` — candidate profiles are global.

#### `candidate_experiences`
**What it is:** Each row = one job/role from a talent's work history. A talent has many.
**Key fields:** `id`, `user_id`, `company`, `title`, `start_date`, `end_date` (nullable), `description`, `display_order`
**Why separate:** v3 stored experiences as a nested array. Normalizing means we can search by company, filter by recency, etc.

#### `candidate_goals`
**What it is:** Career objectives a talent declares.
**Key fields:** `id`, `user_id`, `category` (e.g., `compensation`, `industry`, `role_type`), `value` (jsonb), `display_order`
**Why separate:** Same reason as experiences. Plus, goals feed the matching algorithm.

#### `candidate_files`
**What it is:** Files (resume, portfolio docs, etc.) uploaded by talent. Each row = one file's metadata; actual file lives in Cloudflare R2.
**Key fields:** `id`, `user_id`, `kind` (enum: `resume`, `portfolio`, `income_doc`), `r2_key` (text — R2 location), `original_filename`, `size_bytes`, `mime_type`, `uploaded_at`
**Why separate:** Files have their own lifecycle (versioning, expiry, signed URLs).

### 4.3 — Listings (Job Postings)

#### `listings`
**What it is:** A job posting created by a client tenant.
**Key fields:**
- `id` (uuid)
- `tenant_id` (uuid → tenants.id — the client who owns this)
- `created_by_user_id` (uuid → users.id)
- `title` (text)
- `description` (text)
- `instructions` (text)
- `calendar_link` (text, nullable)
- `status` (enum: `draft`, `pending_payment`, `published`, `paused`, `archived`)
- `published_at`, `paid_at` (timestamps, nullable)
- `visibility` (enum: `public`, `hidden`)
- `created_at`, `updated_at`
**Why separate from v3:** v3's listing rows had applications nested inside; v4 separates them (see `applications` below).

#### `listing_details`
**What it is:** Structured details about a listing (compensation, commitment, sales role, benefits).
**Key fields:** `listing_id`, `compensation` (jsonb), `commitment` (text), `sales_role` (text), `benefits` (text)
**Why separate:** Lets `listings` stay small and queryable; details that don't need to be searched live here.

#### `listing_requirements`
**What it is:** A listing's filterable requirements — technologies, industries, education, experience, lead types. One row per requirement.
**Key fields:** `id`, `listing_id`, `category` (enum: `technology`, `industry`, `education`, `experience_level`, `lead_type`), `value` (text), `weight` (numeric — for matching)
**Why separate:** Normalized requirements = searchable + algorithmically scorable. v3 stored them as nested arrays inside the listing row.

### 4.4 — Applications & Pipeline

#### `applications`
**What it is:** A talent's relationship with a listing. Tracks the full lifecycle from bookmarked → invited → applied → hired (or rejected).
**Key fields:**
- `id` (uuid)
- `tenant_id` (uuid — the listing's owner tenant)
- `listing_id` (uuid)
- `candidate_user_id` (uuid → users.id)
- `status` (enum: `bookmarked`, `invited`, `applied`, `interviewing`, `shortlisted`, `hired`, `rejected`, `withdrawn`)
- `applied_at`, `last_status_change_at` (timestamps)
- `message` (text, nullable — talent's cover message)
- `rating` (integer, nullable — client's rating)
- `internal_notes` (text, nullable — visible only to tenant members)
- `created_at`, `updated_at`
**Why separate:** v3 nested applications inside the listing row. As listings get many applications, this becomes a performance and concurrency nightmare. Normalized = clean.

#### `bookmarks`
**What it is:** Generic "save for later" — clients bookmark talent, talent bookmark listings or clients.
**Key fields:** `id`, `user_id` (who bookmarked), `tenant_id` (whose pipeline it lives in, nullable for global talent bookmarks), `entity_type` (enum: `listing`, `candidate`, `tenant`), `entity_id`, `created_at`
**Why separate:** v3 had separate bookmark structures per type; v4 unifies for simplicity.

### 4.5 — Communication

#### `chats`
**What it is:** A conversation thread between two or more users.
**Key fields:** `id`, `tenant_id` (the tenant this chat is associated with, nullable for direct candidate↔candidate), `created_at`, `last_message_at`

#### `chat_participants`
**What it is:** Who's in a chat. Many-to-many between chats and users.
**Key fields:** `chat_id`, `user_id`, `joined_at`, `last_read_at`, `notification_preference` (enum: `all`, `mentions`, `muted`)

#### `messages`
**What it is:** One row per message in a chat.
**Key fields:** `id`, `chat_id`, `author_user_id`, `body` (text), `attachments` (jsonb), `created_at`, `edited_at`, `deleted_at`
**Why separate from v3:** v3 stored ALL messages of a chat as a nested array in the chat row. With high-volume chats this fails. Normalized = scales fine.

### 4.6 — Notifications

#### `notifications`
**What it is:** A single notification destined for a user. Generated by app logic; consumed by the in-app feed.
**Key fields:** `id`, `user_id`, `tenant_id` (nullable), `kind` (enum: `chat_message`, `application_update`, `listing_update`, `system`, etc.), `entity_type`, `entity_id`, `payload` (jsonb), `deduplication_key` (text — prevents spam), `seen_at` (nullable), `created_at`

#### `notification_channels`
**What it is:** Per-user, per-kind preferences. Should chat notifications go to email + push, or just push? Etc.
**Key fields:** `user_id`, `notification_kind`, `email_enabled`, `push_enabled`, `in_app_enabled`

#### `push_subscriptions`
**What it is:** Web Push (VAPID) subscriptions for a user's browser. A user has many (one per browser/device).
**Key fields:** `id`, `user_id`, `endpoint` (text), `keys` (jsonb — auth/p256dh), `user_agent`, `created_at`, `last_used_at`

### 4.7 — Payments

#### `stripe_customers`
**What it is:** Maps a user to their Stripe customer ID. One per user (or per tenant — TBD; likely per tenant for clients, per user for talent affiliates).
**Key fields:** `id`, `tenant_id` (nullable), `user_id` (nullable), `stripe_customer_id`, `created_at`

#### `stripe_subscriptions`
**What it is:** Active and historical subscriptions ("Full Access $780/mo").
**Key fields:** `id`, `tenant_id`, `stripe_subscription_id`, `stripe_price_id`, `status` (enum mirroring Stripe), `current_period_end`, `canceled_at`, `created_at`, `updated_at`

#### `payments`
**What it is:** One row per successful payment (listing purchases, etc.).
**Key fields:** `id`, `tenant_id`, `user_id`, `stripe_payment_intent_id`, `amount_cents`, `currency`, `purpose` (enum: `listing_post`, `subscription`, etc.), `related_entity_type`, `related_entity_id`, `paid_at`

#### `listing_payments`
**What it is:** Records that a specific listing has been paid for (so we know which listings are published vs. pending payment).
**Key fields:** `listing_id`, `payment_id`, `paid_at`

### 4.8 — Affiliates

#### `affiliate_codes`
**What it is:** One row per active affiliate. Code is the public-facing slug for referral URLs.
**Key fields:** `id`, `user_id` (the affiliate), `code` (text — unique), `status` (enum: `active`, `suspended`), `revenue_share_pct` (numeric — currently 50), `created_at`

#### `referrals`
**What it is:** Each row = one observed referral event (a visit, lead, conversion, churn, payment).
**Key fields:** `id`, `affiliate_code_id`, `kind` (enum: `visit`, `lead`, `conversion`, `churn`, `payment`), `referred_user_id` (nullable), `amount_cents` (nullable), `metadata` (jsonb), `occurred_at`
**Why separate from v3:** v3 stored these as arrays inside the referral row. v4 normalizes = lets us run reports.

### 4.9 — Integrations

#### `ghl_user_state`
**What it is:** Per-user GoHighLevel state — opportunity ID(s), tags, last sync time.
**Key fields:** `user_id`, `pipeline` (enum: `talent`, `client`), `opportunity_id` (text), `tags` (text array), `last_synced_at`

#### `integration_credentials` (using Supabase Vault for encryption)
**What it is:** Encrypted OAuth tokens / API keys for per-tenant external integrations (future: ATS, calendars, payroll).
**Key fields:** `id`, `tenant_id`, `provider` (text), `credentials` (encrypted via Vault), `expires_at`, `created_at`

### 4.10 — Events (THE big new addition for ML)

#### `events`
**What it is:** The ML training data backbone. Every meaningful user action writes one row here.
**Key fields:**
- `id` (uuid)
- `tenant_id` (uuid, nullable for global events)
- `actor_user_id` (uuid, nullable for system events)
- `event_type` (text — e.g., `candidate.viewed`, `search.run`, `application.status_changed`, `hire.completed`)
- `entity_type`, `entity_id` (what was acted on)
- `payload` (jsonb — flexible per event type)
- `session_id` (uuid, nullable — for grouping actions within a session)
- `created_at` (timestamp)
**Why this matters:** Feeds the matching algorithm, dashboards, anomaly detection, ML features. **Every feature we build writes events.** This is non-optional.

### 4.11 — Embeddings (pgvector — for AI matching)

#### `candidate_embeddings`
**What it is:** Vector representations of talent profiles for similarity search.
**Key fields:** `user_id`, `model` (text — which AI model produced this), `embedding` (vector(1536)), `source_hash` (text — to know when to refresh), `created_at`

#### `listing_embeddings`
**What it is:** Same idea for listings.
**Key fields:** `listing_id`, `model`, `embedding` (vector(1536)), `source_hash`, `created_at`

### 4.12 — Operational

#### `audit_log`
**What it is:** Security/admin-relevant actions (user impersonation, role changes, deletions). Separate from `events` because audit log has stricter access controls.
**Key fields:** `id`, `actor_user_id`, `action` (text), `target_type`, `target_id`, `metadata` (jsonb), `ip_address`, `user_agent`, `created_at`

#### `feature_flags`
**What it is:** Toggles for gradual rollouts of new features.
**Key fields:** `key`, `enabled`, `target` (jsonb — e.g., enable for specific tenants), `created_at`

#### Materialized views (Postgres concept — pre-computed query results, refreshed on a schedule)
For dashboards. Not user-editable tables. Examples:
- `dashboard_tenant_metrics` — counts per tenant, refreshed every 5 min
- `dashboard_candidate_pipeline` — pipeline state aggregation
- `dashboard_revenue_by_month` — revenue rollups, refreshed nightly

---

## 5. How V4 Differs From V3 — At A Glance

| Concept | v3 | v4 |
|---|---|---|
| Where user data lives | One giant `v3-users` row per person | Split: `users` + `candidate_profiles` + `tenant_members` + dedicated tables for Stripe/GHL/etc. |
| Applications | Nested array inside each listing row | Own table (`applications`) |
| Chat messages | Nested array inside each chat row | Own table (`messages`) |
| Notification feed | Single row per user with nested array | Own table (`notifications`) |
| Tenancy | None — every user can theoretically be seen by everyone | Tenants table + tenant_id everywhere + RLS |
| Roles | 3 hard-coded types + a "privileged" flag | RBAC via `tenant_members.role` with many roles |
| Status fields | Magic numbers ("authority > 100") | Proper enums |
| Activity tracking | None | `events` table from day 1 |
| Matching data | Frontend-only computed scores | Real database with embeddings (`candidate_embeddings`, `listing_embeddings`) |
| GHL state | Mixed into the user row | Dedicated `ghl_user_state` table |
| External integrations | None besides GHL & Stripe (env-var configured) | `integration_credentials` table with encrypted per-tenant credentials |

---

## 6. Hard Problems Worth Naming

These aren't decisions; they're things to plan for.

### 6.1 — Auth migration (the hardest one)
v3 stores password hashes itself (salt + hashed password in the user row). Supabase Auth manages passwords differently. **We cannot just copy v3 password hashes into Supabase.** Two options:
- **A:** On first v4 login, prompt every user to reset their password. Easiest to implement, friction for users.
- **B:** Implement v3's hash verifier as a Supabase custom auth hook so old passwords keep working until users naturally update them. More complex; smoother UX.

This will be tackled fully in the migration plan doc.

### 6.2 — DynamoDB → Postgres data shape changes
v3's nested-array storage (applications inside listings, messages inside chats) means migration scripts have to **unpack** those arrays into many normalized rows. Doable but tedious; one DynamoDB scan can produce thousands of Postgres inserts.

### 6.3 — Tenants for v3 data
v3 has no concept of tenants. To migrate:
- Each client user becomes a tenant of type `client_company`
- Each talent user becomes a tenant of type `solo_talent` (so they have somewhere to "own" their data)
- Each admin user becomes a member of the `platform` tenant
- Bookmarks, applications, chats get assigned to the appropriate tenant during migration

### 6.4 — GHL opportunity IDs
v3 user rows reference GHL opportunity IDs. These survive the migration as-is — we copy them into `ghl_user_state`. The GHL API integration code itself gets ported from v3.

### 6.5 — Affiliate revenue/commission history
v3's referrals table stores arrays of revenue/commission events. We unpack these into the `referrals` table as historical records. Future events get written by v4 code.

---

## 7. What This Document Does NOT Decide

Deferred to [V4-MIGRATION-PLAN.md](V4-MIGRATION-PLAN.md):
- The actual SQL DDL (table creation scripts)
- The migration scripts (DynamoDB → Postgres data movement code)
- The cutover sequence (how v3 keeps running while v4 is built)
- The phased build order (what gets built first/second/third)
- Auth migration approach (option A vs B above)

Deferred to in-build decisions:
- Specific column constraints, indexes, triggers
- Backup/snapshot schedule (Supabase free tier = 7 days; paid = configurable)
- Specific RLS policy SQL (designed alongside each table during build)

---

## 8. What I Need From You Before The Migration Plan

Three questions worth answering now, but none are blocking:

### 1. The "solo talent as a tenant of one" pattern — yay or nay?
This treats every talent user as their own micro-tenant. Pro: uniform model, talent can own their own data. Con: a tiny bit more conceptual overhead. The alternative is to special-case talent (no tenant). I lean toward "solo talent tenant" for consistency.

### 2. Auth migration — Option A (force password reset) or B (custom hook)?
- A is faster to build but causes friction (every user has to reset).
- B is more polished but more complex.
- Recommend deciding before migration plan is written.

### 3. Are there any v3 data shapes I missed?
You're closer to v3 than I am. If you know of something v3 stores that I haven't mentioned (e.g., "we also track X for compliance reasons"), now's the time to flag it before we lock the schema.

---

## 9. What's Locked In By This Document

| Decision | Choice | Reversible? |
|---|---|---|
| Top-level entity model | Tenants → Users (+ memberships with roles) → Business data | **No** — bedrock |
| Multi-tenancy approach | `tenant_id` on every business table + RLS | **No** — bedrock |
| Normalize v3's nested arrays | Applications, messages, notifications all become own tables | Yes but expensive |
| Events table from day 1 | Required for ML — bake in | **No** |
| pgvector for embeddings | Enabled day 1 | Trivial to defer enabling but painful to retrofit |
| Identity provider | Supabase Auth (not custom) | Yes but very painful (re-migrating auth is the worst) |
| Magic-number replacement | Use proper enums everywhere | Yes |
| Affiliate / GHL preservation | Keep concepts and IDs; normalize structure | Yes |
