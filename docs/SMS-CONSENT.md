# SMS Consent (A2P 10DLC) and Privacy Policy

**Status:** the wording below, the Privacy Policy (`/privacy`) and the Terms "Text messaging" section are **drafts pending review by counsel**.

## What it does

Every form that collects a phone number has an **optional, unchecked** text-message consent checkbox:

| Form | Where | Consent recorded in |
|---|---|---|
| Signup | `app.remoterep.com/signup` | The user's account (`user_metadata`) |
| Onboarding (reps and companies) | Shown **only** to people who signed up before consent was collected | The user's account |
| Fractional CRO application | `remoterep.com/fractional-cro` | GHL note (and the team alert email) |

Consent is never required to sign up or apply.

**What's recorded:** for each person, `sms_consent` (yes/no), `sms_consent_at` (timestamp), `sms_consent_version` (which wording they saw) and `sms_consent_source` (which form). The GHL note for each lead includes a line such as `SMS consent: YES — 2026-10-19T… via signup (wording v2026-10-19)` or `SMS consent: no — do not text`.

**GHL:** consenting leads get the tag **`sms-opt-in`**. Every GHL workflow that sends texts should be filtered to contacts **with** `sms-opt-in`. STOP and HELP replies are handled by GHL's messaging.

## Changing the wording

The checkbox text lives in `src/lib/sms-consent.ts` (`SMS_CONSENT_TEXT`). If counsel changes it, update the text **and** bump `SMS_CONSENT_VERSION` (e.g. to the date of the change), so each consent record shows which wording the person agreed to.

## Privacy Policy and Terms

- `/privacy` is a full draft covering: what we collect, how it's used, the **Text messaging (SMS)** section (`/privacy#text-messaging`), how information is shared, named service providers, cookies (including the 90-day UTM cookie), retention, security, your rights, children and contact details.
- `/terms#text-messaging` holds the texting program terms that carriers look for during A2P 10DLC review.
- The checkbox links to both. When registering your A2P campaign in GHL, use those two URLs as the privacy policy and terms links, and describe the opt-in as "unchecked checkbox on web forms" with the exact wording.
