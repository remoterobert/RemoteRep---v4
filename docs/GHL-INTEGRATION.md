# GoHighLevel (GHL) Lead Sync

The website sends its leads to GoHighLevel so the sales team can work them. It uses GHL's current API (v2) with **Private Integration** keys. Code: `src/lib/ghl.ts`, `src/lib/ghl-signups.ts` and `src/lib/utm.ts`.

## How it works: tags in, automations in GHL

The website does three things per lead, and nothing else:

1. **Creates or updates the contact.** GHL matches on email and phone, so repeat visitors aren't duplicated.
2. **Adds tags.** Tags are only ever added, never removed.
3. **Attaches a note.** It lists the person's answers and their UTMs.

**Everything after that happens in GHL workflows** triggered by *Contact Tag Added*: putting the lead on a pipeline, assigning a rep, sending follow-ups. A new form or split test needs a new tag at most, never a new website setting.

| Lead | When | GHL sub-account | Tags | Trigger tag for workflows |
|---|---|---|---|---|
| Fractional CRO application | Submitted on `/fractional-cro` | Talent | `fcro-application` | `fcro-application` |
| Sales rep signup | Finishes "I'm a rep" onboarding | Talent | `rep-signup`, `talent`, `self-registered` | `rep-signup` |
| Company signup | Finishes "I'm hiring" onboarding | Client | `client-signup`, `client`, `self-registered` | `client-signup` |

**Every lead has a phone number.** RemoteRep doesn't accept email-only leads, so phone is required on signup, at onboarding (pre-filled from signup, and required for anyone who signed up before phone was collected), and on the CRO application. Numbers are cleaned up to international format (`+15551234567`) so GHL can match contacts and text them. US and Canadian numbers can be typed any way; other countries start with `+`. Code: `src/lib/phone.ts`. For signups the number is also saved on the account (`users.phone`).

`talent`, `client` and `self-registered` are the tags v3 used, so older automations keep working. `self-registered` means *a platform user who signed themselves up*, so it's only added to signups, never to CRO applications.

Rep and company signups sync **in the background after the page responds**, so a slow or broken GHL never slows down or breaks signup. Their GHL contact ID is saved in the `ghl_user_state` table.

CRO applications sync **while the applicant waits** (up to 8 seconds), because GHL is where that lead lives. If GHL and every other channel fail, the applicant is asked to try again instead of losing the lead.

Support tickets have their own separate GHL webhook (`GHL_SUPPORT_WEBHOOK_URL`) and are unchanged.

## UTM tracking

All five UTMs (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`) reach GHL in two places:

- **The contact's Source field,** e.g. `linkedin / paid / fcro-launch / headline-a`.
- **The note,** one labelled line per UTM. Leads without UTMs show "direct".

Where the UTMs come from:

- **CRO applications:** from the page link. If the link has none, they fall back to the visitor's latest tagged visit.
- **Signups:** from the visitor's **latest tagged visit**. Any page visit whose link has UTMs stores them for 90 days in the `rr_utm` cookie, which is shared between remoterep.com and app.remoterep.com. The cookie holds only the five UTM values. If someone confirms their email on a different device, their UTMs won't carry over.

For split tests, use `utm_content` to tell versions apart (e.g. `utm_content=headline-b`).

## Settings (Railway → web service → Variables)

| Variable | What it is |
|---|---|
| `GHL_TALENT_API_TOKEN` | Private Integration key for the talent sub-account |
| `GHL_TALENT_LOCATION_ID` | Talent sub-account Location ID (GHL → Settings → Business Profile) |
| `GHL_CLIENT_API_TOKEN` | Private Integration key for the client sub-account |
| `GHL_CLIENT_LOCATION_ID` | Client sub-account Location ID |
| `CRO_BOOKING_URL` | GHL calendar booking link shown after a CRO application |

Each Private Integration needs only **View Contacts** and **Edit Contacts**. The site no longer touches opportunities.

If either sub-account's key is missing, that half quietly switches off. Nothing breaks. `/admin/env-check` shows which of these the live site can see.

## Checking that it works

Railway's logs show one line per lead:

- `[ghl] cro-intake synced`, `[ghl] rep-signup synced` or `[ghl] client-signup synced`, with the GHL contact ID.
- `… skipped`, meaning the keys aren't present.
- `… failed`, with GHL's error message.
