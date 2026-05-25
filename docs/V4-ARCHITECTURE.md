# V4-ARCHITECTURE.md — How RemoteRep v4 Is Built

> **Status:** Draft for owner review. No code has been built against this yet.
> **Audience:** Non-technical owner. Plain English first, technical detail second.
> **Goal:** Replace v3's AWS-heavy architecture with a stack that costs ~$25–50/month instead of ~$600/month, AND support v4's smarter product vision (ML-driven matching, AI features, multi-tenancy, integrations).

---

## 0. Product Vision (What v4 Is, Beyond Cost Savings)

v4 isn't just "v3 but cheaper." It's a substantially smarter product. The architecture has to support all of this from day 1, not as bolt-ons:

1. **Smarter matching algorithm** — improves over time as the system learns from outcomes (hires, rejections, time-to-hire, etc.).
2. **Every action stored for machine learning** — clicks, searches, views, applications, hires, time-on-page. An events log is a first-class part of the database, not an afterthought.
3. **Ranked sales reps in search** — when a client searches, results are ordered by "most likely successful hire" probability. The ranking model updates from observed outcomes.
4. **Beautiful dashboards** — modern analytics feel, with aggregations and (where useful) real-time updates.
5. **AI features** — coming. Likely uses: candidate summaries, search query understanding, automated outreach drafting, similarity-based matching via embeddings.
6. **Multiple user types** — candidates, clients, recruiters, agency owners, RemoteRep admins, and more to be added.
7. **Multi-tenant** — Agency A's data is invisible to Agency B. Enforced at the database level so it's impossible for a coding mistake to leak data between tenants.
8. **External integrations** — coming. Targets include ATS (Greenhouse, Lever, Workday-class), payroll, calendars (Google/Outlook), Stripe (already present).

These shape every section of this document. Where a section says "this is how we do X for ML/AI/multi-tenancy/integrations," that's why.

**What we are deliberately NOT building yet:** custom ML training pipelines, GPU infrastructure, our own auth provider, custom analytics warehouse. We use third-party APIs (OpenAI/Anthropic) for AI and Postgres for analytics until the day they can't keep up — which is years away for a business of any reasonable size.

---

## 1. The Big Picture

RemoteRep v4 is made of **five connected pieces**, each one a separate service. Picking each piece individually (instead of using one giant provider like AWS) is how we cut costs by 90%+.

```
                      ┌─────────────────┐
                      │   GitHub        │  ← code lives here
                      └────────┬────────┘
                               │ (push code → auto-deploy)
                               ▼
                      ┌─────────────────┐
                      │   Railway       │  ← runs your app
                      │  (Next.js +     │
                      │   Node server)  │
                      └────────┬────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌──────────┐    ┌───────────┐   ┌────────────────┐
       │ Supabase │    │  Resend   │   │ Cloudflare R2  │
       │ (data +  │    │ (emails)  │   │ (file uploads) │
       │  login)  │    │           │   │                │
       └──────────┘    └───────────┘   └────────────────┘
```

When a user visits your site:
1. Their browser loads your app from **Railway**
2. The app reads/writes data in **Supabase**
3. If the app needs to send an email, it asks **Resend**
4. If a user uploads a resume, the file goes to **Cloudflare R2**
5. New code you write gets pushed to **GitHub**, and Railway automatically redeploys

That's it. Five pieces. Each one does one job well.

---

## 2. What Each Piece Does (Plain English)

### 🚆 Railway — Your App's Home

**What it is:** A service that takes your code and runs it on the internet. Like Netflix for software — you upload your show, they handle the projector, the screen, the popcorn machine.

**What it replaces:** AWS ECS + ALB + NAT Gateway + a bunch of related services.

**Why we picked it:**
- Deploys automatically when you push code to GitHub. No manual deploys.
- One simple dashboard, not a dozen AWS consoles.
- Pricing is predictable and usage-based ($5 base + ~$0.000463/GB-hour of memory). Small apps pay $5–20/month. Larger ones pay $50–100. Compare to AWS where load balancers alone cost $20/month just to exist.
- Easy to leave if needed — your app is just a container, runs anywhere.

