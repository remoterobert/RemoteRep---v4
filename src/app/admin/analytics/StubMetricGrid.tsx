import { InformationCircleIcon } from "@heroicons/react/24/outline";

export type StubMetric = {
  label: string;
  description: string;
  blocker?: string;
};

/**
 * Grid layout used by stub-only analytics tabs (Engagement, Retention,
 * Revenue). Each card is a placeholder for a real KPI that will land
 * once the underlying data source is wired up.
 */
export function StubMetricGrid({
  title,
  intro,
  metrics,
  blocker,
}: {
  title: string;
  intro: string;
  metrics: StubMetric[];
  blocker?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 flex items-start gap-3">
        <InformationCircleIcon className="h-5 w-5 text-warning shrink-0 mt-0.5" />
        <div className="text-sm">
          <div className="font-semibold text-warning">{title}</div>
          <p className="text-foreground/80 mt-0.5 leading-snug">{intro}</p>
          {blocker && (
            <p className="text-xs text-light-grey mt-1.5">
              <b>Depends on:</b> {blocker}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-border bg-surface-2 p-4"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-light-grey mb-1.5">
              {m.label}
            </div>
            <div className="text-2xl font-semibold text-light-grey mb-1">
              —
            </div>
            <p className="text-xs text-foreground/70 leading-snug">
              {m.description}
            </p>
            {m.blocker && (
              <p className="text-[11px] text-warning mt-1.5">
                Needs: {m.blocker}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
