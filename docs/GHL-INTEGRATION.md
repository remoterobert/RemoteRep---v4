# GoHighLevel (GHL) Lead Sync

The website sends its leads to GoHighLevel so the sales team can work them. It uses GHL's current API (v2) with **Private Integration** keys. Code: `src/lib/ghl.ts` and `src/lib/ghl-signups.ts`.

## What goes where

| Lead | When | GHL sub-account | Tags | Pipeline settings |
|---|---|---|---|---|
| Fractional CRO application | Submitted on `/fractional-cro` | Talent | `fractional-cro`, `cro-application`, `self-registered` | `GHL_CRO_PIPELINE_ID`, `GHL_CRO_STAGE_ID` |
| Sales rep signup | Finishes "I'm a rep" onboarding | Talent | `talent`, `self-registered` | `GHL_REP_PIPELINE_ID`, `GHL_REP_STAGE_ID` |
| Company signup | Finishes "I'm hiring" onboarding | Client | `client`, `self-registered` | `GHL_CLIENT_PIPELINE_ID`, `GHL_CLIENT_STAGE_ID` |

For each lead the site:

1. **Creates or updates the contact.** GHL matches on email and phone, so repeat visitors aren't duplicated.
2. **Adds the tags.** Tags are only ever added, never removed. The rep and company tags match what v3 used, so existing automations keep working.
3. **Attaches a note.** For CRO applicants, the note lists all their answers and the traffic source. For signups, it lists the roles they picked.
4. **Puts them on the pipeline.** This happens only if that lead type's pipeline settings exist, and only once per contact per pipeline.

Rep and company signups sync **in the background after the page responds**, so a slow or broken GHL never slows down or breaks signup. Their GHL contact and opportunity IDs are saved in the `ghl_user_state` table.

CRO applications sync **while the applicant waits** (up to 8 seconds), because GHL is where that lead lives. If GHL and every other channel fail, the applicant is asked to try again instead of losing the lead.

Support tickets have their own separate GHL webhook (`GHL_SUPPORT_WEBHOOK_URL`) and are unchanged.

## Settings (Railway → web service → Variables)

| Variable | What it is |
|---|---|
| `GHL_TALENT_API_TOKEN` | Private Integration key for the talent sub-account |
| `GHL_TALENT_LOCATION_ID` | Talent sub-account Location ID (GHL → Settings → Business Profile) |
| `GHL_CLIENT_API_TOKEN` | Private Integration key for the client sub-account |
| `GHL_CLIENT_LOCATION_ID` | Client sub-account Location ID |
| `GHL_REP_PIPELINE_ID` / `GHL_REP_STAGE_ID` | Optional. Where new reps land (talent account) |
| `GHL_CRO_PIPELINE_ID` / `GHL_CRO_STAGE_ID` | Optional. Where CRO applications land (talent account) |
| `GHL_CLIENT_PIPELINE_ID` / `GHL_CLIENT_STAGE_ID` | Optional. Where new companies land (client account) |
| `CRO_BOOKING_URL` | GHL calendar booking link shown after a CRO application |

Each Private Integration needs only these scopes: **View Contacts, Edit Contacts, View Opportunities, Edit Opportunities**.

**Finding pipeline and stage IDs:** sign in as a platform admin and open `/admin/env-check`. It lists every pipeline and stage in both sub-accounts with their IDs, ready to copy.

If either sub-account's key is missing, that half quietly switches off. Nothing breaks.

## Checking that it works

Railway's logs show one line per lead:

- `[ghl] cro-intake synced`, `[ghl] rep-signup synced` or `[ghl] client-signup synced`, with the GHL IDs.
- `… skipped`, meaning the settings aren't present.
- `… failed`, with GHL's error message.