**What it can't do:** Massive scale (millions of requests/sec). At that point you'd graduate to AWS or GCP. You're nowhere near that, and won't be for years.

### 🗄️ Supabase — Your Database + Login System

**What it is:** A managed Postgres database, plus a built-in user-login system, plus a file storage system, all in one product. Like having a personal database administrator and a security guard packaged together.

**What it replaces:** AWS DynamoDB (database) and parts of AWS Cognito or your own JWT system (login). It can also replace S3, though we're using Cloudflare R2 for that — see below.

**Why we picked it:**
- **Postgres is the standard SQL database** — well understood, lots of tooling, easy to hire help for. (Unlike DynamoDB, which is AWS-specific.)
- **Built-in auth** means we don't have to write password hashing, password reset emails, session management, etc. Huge time saver.
- Free tier covers up to 50,000 monthly active users and 500MB of database — likely more than enough to start.
- $25/month "Pro" tier gives 100,000 monthly active users, 8GB database, daily backups for 7 days. Most small businesses live in this tier forever.
- Built on standard Postgres, so if you ever leave Supabase, you take your database with you. No lock-in.

**What it can't do (or does worse):** Real-time features at huge scale, super-custom auth flows. Not relevant to RemoteRep.

### 📧 Resend — Email Sender

**What it is:** A service that sends emails on behalf of your app (password resets, notifications, marketing). They handle the "deliverability" headache so your emails don't land in spam.

**What it replaces:** AWS SES.

**Why we picked it:**
- Free up to 3,000 emails per month, then $20/month for 50,000.
- Modern API (much simpler code than SES).
- Has React Email templates — write emails in code that looks like a webpage, get nicely formatted output.
- Easy to swap for Postmark or SendGrid if Resend ever disappoints.

**What it can't do:** Send marketing blasts at huge scale (think millions). For that you'd want Mailgun or SendGrid. Not relevant to RemoteRep right now.

### 📂 Cloudflare R2 — File Storage

**What it is:** Cloud storage for the files users upload (resumes, profile photos, income docs). Like Dropbox for your app.

**What it replaces:** AWS S3.

