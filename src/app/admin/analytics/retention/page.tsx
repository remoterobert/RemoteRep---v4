import { StubMetricGrid } from "../StubMetricGrid";

export const dynamic = "force-dynamic";

export default function RetentionPage() {
  return (
    <StubMetricGrid
      title="Retention & cohorts"
      intro="How well the users you acquire stick around, come back, and eventually churn. Retention insight lands as soon as we have meaningful user-cohort volume."
      blocker="Meaningful user volume across multiple months (cohort math needs it)."
      metrics={[
        {
          label: "Cohort retention grid",
          description:
            "Users grouped by signup week, shown retained on D1/D7/D30/D90.",
        },
        {
          label: "D1 retention",
          description:
            "Share of new users who return on day 1 after signup.",
        },
        {
          label: "D7 retention",
          description: "Share of new users who return within a week.",
        },
        {
          label: "D30 retention",
          description:
            "The 30-day retention rate — a proxy for product-market fit.",
        },
        {
          label: "D90 retention",
          description:
            "Longer-term stickiness; more relevant once we have 3+ months of history.",
        },
        {
          label: "Churn rate (logo)",
          description:
            "Share of active users who go dormant in a given period.",
        },
        {
          label: "Reactivation rate",
          description:
            "Dormant users who came back and became active again.",
        },
        {
          label: "Account age distribution",
          description:
            "Histogram of how long the current active-user base has been around.",
        },
        {
          label: "Median account lifetime",
          description:
            "Median time from signup to last activity (or now, if still active).",
        },
      ]}
    />
  );
}
