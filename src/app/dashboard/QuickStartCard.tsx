import Link from "next/link";
import {
  CheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export type QuickStartStep = {
  key: string;
  done: boolean;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

/**
 * Onboarding "Quick start" card shown at the top of the dashboard for new
 * users. Three numbered steps that graduate them from empty-dashboard to
 * a working workflow. Auto-hides once all three are checked — no dismiss
 * button, so the prompt stays visible until the user has actually taken
 * the value-generating actions.
 */
export function QuickStartCard({
  steps,
  headline,
}: {
  steps: QuickStartStep[];
  headline: string;
}) {
  if (steps.every((s) => s.done)) return null;

  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="mb-6 rounded-2xl border border-primary/25 bg-primary/[0.04] p-4 md:p-5">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <SparklesIcon className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">{headline}</h2>
            <p className="text-[11px] text-light-grey">
              Three quick things and you&apos;re rolling. Takes about two
              minutes.
            </p>
          </div>
        </div>
        <div className="text-[11px] text-light-grey tabular-nums">
          {doneCount} of {steps.length} done
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {steps.map((step, i) => (
          <StepCard key={step.key} step={step} index={i + 1} />
        ))}
      </div>
    </div>
  );
}

function StepCard({
  step,
  index,
}: {
  step: QuickStartStep;
  index: number;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        step.done
          ? "border-success/40 bg-success/[0.04]"
          : "border-border bg-surface-2"
      }`}
    >
      <div className="flex items-start gap-2 mb-2">
        <div
          className={`h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold ${
            step.done
              ? "bg-success text-white"
              : "bg-primary/15 text-primary"
          }`}
        >
          {step.done ? <CheckIcon className="h-3.5 w-3.5" /> : index}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold leading-tight">
            {step.title}
          </div>
          <p className="text-[11px] text-light-grey mt-0.5 leading-snug">
            {step.description}
          </p>
        </div>
      </div>
      {step.done ? (
        <div className="text-[11px] text-success font-semibold pl-8">Done</div>
      ) : (
        <Link
          href={step.ctaHref}
          className="ml-8 inline-flex items-center rounded bg-primary text-white px-3 py-1 text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          {step.ctaLabel}
        </Link>
      )}
    </div>
  );
}
