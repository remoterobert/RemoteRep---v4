# Concierge AI Hiring Agent — Design Plan

Status: **proposal / not yet built.** This documents how we turn today's
reactive in-chat concierge into the proactive "AI hiring manager" the Concierge
tier promises. Nothing here ships until the owner approves a phase.

## 1. Where we are today

`src/lib/concierge.ts` already runs a **reactive** agent: when a candidate posts
a message in a chat tied to a Concierge-enabled listing (and the candidate has
consented to AI, and the tenant is on the Concierge tier), Claude generates and
posts a reply labeled `author_kind='ai_concierge'`. It answers questions,
represents the company, respects the legal + opt-out guardrails, and shares the
interview booking link when the candidate is interested.

What it does **not** do — and what the tier copy promises — is act on its own:
**source, sift, bookmark, and initiate outreach** to best-fit reps 24/7.

## 2. Target capability

Per Concierge-enabled listing, autonomously and on a schedule:

1. **Sift** — score the public candidate directory against the listing using the
   existing match engine (`src/lib/matching.ts`), the same scoring the Browse
   Talent page uses.
2. **Bookmark** — save the top candidates as `bookmarks`
   (`target_type='candidate'`) owned by the tenant admin, so the human team sees
   the agent's shortlist in the dashboard bookmarks column.
3. **Reach out** — open a chat with high-fit candidates and send an AI-labeled
   first message (only for candidates who have consented to AI outreach).
4. **Chat** — the existing reactive agent already handles the back-and-forth.
5. **Schedule** — when a candidate is interested, share the listing's
   `calendar_link` for self-booking. (True calendar-API booking is a later,
   optional add-on.)

Final hiring decisions always stay with the human team.

## 3. Architecture

- **Trigger:** a scheduled job (Railway cron or a Supabase scheduled function)
  hitting an authenticated internal route, e.g. `POST /api/concierge/run`, every
  N hours. Not user-triggered.
- **Per-run loop** (for each Concierge-enabled listing on a Concierge tenant with
  an unexpired subscription):
  1. Load listing requirements + tenant.
  2. Pull candidate profiles + specialties + goals (public/visible only), score
     with `computeExperienceMatch` / `computeGoalsMatch`.
  3. Take the top K above a score threshold, excluding anyone already
     bookmarked, already in a chat/application for this listing, or on the
     agent's "already contacted" ledger.
  4. Bookmark them (attributed to a tenant admin).
  5. For those who have AI consent, open a chat + send the AI-labeled opener,
     capped by a per-run and per-day outreach limit.
  6. Log every action to `events` (`concierge.sourced`, `concierge.bookmarked`,
     `concierge.reached_out`) for the audit trail.

## 4. Data-model additions

- `concierge_contacts` (or reuse `events`): ledger of `(listing_id,
  candidate_user_id, action, at)` so the agent never re-sources or re-messages
  the same rep. A dedicated table makes the "exclude already contacted" query
  cheap; `events` alone can work at first.
- Per-listing agent config (columns on `listings` or a `concierge_settings`
  table): `score_threshold`, `daily_outreach_cap`, `paused` toggle, so the human
  team can tune or stop the agent.

## 5. Safety, consent & compliance (non-negotiable)

- **AI consent required before outreach.** Reuse `candidate_ai_consent`; only
  message candidates with active consent. Cold first-contact from AI needs an
  explicit product/legal decision — default to **no cold AI outreach** until
  approved; until then the agent bookmarks + suggests, and a human sends the
  first message.
- **AI labeling** on every agent message (`author_kind='ai_concierge'`), already
  in place.
- **Protected-class guardrails** from the existing system prompt carry over.
- **Human-in-the-loop:** the agent shortlists and drafts; humans approve hires.
  Consider a "review queue" mode where outreach is drafted but held for one-click
  human approval.
- **Rate limits** per listing/day and a global kill switch.
- **Full audit** via `events`.
- **Cost control:** cap candidates scored per run; use the cheap model
  (`claude-haiku-4-5`) for scoring/drafting; budget per tenant.

## 6. Phasing

- **Phase 1 — Sift & shortlist (lowest risk, high value):** scheduled scoring +
  auto-bookmark of top fits, surfaced in the dashboard as "Your AI sourced these
  candidates." No autonomous outreach. Ships the "sifts + bookmarks" promise
  safely.
- **Phase 2 — Assisted outreach:** agent drafts opener messages held in a review
  queue for one-click human send. Keeps a human in first contact.
- **Phase 3 — Autonomous outreach:** agent sends AI-labeled first messages to
  consented candidates within caps; reactive chat agent (already built) takes
  over the conversation.
- **Phase 4 — Real scheduling:** calendar-API integration to book directly
  rather than sharing a link.

## 7. Open questions for the owner

1. Is **cold AI first-contact** acceptable, or must a human always send the first
   message (Phase 2 vs Phase 3)?
2. Outreach volume caps per listing/day?
3. Match-score threshold for "best-fit," and how many to shortlist per run?
4. Run cadence (hourly? daily?) and how it interacts with the AWS-exit / Railway
   cron story.
5. Recommend starting at **Phase 1** and reassessing before any autonomous
   outreach.
