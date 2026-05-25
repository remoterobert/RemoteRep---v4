# V3-FEATURE-AUDIT.md — Everything RemoteRep v3 Does Today

> **Status:** Draft for owner review.
> **Audience:** Non-technical owner. Organized by what users see, not by code structure.
> **Purpose:** Make sure v4 doesn't accidentally drop a v3 feature. Every section here is a checkbox v4 must consciously decide to keep, change, or drop.

---

## 0. What This Document Is (And Isn't)

**What it is:** A plain-English inventory of every user-facing feature, every integration, and every piece of data v3 currently manages. Compiled by reading the v3 source code.

**What it isn't:** A judgment on quality, a bug list, or a v4 design. The next two docs (data model, migration plan) make design decisions. This one just **records reality**.

If you find yourself thinking "I didn't know we had X" or "wait, we don't actually use Y anymore" while reading — flag it. Those are exactly the moments where v4 gets to slim down.

---

## 1. The 30-Second Summary

RemoteRep v3 is a **two-sided marketplace** connecting remote sales talent with companies hiring. It has:

- **Three user types:** Talent (sales reps), Clients (companies hiring), and Administrators (RemoteRep staff)
- **Payments via Stripe:** $299 per job listing OR $780/month for unlimited access
- **Built-in messaging** between users
- **An affiliate program** with 50% revenue share
- **Browser push notifications + transactional emails**
- **CRM integration** with GoHighLevel (GHL) for lead management
- **A simple matching algorithm** (in the frontend only — for UI preview match scores)

---

## 2. What Talent (Sales Reps) Can Do

### Account & Profile
- Sign up via separate talent-specific flow
- Verify email with a code
- Reset password / change email / change password
- Build a profile with photo, headline, about, video URL
- Track work experience, career goals, files (resume, portfolio)
- Upload resume (PDF, max 4MB) and profile photo (PNG/JPG, max 4MB)
- Set timezone and contact info
- **Toggle profile visibility** (hide from client searches)
- Activate the affiliate program (optional)
- Delete account

### Job Search & Applications
- Browse all job listings
- Browse client (company) profiles
- Bookmark favorite listings
- Bookmark favorite clients
- Submit applications to listings with a message
- Track application status: bookmarked → invited → applied → interviewing → shortlisted → hired
- View own application history in "My Applications"

### Communication
- Receive in-app + push + email notifications
- Chat with clients (real-time-ish — built on REST, not WebSockets)
- Edit own messages
- Delete own messages

### Onboarding
- Multi-stage onboarding flow: profile → experience → goals → files
- Completion tracked via a flag on the user record

---

## 3. What Clients (Companies Hiring) Can Do

### Account & Profile
- Sign up via separate client-specific flow
- All the standard auth features (verify email, reset password, etc.)
- Build a company profile (photo, industry, headcount)
- Set contact info
- Toggle profile visibility
- Manage subscription (cancel / resume)
- Activate the affiliate program

### Hiring Workflow
- **Create job listings** with: title, description, instructions, calendar link, benefits, commitment, compensation, sales role, requirements (technologies, lead types, education, industries, experience levels)
- **Pay** for listing visibility ($299 one-time per listing OR $780/month "Full Access" subscription)
- Edit listings; toggle listing visibility (requires active subscription)
- Browse the talent database
- Bookmark individual talent
- **Bulk bookmark** multiple talent at once
- View talent public profiles with **match scores** (simple frontend-only matching)
- Send invitations to specific talent
- View applications per listing
- Update application status (invited / interviewing / shortlisted / hired)
- Add notes/ratings on applications

### Subscription Behavior (a real quirk worth noting)
- Browsing talent requires either: (a) an active subscription, OR (b) at least one paid listing
- "Last access" is tracked per client to determine eligibility
- Subscription stored as Stripe subscription with expiration date

---

## 4. What Administrators Can Do

### User Management
- List all users with full details
- Create users manually (admin-registered, not self-registered)
- Edit any user's contact info, tags, notes, account type
- Delete users
- Reset any user's password
- **Impersonate any user** (log in as them for support/debugging)
- Mark accounts as "privileged" — they bypass payment requirements

### Affiliate Management
- View all affiliate codes
- Edit affiliate code metadata
- Track per-code metrics

### Analytics
- User counts (talent / clients / admins / total)
- Payment counts and subscription data

### Account Suspension
- Set authority level to 99 to suspend a user — they see a "suspended" page on login

---

## 5. Cross-Cutting Features

### Chat / Messaging
- Direct messages between any two users
- Stored as conversation threads with all messages
- Edit / delete own messages
- Read receipts (tracked per user per chat)
- Triggers notifications on each message
- **NOT real-time** (REST polling, not WebSockets) — feels real-time-ish but isn't

### Notifications (three channels)
- **In-app notifications** stored per user, marked seen/unseen, deduplicated to prevent spam (e.g. "you have 5 new chat messages from Bob" instead of 5 separate notifications)
- **Browser push notifications** via Web Push API + VAPID keys
- **Email notifications** via AWS SES — 11 transactional email templates
- Notification types: chat messages, new applications, application status changes, invitations, generic updates