**Why we picked it:**
- Uses the **same API as S3** — so any code written for S3 works on R2 with minimal changes.
- **No egress fees.** This is the big one. AWS S3 charges you ~$0.09 per GB to download files. R2 charges $0. If your app sends a lot of files to users, this saves serious money.
- $0.015 per GB of storage per month (vs S3's $0.023). For 10GB of uploads, that's $0.15/month. Cheap.
- Cloudflare is a big stable company that's not going anywhere.

**What it can't do:** Run complex data processing (S3 has integrations with AWS analytics tools). Not relevant to RemoteRep.

### 🐙 GitHub — Code Storage

**What it is:** Already set up. Your code lives in `github.com/remoterobert/RemoteRep---v4`. Every code change is saved with full history.

**Why it's relevant to architecture:** Railway watches your GitHub. When you push a change, Railway sees it and redeploys automatically. This is how you go from "Claude edited a file" to "users see the change live" without manual deploy steps.

---

## 2.5. How The Architecture Supports The Vision

The five pieces from Section 2 are vendor choices. The refinements below are **patterns we follow inside that stack** to make the vision work. None of these add new vendors. All of them must be baked in from day 1, because retrofitting them later is painful.

### A) Events table — first-class, from day 1

Every meaningful user action writes one row to a single `events` table in Postgres. The payload uses Postgres' `jsonb` type so we can store any shape of data without schema migrations every time a new event type is added.

```
events
├─ id (uuid)
├─ tenant_id (uuid)        ← who owns this event (multi-tenancy)
├─ user_id (uuid)          ← who did it
├─ event_type (text)       ← "candidate.viewed", "search.run", "hire.completed", etc.
├─ entity_type, entity_id  ← what was acted on
├─ payload (jsonb)         ← any extra details
└─ created_at (timestamp)
```

**Why it matters:** ML features need training data. If we don't capture events from launch, we have no training data when we want to train. **Capture broadly now, decide what's useful later.**

**Scale considerations:** Postgres handles tens of millions of rows fine. If event volume becomes huge (10M+/day), we add ClickHouse or a similar columnar store. We're nowhere near that and won't be for a long time.

### B) `pgvector` enabled in Supabase from day 1

`pgvector` is a Postgres extension that lets us store and search "embeddings" — numeric fingerprints of text, images, or other data. Two AI/ML capabilities depend on it:

- **Semantic search** — "find sales reps similar to this top performer" beyond exact keyword match.
- **AI recommendations** — power the matching algorithm with embedding-based similarity.

Enabling it is one click in Supabase. **Free.** Painful to retrofit if data already exists without embedding columns.

### C) Multi-tenancy via Postgres Row-Level Security (RLS)

Multi-tenancy is enforced at the **database layer**, not the application layer. Here's the difference:

- **App-level (fragile):** Every query in the code remembers to filter by tenant. One forgotten filter = data leak.
- **Database-level (safe):** Postgres itself refuses to return data from the wrong tenant. Even if a coding mistake happens, no data leaks.

**Implementation:**
- Every business-data table has a `tenant_id` column.
- Every table has RLS policies like *"a user can only see/modify rows where `tenant_id` matches the tenant they belong to."*
- RemoteRep admins get an override policy (they can see across tenants).
- Supabase has first-class RLS support — this is one reason we picked it.

### D) Role-based access (RBAC)

Multiple user types means we can't hardcode "if user.type == 'candidate' then…" checks scattered through the code. Instead:

- A `roles` table defines roles (candidate, client, recruiter, agency_owner, admin, etc.).
- A `user_roles` table maps users → roles (a user can have multiple).
- Permissions checks ask: "does this user have a role that allows action X on entity Y?"

Easy to add new roles later. Easy to grant a user temporary admin access. Easy to audit.

### E) Background jobs — staged approach

Lots of things in v4 need to run on a schedule or in response to events, not when a user clicks a button:
- Nightly recomputation of matching scores
- Dashboard rollup aggregations
- Periodic syncs with ATS / payroll / calendar integrations
- Sending scheduled email digests

**Phase 1 (launch):** Supabase Edge Functions on cron schedules. Built-in, free at low usage.

**Phase 2 (when complexity grows):** Add Inngest ($0–20/mo, generous free tier) for workflows with retries, branching, long-running jobs. Or run a Railway worker service ($5–10/mo extra).

We start with Phase 1 and only graduate when needed.

### E.5) Where custom business logic lives — Unified Next.js (decided 2026-05-25)

v4 uses **one codebase**: a Next.js app that contains both the frontend (pages users see) AND the backend (API endpoints under `app/api/*/route.ts`). One Railway service runs the whole thing.

This is in contrast to v3, which had a separate Express backend. Reasons for unifying:
- **One codebase** = easier to maintain, single deploy, shared TypeScript types end-to-end.
- **One Railway service** = lower hosting cost ($5–15/mo instead of $10–20/mo).
- **Standard modern pattern** = lots of community examples, easy to find help.

The browser can still talk directly to Supabase for simple cases (real-time subscriptions, direct file uploads to Storage), but the **default pattern** is: browser → Next.js API route → Supabase / Stripe / GHL / etc. This keeps business logic in normal server code where it's easy to read, test, and modify — rather than scattered across RLS policies and Edge Functions.

**Multi-tenancy enforcement still happens at TWO layers** (defense in depth):
- Database-level RLS policies (catches anything that bypasses the API)
- API-route-level checks (catches things before they hit the database)

### F) AI API calls go through a single wrapper

All calls to OpenAI / Anthropic / any LLM go through one helper module in the codebase. **Never** call the AI SDK directly from feature code. The wrapper handles:

- **Cost tracking** per user, per feature, per day. AI spend is the new "AWS bill" risk — unbounded usage can rack up serious money fast.
- **Hard budget caps** — if today's spend hits a configured limit, the wrapper returns an error or cached response instead of calling the API.
- **Rate limiting** — protect against runaway loops or abuse.
- **Caching** — identical prompts return cached responses (huge cost saver).
- **Provider switching** — start with one provider, easily swap or add a fallback later.

**This is non-optional.** Every AI feature gets gated through this helper before it touches production.

### G) Dashboard query strategy — materialized views

"Beautiful dashboards" usually means aggregations: counts, sums, time-series. If we run those queries against the raw `events` table every time someone loads a dashboard, performance degrades as data grows.

Instead, we use **Postgres materialized views** — pre-computed result tables, refreshed on a schedule (e.g., every 5 min for "today's metrics", nightly for historical reports). Dashboard queries hit the view, which is small and fast.

This is a well-understood Postgres pattern. No new tools required.

### H) Integration architecture (webhooks + OAuth + credential vault)

Integrations with ATS, calendars, payroll have two directions:

- **Inbound (webhook receivers):** External services POST to our Railway endpoints when something happens on their side. Need: signature verification, idempotency (don't double-process), retry handling.
- **Outbound (we call their API):** Need stored OAuth tokens per tenant (one tenant's Greenhouse account ≠ another's), refresh handling, rate limiting.

**Credential storage:** OAuth tokens, API keys etc. go in **Supabase Vault** — Postgres column-level encryption. Not plaintext, not in env vars, not in app code.

**Background jobs (Section E)** handle scheduled syncs.

---

## 3. How Money Adds Up (Cost Projection)

### Today's bill (v3 on AWS): ~$600/month

### v4 estimated bills at different scales:

| Scale | Railway | Supabase | Resend | R2 | **Total** |
|---|---|---|---|---|---|
| **Just launched** (under 1,000 users, low activity) | $5 | $0 (free) | $0 (free) | $0–1 | **~$5–10/mo** |
| **Growing** (5,000 users, moderate activity) | $15 | $25 | $0 (free) | $2 | **~$42/mo** |
| **Established** (50,000 users, heavy activity) | $50 | $25 | $20 | $10 | **~$105/mo** |
| **Big success** (500,000 users) | $200 | $100+ | $50 | $50 | **~$400/mo** |

**Even at "big success" scale, you're paying less than v3 costs today** — and v3 isn't anywhere near that scale.

### Hidden costs to be aware of

- **Domain name renewal** (~$10–15/year, separate from any of these services)
- **SSL certificates** — free, handled automatically by Railway and Cloudflare
- **Email-from-your-domain setup** — Resend will guide you through DNS records, free
- **Bandwidth overages** — if your traffic spikes hugely, Railway charges for excess. We'll set spending alerts.

---

## 4. How A Single User Request Travels (Technical, But Useful To Understand)

This is what happens when a user does something on your site:

```
1. User clicks "Sign in" on remoterep.com
   └─→ Browser loads JavaScript from Railway (Next.js app)

2. User enters email/password and clicks submit
   └─→ Browser sends login request to Railway (Node server)

3. Node server asks Supabase: "Is this user valid?"
   └─→ Supabase checks password, returns "yes, here's a session token"

4. Node server saves session, returns "you're logged in" to browser
   └─→ Browser now shows the logged-in view

5. User uploads their resume
   └─→ Node server gets a signed URL from Cloudflare R2
   └─→ Browser uploads file directly to R2 (skipping the server — fast)
   └─→ Node server saves the R2 file location in Supabase

6. Supabase sends a "welcome" email
   └─→ Supabase triggers Resend
   └─→ Resend sends the email to the user's inbox
```

Each step is independent. If Resend goes down, login still works. If R2 goes down, login still works. This is **a deliberate design choice** — we don't want one vendor's outage to break the whole app.

---

## 5. What Happens When Something Breaks

### If Railway goes down (rare, but happens)
- Your app is offline until they fix it. Outages are usually 5–30 min, a few times a year.
- We can have a backup deploy ready on Render or Fly.io as insurance ($0 if not in use). **Optional, not required for launch.**

### If Supabase goes down
- App can't read/write data. Same as Railway — rare, brief.
- All your data is yours (it's standard Postgres), so worst case we can dump it and restore elsewhere.

### If Resend goes down
- Emails queue up (Resend's side) or fail. Users can still use the app; some don't get their welcome emails until it's fixed.
- We code with retries and a fallback "resend later" queue.

### If Cloudflare R2 goes down
- New file uploads fail. Existing files unavailable.
- R2 is Cloudflare; their uptime is extremely good.

### If GitHub goes down
- You can't push new code. App keeps running on whatever was last deployed.
- This is fine — you'd just wait it out.

### If YOU lose access to one of these accounts
- We document login recovery in [BACKUPS.md](../BACKUPS.md) and store account info in a password manager (1Password / Bitwarden recommended). **This is the most likely real risk — losing access matters more than any service going down.**

---

## 6. How "Locked In" Are We?

A common worry with managed services is vendor lock-in. Here's an honest read:

| Service | Lock-in risk | If we ever needed to leave |
|---|---|---|
| **GitHub** | Very low | Clone to GitLab/Bitbucket in 5 minutes |
| **Railway** | Very low | App is a Docker container; runs on Render, Fly, AWS, anywhere. Move = 1 day. |
| **Supabase** | Low | Standard Postgres. Dump → restore elsewhere. Auth needs some code changes. Move = 1 week. |
| **Resend** | Very low | API is one function. Swap with Postmark/SendGrid = 1 hour. |
| **Cloudflare R2** | Very low | S3-compatible. Move to S3/Backblaze = change config, copy files. 1 day. |

Worst case (Supabase goes evil and triples prices): you can leave in a week. Compared to AWS where leaving means re-architecting half the app, this is **dramatically better**.

---

## 7. What This Document Does NOT Cover Yet

Three things deliberately left for follow-up documents:

1. **What features v4 has** → coming in [V3-FEATURE-AUDIT.md](V3-FEATURE-AUDIT.md). I'll read v3's code and produce a non-technical feature list so v4 doesn't accidentally drop something.

2. **Database schema (what tables exist, what they store)** → coming in [V4-DATA-MODEL.md](V4-DATA-MODEL.md). This is where DynamoDB → Postgres translation gets designed in detail.

3. **The actual rebuild plan (what gets built first, second, third)** → coming in [V4-MIGRATION-PLAN.md](V4-MIGRATION-PLAN.md). Includes data migration from v3 DynamoDB, cutover strategy, and how v3 keeps running until v4 is ready.

---

## 8. Decisions This Document Locks In

### Vendor decisions (easy to change)
| Decision | Choice | Reversible? |
|---|---|---|
| Hosting platform | Railway | Yes — can move to Render/Fly/etc. with ~1 day of work |
| Database | Postgres via Supabase | Yes — Postgres is portable. Moving providers ~1 week. |
| Email | Resend | Yes — swap providers ~1 hour |
| File storage | Cloudflare R2 | Yes — S3-compatible, moves trivially |
| Code repo | GitHub (`remoterobert/RemoteRep---v4`) | Yes — already moved once |
| Background jobs (initial) | Supabase Edge Functions on cron | Yes — Inngest/Railway worker is the upgrade path |

### Strategic decisions (harder to change)
| Decision | Choice | Reversible? |
|---|---|---|
| Migration approach | Migrate ALL v3 data to v4 | Yes, but expensive to change (would mean redoing migration scripts) |
| Architecture style | Modular (5 services, each replaceable) | Yes — could merge to monolith later if wanted |
| Backend codebase | Unified Next.js (frontend + API routes in one app) | Yes — could split off Express backend later if needed for mobile/etc. |
| Multi-tenancy enforcement | Database-level RLS + API-route checks (defense in depth) | **No** — retrofitting later is extremely painful. Bake in from day 1. |
| Events table for ML | First-class part of schema from day 1 | **No** — without early adoption, we lose months of training data |
| `pgvector` enabled | Day 1 | Trivial to enable upfront; awkward to retrofit |
| AI API access pattern | Single wrapper module, never direct SDK calls | Reversible but undisciplined drift makes cost control impossible |
| Auth provider | Supabase Auth (built into chosen DB) | Yes — but auth migration is always painful (passwords/sessions) |
| GoHighLevel (CRM) | Keep — port the v3 integration | Yes, but expensive to remove |

---

## 9. What I Need From You Before The Next Document

Nothing right now. **Read this, ask questions, push back on anything that doesn't sit right.** Once you're comfortable with this architecture, I'll write the next doc (V3-FEATURE-AUDIT.md), which doesn't depend on you doing anything — I just read your existing code.

If something here is unclear, the answer "I don't understand piece X" is a useful answer. The whole point of this doc is to make sure you're not asked to approve something you don't follow.
