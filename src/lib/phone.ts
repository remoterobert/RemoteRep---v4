/**
 * Phone numbers for leads. We don't accept email-only leads, so every lead
 * form requires one. Numbers are stored in E.164 (+15551234567) so GHL can
 * match contacts and text them.
 *
 * US/Canada numbers may be typed without a country code; anything else needs
 * a leading +.
 */
export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) {
    return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  }
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export const PHONE_ERROR =
  "Please enter a valid phone number, including area code. Outside the US/Canada? Start with + and your country code.";