### Payments (Stripe)
- One-time payment: **$299 per listing**
- Recurring subscription: **$780/month "Full Access"**
- Affiliate revenue split: **50% commission to affiliate when applicable**
- Subscription lifecycle: create / cancel / resume
- Payment session creation + post-payment verification webhook

### Affiliate Program
- Users opt in to become affiliates
- Each affiliate gets a code → landing page at `/r/[code]`
- Tracks: visitors → leads → conversions → churned → revenue → commissions
- Integrates with GoHighLevel for affiliate dashboard
- Admins can view, edit, suspend affiliate accounts

### Match Scoring
- **Implemented in the frontend only** — calculated in JavaScript for UI preview
- Based on simple requirements overlap (technologies, industries, experience, etc.)
- **NOT stored, NOT updated by ML, NOT a real ranking algorithm.** This is the area v4 most needs to grow into (per the vision: ML-driven matching, ranked results).

### File Uploads
- Profile photos (PNG/JPG/JPEG, 4MB max)
- Resumes (PDF only, 4MB max)
- Uploaded to AWS-side storage, served by API endpoints (`GET /files/profile/:fileName`, `GET /files/resume/:fileName`)

### Public Pages
- Landing page
- Terms of Use
- Privacy Policy
- Public talent/client profile views (no login needed)
- Public listing views

---

## 6. Data v3 Stores (DynamoDB Tables)

Translating from DynamoDB-speak to plain English:

| Table | What it stores | Typical size |
|---|---|---|
| `v3-users-*` | Every user account (talent, client, admin) and ALL their data — profile, contacts, Stripe customer ID, subscriptions, affiliate status, push notification subscriptions, etc. **Everything about a user is in one big row.** | Grows with users |
| `v3-listings-*` | Every job posting + all its applications as a nested array | Grows with listings + applications |
| `v3-chats-*` | Every conversation + all its messages as a nested array | Grows with messages |
| `v3-notifications-*` | One row per user containing their notification feed | Grows with activity |
| `v3-referrals-*` | One row per affiliate code with all tracking metrics | Grows with affiliates |
| `v3-emailaccess-*` | Email whitelist for non-prod environments (test envs) | Small / fixed |

**⚠️ Worth flagging:** DynamoDB's design pushed v3 into storing things as **giant nested documents** (e.g., every message in a chat is inside a single row). This is exactly the kind of structure that doesn't translate to Postgres without thoughtful redesign. The v4 data model doc will rebuild these as proper normalized tables (one row per message, one row per application, etc.).

---

## 7. External Services v3 Talks To

| Service | What for | Replaces in v4? |
|---|---|---|
| **AWS DynamoDB** | Database | ✅ Replace with Supabase Postgres |
| **AWS SES (v2)** | Sending emails | ✅ Replace with Resend |
| **AWS Secrets Manager** | Storing API keys | ✅ Replace with Railway/Supabase env vars |
| **Stripe** | Payments, subscriptions, checkout | ✅ Keep — Stripe is vendor-neutral |
| **GoHighLevel (GHL)** | CRM, lead tracking, affiliate dashboard | 🟡 Keep — but flagged as a real integration that needs careful migration |
| **Web Push (VAPID)** | Browser notifications | ✅ Keep — it's just a standard protocol, not a vendor |
| **AWS S3** (presumed — for file uploads) | Resume + profile photo storage | ✅ Replace with Cloudflare R2 |

### GoHighLevel deep dive (because it's the non-obvious one)

v3 uses GHL heavily and v4 will inherit this:
- Creates "opportunities" in GHL pipelines when a user registers (talent pipeline vs client pipeline)
- Updates GHL **tags** based on user actions: `'$299'`, `'$780'`, `'Affiliate'`, `'talent'`, `'client'`, `'self-registered'`, `'Administrator-registered'`
- Drives the affiliate dashboard via "GHL Express login"
- **Two separate API keys** in env vars: `GHL_CLIENT_KEY` and `GHL_TALENT_KEY` (different pipelines)

This is non-trivial to migrate. The v4 plan needs a dedicated GHL section.

---

## 8. Background Jobs

**There are none.** Every action in v3 happens synchronously when a user does something:
- Registration → immediately calls GHL API in the same request
- Payment → immediately verifies via webhook
- Chat message → immediately sends push notification

