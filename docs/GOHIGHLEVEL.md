# GoHighLevel integration

Plain-English guide to how RemoteRep talks to GoHighLevel, what tags get
applied when, and how to switch it on.

## The short version

When someone finishes signing up, we create a **contact** and an
**opportunity** in GoHighLevel and tag them. Tags are what your GHL
automations listen to.

Nothing is sent until the credentials below are set. Until then — and on
every developer machine — the integration runs in **dry-run**, logging
exactly what it *would* send.

## Why this was rebuilt rather than reconnected

v3 talked to GoHighLevel's **v1 API** (`rest.gohighlevel.com/v1`) using two
API keys. That API **reached end-of-support on 31 December 2025**. It still
responds, but it gets no updates, no support, and no announced shutoff date.

v4 uses the **v2 API** instead. What that changes:

| | v1 (v3 used this) | v2 (v4 uses this) |
| --- | --- | --- |
| Host | `rest.gohighlevel.com/v1` | `services.leadconnectorhq.com` |
| Auth | Two API keys | One Private Integration Token |
| Headers | Just auth | Auth **+ `Version: 2021-07-28`** |
| Scoping | Implicit in the key | Explicit Location (sub-account) id |
| Tags | Inside the opportunity payload | On the **contact**, own endpoint |
| Creating | One call | Upsert contact → create opportunity |

The upsert matters: it's keyed on email, so a retry can't create duplicate
contacts. v3's version could.

## What gets tagged, and when

Tag names are **deliberately identical to v3's**, so automations already
built in GoHighLevel keep firing. (v4 says "rep" where v3 said "talent";
the tag stays `talent` on purpose.)

| What happens | Pipeline | Tags applied |
| --- | --- | --- |
| Rep finishes onboarding | Talent | `talent`, `self-registered` |
| Company finishes onboarding | Client | `client`, `self-registered` |
| Admin-created user finishes onboarding | matching | `talent` / `client` only |
| Admin edits a user's tags | whichever they're in | whatever was typed |
| Subscription tier changes | Client | `premium` or `concierge` |

Tagging is **additive**. Removing a tag in the admin UI does not remove it in
GoHighLevel, because GHL's own automations add tags of their own and we must
not clobber them.

### What changed from v3, and why

**Sync happens at onboarding, not signup.** v3's signup form collected name,
phone, company and account type all at once. v4's signup takes only an email
and password — rep-vs-company is chosen afterwards. So we sync at the moment
we actually know who someone is.

**The `$299` and `$780` tags are retired.** They referred to v3's one-time
listing fee and access subscription. v4 sells Free / Premium $59 / Concierge
$299 per month — the old numbers no longer mean anything, and `$299` would
now be actively misleading. Tier tags (`premium`, `concierge`) replace them.

**The `Affiliate` tag is not wired up.** v4 has no affiliate program yet.
Worth knowing: this tag never worked in v3 either for reps — the v3 code sent
the update to the wrong URL (the collection instead of the specific
opportunity), and never checked whether the call succeeded.

**Two triggers are waiting on features that don't exist yet.** There are no
payments in v4, so tier tagging has nothing to fire from today;
`syncTierChange()` is built and ready for when billing lands. Same story for
affiliates.

## Turning it on

1. In GoHighLevel: **Settings → Private Integrations**, create a token with
   **contacts** (read/write) and **opportunities** (read/write) scopes.
2. Find your **Location ID** (sub-account id).
3. Set `GHL_PRIVATE_TOKEN` and `GHL_LOCATION_ID`.
4. Leave `GHL_DRY_RUN=true` at first. Sign up a test account and check the
   logs for `[ghl:dry-run]` lines showing the payloads.
5. When the payloads look right, set `GHL_DRY_RUN=false` in production.

**If talent and client live in separate sub-accounts** (v3's two API keys
hint they might), set `GHL_TALENT_TOKEN` / `GHL_TALENT_LOCATION_ID` and
`GHL_CLIENT_TOKEN` / `GHL_CLIENT_LOCATION_ID` instead. Anything unset falls
back to the shared pair.

Pipeline and stage ids default to the ones v3 used, so they only need setting
if the pipelines were rebuilt. All variables are documented in `.env.example`.

## When something goes wrong

v3 wrapped every GHL call in `catch { console.error }`, so a failed sync was
indistinguishable from a successful one — which is why the broken rep tagging
went unnoticed. v4 instead:

- Records the failure on the user's row in `ghl_user_state.sync_error`.
- Retries rate limits (GHL allows ~500 requests per 10 seconds) and transient
  server errors, honouring the `Retry-After` header. Fails fast on a bad
  request rather than hammering.
- Runs after the response is sent, so a slow or down CRM never delays a
  signup, and never fails one.

A user who hasn't finished onboarding has no pipeline yet. That's recorded as
a `sync_error` explaining it, rather than being silently dropped — they sync
when they complete onboarding.

## Where the code lives

- `src/lib/ghl/config.ts` — credentials, pipeline ids, tag vocabulary, dry run
- `src/lib/ghl/client.ts` — the v2 HTTP client, retries, rate limits
- `src/lib/ghl/sync.ts` — the operations and what gets written to the database
- `ghl_user_state` table — per-user contact id, opportunity id, tags, errors

Triggers live in `src/app/onboarding/actions.ts` and
`src/app/admin/users/actions.ts`.

## Separate thing with a similar name

The support form (`src/app/support/actions.ts`) POSTs tickets to a GHL
**inbound webhook** via `GHL_SUPPORT_WEBHOOK_URL`. That's unrelated to the
CRM pipelines above and is configured independently.

## Reference: v3's original mapping

Preserved in `v3-archive/server/src/services/ghl.ts`. Seven triggers:
rep signup, company signup, admin-created rep, admin-created company,
`$299` on listing payment, `$780` on subscription, and `Affiliate` on
affiliate activation.
