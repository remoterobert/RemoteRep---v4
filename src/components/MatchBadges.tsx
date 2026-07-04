import { scoreColor } from "@/lib/matching";

/**
 * Renders the two match percentages side-by-side with tooltips that
 * explain what each one means. Same component works for both rep view
 * ("your match") and hiring view ("this rep's match to your listing")
 * — the label + tooltip strings are just passed in.
 */
export function MatchBadges({
  experience,
  goals,
  experienceLabel,
  goalsLabel,
  experienceTooltip,
  goalsTooltip,
  size = "md",
}: {
  experience: number;
  goals: number;
  experienceLabel?: string;
  goalsLabel?: string;
  experienceTooltip: string;
  goalsTooltip: string;
  size?: "sm" | "md";
}) {
  const numCls =
    size === "sm"
      ? "text-sm font-bold tabular-nums leading-none"
      : "text-lg font-bold tabular-nums leading-none";
  const labelCls =
    size === "sm"
      ? "text-[9px] uppercase tracking-wider font-semibold"
      : "text-[10px] uppercase tracking-wider font-semibold";
  const padCls = size === "sm" ? "px-2 py-1" : "px-3 py-2";

  return (
    <div className={`flex flex-wrap ${size === "sm" ? "gap-1.5" : "gap-2"}`}>
      <div
        title={experienceTooltip}
        className={`inline-flex flex-col items-start ${padCls} rounded-lg cursor-help ${scoreColor(experience)}`}
      >
        <span className={labelCls}>{experienceLabel ?? "Experience"}</span>
        <span className={numCls}>{experience}%</span>
      </div>
      <div
        title={goalsTooltip}
        className={`inline-flex flex-col items-start ${padCls} rounded-lg cursor-help ${scoreColor(goals)}`}
      >
        <span className={labelCls}>{goalsLabel ?? "Goals"}</span>
        <span className={numCls}>{goals}%</span>
      </div>
    </div>
  );
}
