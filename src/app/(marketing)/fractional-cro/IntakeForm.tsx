"use client";

import { useActionState, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  LockClosedIcon,
} from "@heroicons/react/24/solid";
import { submitCroIntake } from "./actions";
import {
  INCOME_RANGES,
  LEADERSHIP_YEARS,
  TEAM_SIZES,
  TIMELINES,
  type IntakeState,
} from "./options";
import { UTM_KEYS, type Utm } from "@/lib/utm";
import { SmsConsentCheckbox } from "@/components/forms/SmsConsentCheckbox";

// Multi-step application: four one-tap questions, then contact details.
// Starting with easy taps (instead of a wall of fields) gets far more people
// to begin; by the contact step they've already invested. All answers post
// together to the same server action as before.

const initialState: IntakeState = { error: null };

const QUESTIONS = [
  { name: "leadership_years", q: "How long have you led sales teams?", options: LEADERSHIP_YEARS },
  { name: "team_size", q: "What's the largest team you've led?", options: TEAM_SIZES },
  { name: "income_range", q: "What's your current annual income?", options: INCOME_RANGES },
  { name: "timeline", q: "When would you like to start?", options: TIMELINES },
] as const;

type QName = (typeof QUESTIONS)[number]["name"];
const TOTAL = QUESTIONS.length + 1;

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[15px] text-white placeholder:text-white/30 outline-none transition focus:border-secondary/60 focus:bg-white/[0.06] focus:ring-4 focus:ring-secondary/10";

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
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-white/60">
        {label}
        {optional && <span className="ml-1 font-normal text-white/30">(optional)</span>}
      </label>
      {children}
    </div>
  );
}

export function IntakeForm({
  utm,
}: {
  utm: Utm;
}) {
  const [state, formAction, pending] = useActionState(submitCroIntake, initialState);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<QName, string>>>({});

  const onContact = step === QUESTIONS.length;
  const progress = ((step + (onContact ? 1 : 0)) / TOTAL) * 100;

  function choose(name: QName, value: string) {
    setAnswers((a) => ({ ...a, [name]: value }));
    // brief pause so the tap registers visually before advancing
    setTimeout(() => setStep((s) => Math.min(s + 1, QUESTIONS.length)), 180);
  }

  return (
    <form action={formAction}>
      {/* progress */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold uppercase tracking-[0.2em] text-secondary">
          {onContact ? "Last step" : `Question ${step + 1} of ${QUESTIONS.length}`}
        </span>
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="inline-flex items-center gap-1 font-semibold text-white/50 transition hover:text-white"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" /> Back
          </button>
        ) : (
          <span className="text-white/40">About 60 seconds</span>
        )}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-secondary to-amber-300 transition-all duration-500"
          style={{ width: `${Math.max(progress, 6)}%` }}
        />
      </div>

      {/* answers travel with the form regardless of which step is showing */}
      {QUESTIONS.map((q) => (
        <input key={q.name} type="hidden" name={q.name} value={answers[q.name] ?? ""} />
      ))}

      {!onContact ? (
        <div key={step} className="mt-7">
          <h3 className="text-2xl font-bold leading-tight tracking-tight">
            {QUESTIONS[step].q}
          </h3>
          <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {QUESTIONS[step].options.map((o) => {
              const picked = answers[QUESTIONS[step].name] === o;
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => choose(QUESTIONS[step].name, o)}
                  className={`group flex items-center justify-between gap-3 rounded-2xl border px-4 py-4 text-left text-[15px] font-semibold transition ${
                    picked
                      ? "border-secondary bg-secondary/15 text-white"
                      : "border-white/10 bg-white/[0.03] text-white/85 hover:border-white/25 hover:bg-white/[0.06]"
                  }`}
                >
                  {o}
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                      picked ? "border-secondary bg-secondary" : "border-white/20 group-hover:border-white/40"
                    }`}
                  >
                    {picked && <CheckIcon className="h-3 w-3 text-dark-background" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-7 space-y-4">
          <div>
            <h3 className="text-2xl font-bold leading-tight tracking-tight">
              Where should we send your call details?
            </h3>
            <p className="mt-1.5 text-sm text-white/45">
              You&apos;ll pick your call time on the next screen.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
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
            <Field label="LinkedIn" htmlFor="linkedin_url" optional>
              <input id="linkedin_url" name="linkedin_url" type="url" maxLength={300} placeholder="https://linkedin.com/in/…" className={inputCls} />
            </Field>
          </div>
          <Field label="Why is now the right time?" htmlFor="why_now" optional>
            <textarea id="why_now" name="why_now" rows={2} maxLength={3000} className={inputCls} />
          </Field>
          <SmsConsentCheckbox tone="dark" />
        </div>
      )}

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company_website">Company website</label>
        <input id="company_website" name="company_website" tabIndex={-1} autoComplete="off" />
      </div>
      {UTM_KEYS.map((k) => (
        <input key={k} type="hidden" name={k} value={utm[k] ?? ""} />
      ))}

      {state.error && (
        <div role="alert" className="mt-5 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-red-200">
          {state.error}
        </div>
      )}

      {onContact && (
        <button
          type="submit"
          disabled={pending}
          className="group relative mt-6 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-secondary px-6 py-4 text-base font-bold text-dark-background shadow-[0_10px_40px_-10px_rgba(251,220,59,0.7),inset_0_1px_0_rgba(255,255,255,0.5)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? "Submitting…" : "Submit & choose my call time"}
          {!pending && <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
        </button>
      )}

      <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-white/35">
        <LockClosedIcon className="h-3.5 w-3.5" />
        Confidential. We never share your details or contact your employer.
      </p>
    </form>
  );
}
