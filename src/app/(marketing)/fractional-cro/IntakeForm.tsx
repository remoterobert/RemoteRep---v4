"use client";

import { useActionState } from "react";
import { ArrowRightIcon, LockClosedIcon } from "@heroicons/react/24/solid";
import { submitCroIntake } from "./actions";
import {
  INCOME_RANGES,
  LEADERSHIP_YEARS,
  TEAM_SIZES,
  TIMELINES,
  type IntakeState,
} from "./options";

const initialState: IntakeState = { error: null };

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-secondary/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-secondary/20";

function Field({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-white/80"
      >
        {label}
        {optional && <span className="ml-1 text-white/35">(optional)</span>}
      </label>
      {children}
    </div>
  );
}

function Select({
  name,
  options,
}: {
  name: string;
  options: readonly string[];
}) {
  return (
    <select
      id={name}
      name={name}
      required
      defaultValue=""
      className={`${inputCls} appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat [&>option]:bg-[#0a0f1f]`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23ffffff80'%3E%3Cpath d='M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z'/%3E%3C/svg%3E\")",
      }}
    >
      <option value="" disabled>
        Choose one
      </option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function IntakeForm({
  utm,
}: {
  utm: { source?: string; medium?: string; campaign?: string };
}) {
  const [state, formAction, pending] = useActionState(
    submitCroIntake,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name" htmlFor="first_name">
          <input id="first_name" name="first_name" required maxLength={100} autoComplete="given-name" className={inputCls} />
        </Field>
        <Field label="Last name" htmlFor="last_name">
          <input id="last_name" name="last_name" required maxLength={100} autoComplete="family-name" className={inputCls} />
        </Field>
        <Field label="Email" htmlFor="email">
          <input id="email" name="email" type="email" required maxLength={200} autoComplete="email" className={inputCls} />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <input id="phone" name="phone" type="tel" required maxLength={40} autoComplete="tel" className={inputCls} />
        </Field>
        <Field label="Current title" htmlFor="current_title">
          <input id="current_title" name="current_title" required maxLength={150} placeholder="VP of Sales" autoComplete="organization-title" className={inputCls} />
        </Field>
        <Field label="LinkedIn profile" htmlFor="linkedin_url" optional>
          <input id="linkedin_url" name="linkedin_url" type="url" maxLength={300} placeholder="https://linkedin.com/in/…" className={inputCls} />
        </Field>
        <Field label="Years leading sales teams" htmlFor="leadership_years">
          <Select name="leadership_years" options={LEADERSHIP_YEARS} />
        </Field>
        <Field label="Largest team you've led" htmlFor="team_size">
          <Select name="team_size" options={TEAM_SIZES} />
        </Field>
        <Field label="Current annual income" htmlFor="income_range">
          <Select name="income_range" options={INCOME_RANGES} />
        </Field>
        <Field label="When would you like to start?" htmlFor="timeline">
          <Select name="timeline" options={TIMELINES} />
        </Field>
      </div>

      <Field label="Why is now the right time for you?" htmlFor="why_now" optional>
        <textarea
          id="why_now"
          name="why_now"
          rows={4}
          maxLength={3000}
          placeholder="What would change for you if this worked?"
          className={inputCls}
        />
      </Field>

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company_website">Company website</label>
        <input id="company_website" name="company_website" tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name="utm_source" value={utm.source ?? ""} />
      <input type="hidden" name="utm_medium" value={utm.medium ?? ""} />
      <input type="hidden" name="utm_campaign" value={utm.campaign ?? ""} />

      {state.error && (
        <div
          role="alert"
          className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-red-200"
        >
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-6 py-4 text-base font-bold text-dark-background shadow-[0_8px_30px_-8px_rgba(251,220,59,0.6)] transition hover:brightness-105 disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Submitting…" : "Submit & Choose My Call Time"}
        {!pending && (
          <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        )}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-white/40">
        <LockClosedIcon className="h-3.5 w-3.5" />
        Confidential. We never share your details or contact your employer.
      </p>
    </form>
  );
}
