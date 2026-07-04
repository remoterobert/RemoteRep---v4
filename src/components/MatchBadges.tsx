import { scoreColor } from "@/lib/matching";

/**
 * Renders the two match percentages side-by-side with visible tooltips
 * that show immediately on hover. Same component works for both rep
 * view ("your match") and hiring view ("this rep's match to your
 * listing") — the label + tooltip strings are just passed in.
 *
 * When `scored` is 0, we render "—" and a "not scored" tooltip so the
 * user knows nothing was compared (rather than an alarming red 0%).
 */
export function MatchBadges({
  experience,
  goals,
  experienceScored,
  goalsScored,
  experienceLabel,
  goalsLabel,
  experienceTooltip,
  goalsTooltip,
  emptyExperienceTooltip,
  emptyGoalsTooltip,
  size = "md",
}: {
  experience: number;
  goals: number;
  /** Number of criteria that were actually scored. If 0, we render "—" */
  experienceScored?: number;
  goalsScored?: number;
  experienceLabel?: string;
  goalsLabel?: string;
  experienceTooltip: string;
  goalsTooltip: string;
  emptyExperienceTooltip?: string;
  emptyGoalsTooltip?: string;
  size?: "sm" | "md";
}) {
  return (
    <div className={`flex flex-wrap ${size === "sm" ? "gap-1.5" : "gap-2"}`}>
      <Badge
        label={experienceLabel ?? "Experience"}
        score={experience}
        scored={experienceScored ?? 1}
        tooltip={experienceTooltip}
        emptyTooltip={emptyExperienceTooltip}
        size={size}
      />
      <Badge
        label={goalsLabel ?? "Goals"}
        score={goals}
        scored={goalsScored ?? 1}
        tooltip={goalsTooltip}
        emptyTooltip={emptyGoalsTooltip}
        size={size}
      />
    </div>
  );
}

function Badge({
  label,
  score,
  scored,
  tooltip,
  emptyTooltip,
  size,
}: {
  label: string;
  score: number;
  scored: number;
  tooltip: string;
  emptyTooltip?: string;
  size: "sm" | "md";
}) {
  const isEmpty = scored === 0;
  const numCls =
    size === "sm"
      ? "text-sm font-bold tabular-nums leading-none"
      : "text-lg font-bold tabular-nums leading-none";
  const labelCls =
    size === "sm"
      ? "text-[9px] uppercase tracking-wider font-semibold"
      : "text-[10px] uppercase tracking-wider font-semibold";
  const padCls = size === "sm" ? "px-2 py-1" : "px-3 py-2";

  const emptyStyle =
    "bg-zinc-100 dark:bg-white/[0.06] text-light-grey ring-1 ring-zinc-200 dark:ring-white/[0.06]";

  const activeTooltip = isEmpty ? (emptyTooltip ?? tooltip) : tooltip;

  return (
    <div className="relative group inline-block">
      <div
        className={`inline-flex flex-col items-start ${padCls} rounded-lg cursor-help ${
          isEmpty ? emptyStyle : scoreColor(score)
        }`}
      >
        <span className={labelCls}>{label}</span>
        <span className={numCls}>{isEmpty ? "—" : `${score}%`}</span>
      </div>

      {/* Tooltip bubble — visible immediately on group-hover, no delay */}
      <div
        role="tooltip"
        className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 rounded-lg bg-[#0b1220] text-white text-xs leading-snug shadow-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none transition-opacity duration-100 whitespace-normal"
      >
        {activeTooltip}
        {/* Little arrow pointing down at the badge */}
        <span
          aria-hidden="true"
          className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[#0b1220]"
        />
      </div>
    </div>
  );
}
