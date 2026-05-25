# V4-MIGRATION-PLAN.md — How v4 Actually Gets Built And Launched

> **Status:** Draft for owner review. This is the last planning doc before code starts.
> **Audience:** Non-technical owner. Phases described in plain English; technical detail in side notes.
> **Purpose:** Turn the architecture (V4-ARCHITECTURE.md), the v3 audit (V3-FEATURE-AUDIT.md), and the data model (V4-DATA-MODEL.md) into a sequenced, week-by-week build plan with explicit risk callouts and a cutover runbook.

---

## 0. The Honest Disclaimer About Timing

Every phase below has a **week range estimate** (e.g., "2-3 weeks"). These assume:
- I (Claude) am doing the build work with you reviewing/approving at each step (per WORKFLOW.md).
- We're working at a steady pace — not maximum-velocity, not stopping for weeks.
- No surprise scope changes mid-build.

Real-world likely outcome: **add 30-50%** to my estimates. Software always takes longer than planned. The honest range for a full v4 rebuild is **~3-5 months** from "first commit" to "v4 launches to all users."

Two ways to make it faster:
- **Reduce scope** for MVP (Section 2 below has a lean option that cuts ~30% of work).
- **Defer features to post-launch** instead of trying to ship parity with v3 on day 1.

---

## 1. The 11 Phases (At A Glance)

Each phase is a self-contained chunk of work with a clear "done" criterion. You'll see results at the end of every phase, not just at the end of the project.

| # | Phase | Estimated weeks | What's done at the end |
|---|---|---|---|
| 0 | Foundation setup | 1 | "Hello world" v4 deployed to a staging URL. All infrastructure wired up. |
| 1 | Core schema + auth | 2-3 | Users can sign up & log in. Multi-tenancy enforced. No app features yet. |
| 2 | Talent core | 2 | Talent can sign up, build profiles, upload files. Clients can browse them. |
| 3 | Client core + listings + payments | 2 | Clients can post jobs and pay via Stripe (one-time + subscription). |
| 4 | Applications + chat | 2 | End-to-end marketplace flow works. Talent applies, clients respond, real-time chat. |
| 5 | Notifications + email | 1 | Users get notified via in-app, push, and email (all 11 templates ported). |
| 6 | GHL integration | 1 | Port v3's GoHighLevel integration. New v4 signups create GHL opportunities. |
| 7 | Affiliate program | 1 | Referral codes, conversion tracking, affiliate dashboard. |
| 8 | Events + dashboards | 1-2 | Activity logging live. Basic admin dashboards. |
| 9 | Data migration scripts + dry-run | 1 | v3 DynamoDB → v4 Postgres scripts written, tested on staging. |
| 10 | Cutover to production | 1 (mostly waiting) | v4 is live. v3 archived (still recoverable for ~30 days). |
| 11+ | AI/ML features | Post-launch, ongoing | Embeddings, vector matching, AI features, real ranking algorithm. |

**Total to launch (parity with v3):** ~15-17 weeks of active work. Add buffer = ~4-5 calendar months.

---

## 2. MVP Scope Decision (Important — Read Before Reviewing Phases)

You have two reasonable paths to launch:

### Path A — Full Parity MVP
Phases 0-10 all complete before launch. v4 launches with everything v3 has today. Affiliate program, GHL sync, admin dashboards — all live on day 1.

- **Pros:** No user-visible regressions. "Just a newer version" feel. Easier to communicate to existing users.
- **Cons:** ~15-17 weeks before anyone sees it. Longer time-to-value for cost savings.

### Path B — Lean MVP (Recommended)
Launch after Phase 5. Phases 6-8 come as fast-follow updates within 4-6 weeks of launch.

- **Pros:** Launch ~10 weeks instead of ~16. Start saving the $600/mo bill 6 weeks earlier. Faster feedback loop.
- **Cons:** Affiliate program / GHL sync / admin dashboards are temporarily unavailable in v4. Existing v3 affiliates would have a brief window where they can't see their dashboard.

