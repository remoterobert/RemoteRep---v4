import { SMS_CONSENT_TEXT } from "@/lib/sms-consent";

/**
 * Optional SMS consent checkbox (A2P 10DLC). Unchecked by default and never
 * required — see src/lib/sms-consent.ts. `tone` matches light app forms or
 * the dark marketing pages.
 */
export function SmsConsentCheckbox({ tone = "light" }: { tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-xs leading-relaxed ${
        dark
          ? "border-white/10 bg-white/[0.03] text-white/55"
          : "border-border bg-surface-2 text-foreground/65"
      }`}
    >
      <input
        type="checkbox"
        name="sms_consent"
        value="yes"
        className="mt-0.5 h-4 w-4 shrink-0 accent-[#004fbe]"
      />
      <span>
        {SMS_CONSENT_TEXT} See our{" "}
        <a
          href="/privacy#text-messaging"
          target="_blank"
          className={`font-semibold underline ${dark ? "text-white/80" : "text-primary"}`}
        >
          Privacy Policy
        </a>{" "}
        and{" "}
        <a
          href="/terms#text-messaging"
          target="_blank"
          className={`font-semibold underline ${dark ? "text-white/80" : "text-primary"}`}
        >
          Terms
        </a>
        .
      </span>
    </label>
  );
}
