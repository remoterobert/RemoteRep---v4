/**
 * SMS (A2P 10DLC) consent for every form that collects a phone number.
 *
 * Consent is a separate, optional, unchecked-by-default checkbox: it is never
 * a condition of signing up or applying. We record exactly which wording the
 * person agreed to (by version) and when, and tag consenting leads
 * `sms-opt-in` in GoHighLevel — GHL workflows should only text contacts with
 * that tag. Changing the wording? Bump SMS_CONSENT_VERSION.
 *
 * DRAFT wording — pending review by counsel.
 */

export const SMS_CONSENT_VERSION = "2026-10-19";

export const SMS_CONSENT_TEXT =
  "Yes, I agree to receive text messages from RemoteRep about my account, job opportunities and RemoteRep programs at the mobile number I provided, including automated messages. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help. Consent is not a condition of signing up or purchase.";

export const SMS_OPT_IN_TAG = "sms-opt-in";

export type SmsConsent = {
  sms_consent: boolean;
  sms_consent_at: string;
  sms_consent_version: string;
  sms_consent_source: string;
};

/** Read the checkbox from a submitted form. */
export function readSmsConsent(fd: FormData, source: string): SmsConsent {
  return {
    sms_consent: fd.get("sms_consent") === "yes",
    sms_consent_at: new Date().toISOString(),
    sms_consent_version: SMS_CONSENT_VERSION,
    sms_consent_source: source,
  };
}

/** One line for the GHL note — the record of what they agreed to and when. */
export function smsConsentNoteLine(c: SmsConsent): string {
  return c.sms_consent
    ? `SMS consent: YES — ${c.sms_consent_at} via ${c.sms_consent_source} (wording v${c.sms_consent_version})`
    : `SMS consent: no — do not text (${c.sms_consent_source}, ${c.sms_consent_at})`;
}