### Path B special considerations
- **GHL integration:** If you defer GHL to fast-follow, new v4 signups won't create GHL opportunities during the gap. We'd need to either (a) accept this 4-6 week gap, (b) write a "catch-up script" that creates GHL opportunities for missed signups once Phase 6 ships, or (c) keep a v3 endpoint that v4 calls for GHL during the gap.
- **Affiliates:** If you have active affiliates, deferring Phase 7 means their dashboards go dark for ~4 weeks. Tracking still happens (we log the events); just no UI. Manual payouts continue to work (you have the events).

> **Recommendation:** Path B (Lean MVP) unless you have active affiliates who would object to a temporary dashboard gap.

**This decision is the gate to Phase 0** — we don't start building until you pick.

---

## 3. Phase-by-Phase Detail

For each phase, you'll see:
- **Goal** — what "done" means
- **What I build** — the work items
- **What you need to do** — your decisions, account creations, approvals
- **Risks** — what could go wrong
- **Cost impact** — when new services start charging

### Phase 0 — Foundation Setup (Week 1)

**Goal:** A "hello world" v4 is deployed to a staging URL. All infrastructure accounts exist and are wired together.

**What I build:**
- New Next.js + TypeScript project structure inside the existing v4 repo (replaces v3's `client/` and `server/`)
- Tailwind setup (matches v3's styling toolchain)
- Database migrations system (e.g., `supabase migration`)
- CI/CD on Railway (auto-deploy when commits land on `main`)
- Basic landing page that says "v4 staging"
- Environment variable management (Railway secrets, local `.env` for dev)
- Pre-commit hooks (linting, TypeScript checks)

**What you need to do:**
- Create accounts on: Railway, Supabase, Resend, Cloudflare (R2 + DNS). I'll walk you through each.
- Provide billing info for Railway and Supabase (free tiers cover Phase 0-1, but you'll need to enter card info eventually).
- Decide on **staging domain** (e.g., `staging.remoterep.com`) — needs DNS access.

**Risks:**
- Account setup friction (signups, billing, DNS verification). Usually 1-2 hours of clicking.
- Domain ownership/DNS access — if you don't currently control DNS for remoterep.com, this could be a multi-day blocker.

**Cost impact:** $0 — everything stays on free tiers in Phase 0.

---

### Phase 1 — Core Schema + Auth (Weeks 2-3)

**Goal:** A new user can sign up and log in to v4. Multi-tenancy is enforced at the database level. No app features beyond auth.

**What I build:**
- All identity/tenancy tables from V4-DATA-MODEL.md Section 4.1 (`tenants`, `users`, `tenant_members`)
- RLS policies for every table (this is most of the security work — careful, slow, tested)
- Supabase Auth configured with **the custom password verifier hook** that validates v3-format passwords (per the auth migration decision)
- Sign-up flow: email → verify → choose role (talent vs. company creator) → create tenant if applicable
- Login + logout flows
- Password reset flow
- Email change flow
- Email templates for verification, password reset, email change (Resend integration, ported from v3's templates)

**What you need to do:**
- Review proposed RLS policies before they go live (security-critical — I'll explain each one in plain English).
- Verify your domain with Resend (DNS records — same domain access requirement as Phase 0).

**Risks:**
- **The custom password verifier hook is the riskiest piece of the entire migration** (per V4-DATA-MODEL.md Section 6.1). If v3's password hashing format is unusual or buggy, the hook can fail in subtle ways. Mitigation: extensive testing against a dump of v3 password hashes before any real user touches it.
- RLS policy bugs = data leakage. Mitigation: write tests that try (and verify they fail) to access cross-tenant data with various role combinations.

**Cost impact:** Still $0 — Supabase free tier, Railway free tier, Resend free tier.

---

### Phase 2 — Talent Core (Weeks 4-5)

**Goal:** Talent users can sign up, build their full profile (experience, goals, files), and clients can browse the talent pool. No applications yet.

**What I build:**
- Tables from V4-DATA-MODEL.md Section 4.2 (`candidate_profiles`, `candidate_experiences`, `candidate_goals`, `candidate_files`)
- Talent onboarding flow (multi-stage: profile → experience → goals → files)
- File uploads to Cloudflare R2 (direct browser → R2 signed URLs, no server middle-man for the file itself)
- Talent profile edit UI
- Profile visibility toggle (hidden vs. public)
- Public talent profile page (`/profiles/[userId]`)
- "Browse talent" page for clients (basic search/filter — no matching algorithm yet)

**What you need to do:**
- Create the Cloudflare R2 bucket (I'll guide).
- Approve the talent profile UX (we'll look at v3's flow and decide what to keep/change).

**Risks:**
- File upload edge cases (size limits, bad file types, R2 errors).
- v3 vs v4 UX divergence — if I rebuild the profile UI from scratch, it'll look different from v3. Decide upfront whether to copy v3's UX exactly or modernize.

**Cost impact:** R2 charges start (~$0-1/month at low usage).

---

### Phase 3 — Client Core + Listings + Payments (Weeks 6-7)

**Goal:** Clients can sign up, create their company tenant, post job listings, and pay for them via Stripe (one-time per listing OR $780/month subscription).

**What I build:**
- Client signup → creates a `client_company` tenant, makes the user a `client_admin`
- Client profile UI (company info, photo, industry, headcount)
- Listings tables (`listings`, `listing_details`, `listing_requirements`)
- Create-listing flow (mirrors v3's structure: title, description, requirements, etc.)
- Listings management (edit, archive, visibility toggle)
- Stripe integration:
  - Stripe Checkout for one-time $299 listing payments
  - Stripe Subscriptions for $780/mo "Full Access"
  - Webhook handler for payment confirmation
  - Subscription cancel/resume flows
- Tables: `stripe_customers`, `stripe_subscriptions`, `payments`, `listing_payments`
- The "client can browse talent only if they have a paid listing or active subscription" gating logic

**What you need to do:**
- Provide your Stripe API keys (test mode first, then production).
- Confirm the price model: still $299/listing and $780/month? Or any changes?
- Decide if there are any pricing changes for v4 launch (this is a good moment to revisit pricing).

**Risks:**
- Stripe webhook reliability — if a webhook is missed, payments don't reflect. Mitigation: idempotent processing + periodic reconciliation job.
- Subscription edge cases (failed payments, dunning, refunds) — Stripe handles most of this but the v4 code needs to react correctly to Stripe events.

**Cost impact:** Stripe takes their cut of payments (2.9% + 30¢ per transaction — same as today).

---

### Phase 4 — Applications + Chat (Weeks 8-9)

**Goal:** The full marketplace loop works. Talent can apply to listings, clients can respond, both can chat in real-time.

**What I build:**
- `applications` table (per V4-DATA-MODEL.md Section 4.4) — replaces v3's nested-array storage
- Application submission flow (talent applies with optional message)
- Application status workflow (`bookmarked` → `invited` → `applied` → `interviewing` → `shortlisted` → `hired`/`rejected`/`withdrawn`)
- Client-side: view applications per listing, update status, add internal notes/ratings
- Chat tables (`chats`, `chat_participants`, `messages`)
- Real-time chat via **Supabase Realtime** (WebSockets — upgrade from v3's REST polling!)
- Edit/delete own messages
- Read receipts
- `bookmarks` table for save-for-later
- Bulk-bookmark API (mirrors v3 feature)

**What you need to do:**
- Test the full flow end-to-end on staging.
- Decide on chat moderation policy (auto-flag certain words? rate limits?).

**Risks:**
- Real-time chat scaling — Supabase Realtime is fine for our scale but specific patterns can hit limits. Mitigation: don't subscribe to entire tables, scope subscriptions tightly.
- Application status state-machine bugs (e.g., can you go from "rejected" back to "interviewing"?). Mitigation: explicit state-transition table.

**Cost impact:** Real-time subscriptions count against Supabase's monthly active user tier — at our scale, still inside free tier or basic Pro tier.

---

### Phase 5 — Notifications + Email (Week 10)

**Goal:** Users receive notifications across all 3 channels (in-app, push, email). All 11 v3 email templates ported to React Email.

**What I build:**
- `notifications` table + UI for the in-app notification feed
- `notification_channels` table for per-user preferences
- `push_subscriptions` table + Web Push (VAPID) integration
- Push notification sending on chat/application/invitation events
- Port the 11 v3 email templates to React Email components (modern, easier to maintain than v3's Maizzle-built HTML)
- Resend integration for all transactional sends
- Email preferences page

**What you need to do:**
- Review/approve the new email templates (they'll be functionally equivalent to v3's but visually polished).
- Generate new VAPID keys (browser push) — I'll guide; happens during setup.

**Risks:**
- Email deliverability — first-time domain sending from Resend may have lower deliverability until warmed up. Mitigation: gradual ramp, monitor bounces.
- Push notification permissions — users need to opt in. v3 already has subscriptions; we migrate them during cutover.

**Cost impact:** Resend stays free (under 3,000 emails/month) unless volume is high.

> **🎯 If we pick Path B (Lean MVP), the LAUNCH happens after this phase.** Phases 6-8 come as fast-follow updates 4-6 weeks post-launch.

---

### Phase 6 — GHL Integration (Week 11)

**Goal:** New v4 signups create GHL opportunities (same as v3). Tags update on payment/affiliate events. The GHL Express login link for affiliate dashboards works.

**What I build:**
- Port the v3 GHL service code to v4 (TypeScript, modern HTTP client)
- `ghl_user_state` table for storing opportunity IDs and tags
- Sync triggers: on user registration, on payment, on affiliate activation
- GHL Express login URL endpoint for the affiliate dashboard
- Background retry queue for failed GHL API calls (because GHL can be flaky)

**What you need to do:**
- Provide the v3 GHL API keys (`GHL_CLIENT_KEY`, `GHL_TALENT_KEY`).
- Confirm the GHL pipelines / tags are the same as v3 (we use what v3 uses unless you want changes).

**Risks:**
- GHL API quirks (the v3 code probably has some workarounds baked in — we need to preserve them).

**Cost impact:** $0 (GHL is a separate subscription you already pay).

---

### Phase 7 — Affiliate Program (Week 12)

**Goal:** Full affiliate program restored. Referral links work, conversions are attributed, affiliate dashboards show their data.

**What I build:**
- `affiliate_codes`, `referrals` tables
- Referral landing pages (`/r/[code]`)
- Click tracking
- Conversion attribution on payment events
- Affiliate dashboard with: visitors, leads, conversions, revenue, commissions
- Admin UI for managing affiliate codes (suspend, edit revenue share)

**What you need to do:**
- Confirm the 50% commission rate (or any changes).
- Decide on payout cadence/process documentation (v3 has none — manual is fine).

**Risks:**
- Conversion attribution edge cases (user clicks affiliate link → leaves → comes back via different link → converts). Mitigation: clear attribution rules, documented.

**Cost impact:** $0.

---

### Phase 8 — Events + Dashboards (Weeks 13-14)

**Goal:** The events table is populated by every feature in the app. Basic admin dashboards show platform metrics. The foundation is in place for ML features later.

**What I build:**
- `events` table + write hooks in every feature added so far (retrofit Phases 1-7 to log events)
- `audit_log` table for security-relevant actions
- Materialized views for dashboard aggregations
- Admin dashboard pages: user counts, payment metrics, application funnel, recent activity
- Refresh schedule for materialized views (Edge Function on cron)

**What you need to do:**
- Review which metrics matter most for the admin dashboards (so I prioritize the right ones).

**Risks:**
- Events table grows large over time. Mitigation: index strategy + partitioning ready to deploy when needed (not at launch).

**Cost impact:** Negligible — events live in Postgres, same DB.

---

### Phase 9 — Data Migration Scripts + Dry Run (Week 15)

**Goal:** We can confidently move all v3 DynamoDB data into v4 Postgres without data loss. Tested on staging environment with real v3 data.

**What I build:**
- Migration scripts in Node/TypeScript:
  - DynamoDB scan helpers (paginated, with retry)
  - Transformers (v3 row → v4 normalized rows for each entity)
  - Validators (ensure data integrity post-migration)
  - Idempotent loader (can re-run safely)
- Migration sequence document (which entities migrate in what order — dependencies matter)
- A "dry run" against a fresh staging Supabase project — load real v3 data, verify counts match, spot-check user accounts work.

**What you need to do:**
- Provide AWS read-only credentials for v3 DynamoDB (separate from the production-write keys).
- **Critical:** Spot-check ~10-20 random users in staging after dry run to confirm their data looks right.

**Risks:**
- **This is the second-riskiest phase** (after the auth hook). Bad migration = bad v4 data = bad launch.
- Mitigation: comprehensive validators, dry run on full data set, spot-check by you, run the migration twice (once on staging, then a final time on cutover day).

**Cost impact:** AWS DynamoDB scan fees (~$5-50 depending on table size — pennies per million reads, but full scans add up).

---

### Phase 10 — Cutover To Production (Week 16, Mostly Waiting)

**Goal:** v4 is live for all users. v3 is shut down (but recoverable for 30 days).

This phase is mostly **planned downtime** with careful execution. Detailed runbook in Section 4 below.

**What I do (compressed timeline on cutover day):**
1. Freeze v3 (read-only mode — block new writes, allow reads).
2. Run final data migration (incremental from last dry run).
3. Validate data in v4 Postgres.
4. Switch DNS from v3 → v4.
5. Verify production v4 works (run smoke tests).
6. Monitor closely for 48 hours.

**What you need to do:**
- Be available on cutover day for go/no-go decision.
- Send pre-launch email to users announcing the maintenance window.
- Be available for the first 24 hours post-cutover (if something is wrong, we may need decisions fast).

**Risks:**
- **Highest-risk single moment of the project.** Mitigation: detailed runbook (Section 4), rollback path documented and rehearsed.

**Cost impact:**
- AWS bill stops shrinking. Once cutover is verified stable (~2 weeks post-cutover), we decommission v3 AWS resources.
- New v4 costs become the steady-state bill (~$25-50/month).

---

### Phase 11+ — AI/ML Features (Post-Launch, Ongoing)

**Goal:** Realize the vision from V4-ARCHITECTURE.md Section 0 — smarter matching, AI features, ranked search results.

**Iterative work after launch.** Likely phases:
- **11.1:** Embeddings generation pipeline — write hooks in `candidate_profiles` and `listings` to generate vectors on insert/update. Store in `candidate_embeddings` and `listing_embeddings`.
- **11.2:** Vector-based matching — replace the placeholder "match score" with real semantic similarity.
- **11.3:** AI features round 1 — candidate summaries, AI-drafted outreach, semantic search.
- **11.4:** ML ranking model — train a model on the `events` table to rank candidates by likelihood of successful hire.
- **11.5+:** Future AI features as the vision evolves.

Each is its own mini-project with its own planning. Don't plan all of these now.

---

## 4. Cutover Day Runbook (Detailed)

The Phase 10 cutover deserves its own section because it's the single highest-risk moment.

### Pre-Cutover Checklist (Days Before)

- [ ] Phase 9 dry run completed successfully on staging.
- [ ] You've spot-checked at least 20 random users on staging and confirmed their data looks right.
- [ ] v4 staging has been used by you/me for at least 1 week as a final QA pass.
- [ ] Backup of v3 DynamoDB exported and saved (S3 export OR full table dump). Independent of AWS account.
- [ ] DNS TTL lowered to 60 seconds 48 hours before cutover (so DNS propagation is fast).
- [ ] Maintenance window emailed to users 48 hours in advance.
- [ ] Rollback plan documented (Section 4.4 below) and reviewed.
- [ ] You've decided on go/no-go criteria (Section 4.3 below).

### Cutover Sequence (The Day Itself)

Estimated duration: 2-4 hours of active work + 48 hours of monitoring.

**Timeline:**

| Time | Action | Responsible |
|---|---|---|
| T-30 min | Final pre-flight check on staging | Claude |
| T-15 min | Send "maintenance starting in 15 min" email to users | You |
| T-0 | Put v3 in read-only mode (block POST/PATCH/DELETE; allow GET) | Claude |
| T+5 min | Verify v3 is read-only (try a write, confirm it's blocked) | Claude |
| T+5 min | Trigger incremental data migration (only changes since last dry run) | Claude |
| T+30-60 min | Migration runs; we watch for errors | Claude |
| T+60 min | Run data validators on v4 Postgres | Claude |
| T+75 min | Spot-check 10 users on v4 (you confirm they look right) | You + Claude |
| T+90 min | **GO/NO-GO DECISION POINT** | You |
| T+95 min (if go) | Switch DNS to v4 | Claude |
| T+100 min | Verify v4 is reachable at production URL | Claude |
| T+105 min | Run end-to-end smoke tests (signup, login, browse, post listing) | Claude |
| T+120 min | Send "v4 is live" email to users | You |
| T+120 min → T+48 hr | **Active monitoring** — error logs, user reports, key metrics | Both |
| T+48 hr | Declare success, begin v3 decommission | You |
| T+30 days | Delete v3 AWS resources (after backup verified) | Claude |

### Go/No-Go Criteria

At T+90 min, we say GO only if **all** of these are true:
- Migration completed with zero "FATAL" errors
- Row counts in v4 match v3 within 0.1% (tiny tolerance for in-flight data)
- Spot-checked users look right
- v4 staging is responding normally (no degraded performance)
- You feel ready

Otherwise: NO-GO. Re-enable writes on v3 (we're still pointed at v3 via DNS). Investigate. Try again another day. **No-go is a totally acceptable outcome — it means the safety mechanisms worked.**

### Rollback Path

If we say GO but discover a critical bug in the first 24 hours:

**Quick rollback (< 30 min, recoverable):**
1. Switch DNS back to v3.
2. Re-enable writes on v3.
3. Manually reconcile any writes that happened on v4 (export them from v4 Postgres, replay them against v3 DynamoDB if possible).
4. Diagnose v4 issue; plan new cutover attempt.

**Slow rollback (> 24 hours after cutover):**
Same as above BUT manual reconciliation of v4 writes becomes painful. After 24+ hours of v4 traffic, we'd likely accept some data loss or hand-fix critical issues rather than full rollback.

> **Implication:** The first 24 hours after cutover are the high-vigilance window. After that, we're committed to v4 with on-the-fly bug fixes.

---

## 5. Things You'll Need To Do Across All Phases (Summary)

Pulled from the per-phase lists. Approximate timing:

| Phase | What you need to do | Time |
|---|---|---|
| 0 | Account signups (Railway, Supabase, Resend, Cloudflare). Provide DNS access. | 2-3 hours |
| 1 | Review RLS policies. DNS records for Resend verification. | 1 hour |
| 2 | R2 bucket setup. UX decisions for talent flow. | 1 hour |
| 3 | Stripe keys + pricing confirmation. | 30 min |
| 4 | End-to-end testing. Chat moderation policy. | 2 hours |
| 5 | Review email templates. Approve copy. | 1 hour |
| 6 | GHL API keys. Pipeline/tag confirmation. | 30 min |
| 7 | Affiliate program rules confirmation. | 30 min |
| 8 | Pick priority metrics for admin dashboard. | 30 min |
| 9 | AWS read-only credentials. Spot-check users. | 2 hours |
| 10 | Cutover availability (~half day). Email announcements. | Half day |

**Total owner time across the project: ~15-20 hours.** That's the "always-on" requirement for a non-technical owner driving a build with me.

---

## 6. Cost Timeline

When new service charges kick in:

| Phase | Service | Cost change |
|---|---|---|
| 0 | Railway, Supabase | $0 (free tiers) |
| 2 | Cloudflare R2 | ~$0-1/mo |
| 5 | Resend | $0 (under 3k emails/mo) |
| Anytime | Supabase Pro upgrade ($25/mo) | When you exceed free tier limits (50k MAU, 500MB DB) |
| Anytime | Railway scale-up | If usage exceeds $5 base tier |
| Phase 10 → +2 weeks | AWS savings | v3 bill starts shrinking; full ~$600/mo savings within 30 days of cutover |

---

## 7. Risk Register (Single Place To See All Project Risks)

| Risk | Phase | Severity | Mitigation |
|---|---|---|---|
| Custom password verifier hook fails | 1 | 🔴 High | Extensive testing against v3 hash dump before go-live |
| RLS policy bugs leak data across tenants | 1+ | 🔴 High | Automated tests that attempt cross-tenant access and verify failure |
| Stripe webhook missed | 3 | 🟡 Medium | Idempotent processing + reconciliation job |
| File upload bugs (size/type/R2 errors) | 2 | 🟢 Low | Standard validation + error handling |
| Real-time chat scaling limits | 4 | 🟢 Low | Stay inside Supabase tier; tight subscription scope |
| Email deliverability dip | 5 | 🟡 Medium | Domain warmup, monitor bounces |
| GHL API quirks | 6 | 🟢 Low | Port v3's workarounds; background retry queue |
| Conversion attribution edge cases | 7 | 🟢 Low | Documented rules |
| Events table grows huge | 8 | 🟢 Low | Index/partition strategy ready when needed |
| Data migration data loss | 9 | 🔴 High | Validators, dry run, spot checks, full v3 backup retained |
| Cutover failure | 10 | 🔴 High | Detailed runbook, go/no-go gate, rollback plan |
| AWS bill keeps charging post-cutover | Post-10 | 🟡 Medium | Decommission script + 30-day waiting period before destroying resources |

---

## 8. What This Document Locks In

| Decision | Choice | Reversible? |
|---|---|---|
| Build order | 11 phases as listed | Yes — can reorder if priorities shift |
| MVP scope | Path A or B (you decide) | Yes — can defer fewer/more phases |
| Cutover style | Big bang (one-day cutover, not gradual) | Yes — but per-tenant cutover is much harder with shared data |
| v3 retention post-cutover | 30 days, then decommission | Yes — can extend if you want longer safety net |
| Rollback window | First 24 hours = full rollback option | Yes — but after 24hr, partial rollback only |

---

## 9. What I Need From You Before Phase 0 Starts

**Required before any code:**

1. **MVP scope:** Path A (full parity) or Path B (lean, recommended)?
2. **Domain access:** Do you control DNS for remoterep.com (or wherever v4 will live)?
3. **A free hour to do account signups together:** Railway, Supabase, Resend, Cloudflare. I'll walk you through each.

**Nice-to-have (won't block Phase 0 but needed by Phase 1):**

4. **Staging vs. production strategy:** Will v4 launch at remoterep.com (replacing v3) or get its own URL first? If replacing, when do we cut DNS?

5. **Tolerance for breaking changes:** Will any URLs change in v4? (E.g., old v3 bookmarked URLs continuing to work in v4 — yes or no?)

When you've answered these, we're ready for Phase 0. **No code happens until you green-light.**