**Implications for v4:**
- 🟢 Good: simpler mental model right now
- 🔴 Bad: if GHL is slow, user registration is slow. If push notification API is down, message sending fails. **v4 should move these to background jobs from day 1** (per the architecture doc's Section 2.5.E).

---

## 9. User Roles & Permissions (As They Actually Exist)

| Role | Account Type Field | Authority Level | Capabilities |
|---|---|---|---|
| **Talent** | `'talent'` | `> 100` (active) or `99` (suspended) | Browse, apply, bookmark, chat |
| **Client** | `'client'` | `> 100` (active) or `99` (suspended) | Post listings, browse talent (subject to payment), invite, hire |
| **Administrator** | `'administrator'` | `> 100` | Full user management, impersonation, analytics |
| **Privileged** | (any) + `privilegedAccount: true` | n/a | Can post listings without paying |

**⚠️ Flagged for v4 discussion:** The vision said v4 has more roles (recruiter, agency owner). v3 has only 3 base roles + a privileged flag. **v4's RBAC system will need to support a richer role model than v3 has.**

---

## 10. Notification Templates v3 Sends

Eleven email templates currently exist:

| Template | When sent |
|---|---|
| `all-verification.html` | Email verification code on signup |
| `all-password.html` | Password reset link |
| `all-change.html` | Email change confirmation |
| `all-notification.html` | Generic notification fallback |
| `default.html` | Final fallback template |
| `talent-applied.html` | Talent applied to a listing (sent to talent) |
| `talent-bookmarked.html` | Talent was bookmarked by a client |
| `talent-invited.html` | Talent invited to apply |
| `talent-update.html` | Generic talent update |
| `client-applied.html` | New application received (sent to client) |
| `client-bookmarked.html` | Client was bookmarked by talent |

Email templates live in a **separate `email/` project** in the repo, built with the Maizzle email framework. They produce HTML files used by the backend.

---

## 11. Things Worth Flagging For v4 (Surprises, Gotchas, Decisions)

These are the items where I'd want explicit owner attention before the data model doc:

### 🟡 The "match score" is fake
The match scoring shown to clients in v3 is **computed in JavaScript in the browser** based on simple field overlap. It's not stored, not personalized, not learned. **v4's vision says this becomes a real ML-driven ranking.** That's a substantial new capability, not a port.

### 🟡 Chat is not actually real-time
The UI feels real-time but is REST-based polling. v4 can use Supabase Realtime (built-in) for genuine WebSocket-based chat — easy upgrade, big UX win.

### 🟡 GHL is deeply integrated
Two API keys, multiple pipelines, tag-driven workflows, an affiliate dashboard login flow. Migration needs to preserve these CRM integrations or the affiliate program breaks. **Need to know: is GHL still the system of record for sales pipeline in v4, or might v4 replace it with something else?**

### 🟡 No real-money handling besides Stripe — affiliate "commissions" are tracked but not paid
The `commissions` array is recorded per affiliate, but I see no code that actually pays affiliates. **How are commissions currently paid out — manually by you?** This affects v4 design.

### 🟡 The "privileged account" pattern
Admins can flip a flag to let a client post unlimited free listings. This is a manual override. **v4 should formalize this as a "comp account" or "internal use" account type rather than a boolean flag.**

### 🟡 No bulk-delete or data-retention policies
I see no code for data deletion at scale, no archival, no GDPR-style "delete my data" workflow. **Are there legal/compliance requirements that v4 should bake in?**

### 🟡 The frontend is Next.js, the backend is a separate Express app
Two separate codebases that talk via REST. v4 could keep this split or unify into a single Next.js app (with API routes inside Next.js itself). **Decision deferred to v4 migration plan.**

### 🟡 "Authority level" is a magic number system
`> 100` = active, `99` = suspended. Hardcoded everywhere. **v4 should use an enum/status field, not magic numbers.**

### 🟢 No notable gaps in functional coverage
The audit didn't reveal any major broken features. v3 is a complete, functioning product.

---

## 12. What's NOT In V3 (That The Vision Wants In V4)

Pulling from the project vision (multi-tenancy, ML, AI, dashboards):

| Vision goal | Status in v3 |
|---|---|
| **Multi-tenancy** (Agency A can't see Agency B's data) | ❌ Not present. v3 has no concept of organizations/tenants. **Brand-new design in v4.** |
| **Event log for ML training** | ❌ No events table. Some actions create notifications, but there's no general activity log. **Brand-new in v4.** |
| **Real matching algorithm** | ⚠️ Only the simple frontend version. **v4 builds the real one.** |
| **Beautiful dashboards** | ⚠️ v3 admin has basic counts only. **v4 builds proper dashboards.** |
| **AI features (summaries, search, embeddings)** | ❌ None. **Brand-new in v4.** |
| **More user roles (recruiter, agency owner)** | ❌ Only 3 base roles + privileged flag. **v4 expands.** |
| **ATS / payroll / calendar integrations** | ❌ Only GHL exists today. **v4 adds others.** |
| **Background job system** | ❌ Everything is synchronous. **v4 adds scheduled jobs from day 1.** |
| **Real-time chat (WebSockets)** | ❌ REST polling only. **v4 uses Supabase Realtime.** |

---

## 13. What I Need From You Before The Next Document

Pick which of these "🟡 flagged" items you want to discuss before I write [V4-DATA-MODEL.md](V4-DATA-MODEL.md):

1. **GHL** — staying the system of record, or might v4 replace it?
2. **Affiliate payouts** — how do commissions get paid today? Should v4 automate this?
3. **Data retention / GDPR** — any compliance requirements to bake in?
4. **Backend split (Next.js + Express) vs. unified Next.js** — preference for v4?
5. **Privileged/comp account types** — what should this look like in v4?

You can answer these inline in the next message, or tell me which ones you want to defer and we'll proceed. The data model doc can be written without these answers but will be stronger with them.
