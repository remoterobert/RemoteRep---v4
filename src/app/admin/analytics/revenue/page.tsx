import { StubMetricGrid } from "../StubMetricGrid";

export const dynamic = "force-dynamic";

export default function RevenuePage() {
  return (
    <StubMetricGrid
      title="Revenue & unit economics"
      intro="The SaaS growth accounting — MRR/ARR/LTV/CAC/ACV and the payments picture. Populates as soon as payments are wired up (e.g., Stripe subscriptions + webhooks)."
      blocker="Payment processor integration (Stripe, Paddle, etc.) and a `subscriptions` + `payments` table."
      metrics={[
        {
          label: "MRR",
          description:
            "Monthly recurring revenue — the standard SaaS run-rate metric.",
        },
        {
          label: "ARR",
          description: "Annual recurring revenue = MRR × 12.",
        },
        {
          label: "New MRR",
          description: "Revenue added from brand-new subscriptions this month.",
        },
        {
          label: "Expansion MRR",
          description:
            "Revenue added from existing customers upgrading or adding seats.",
        },
        {
          label: "Contraction MRR",
          description:
            "Revenue lost from existing customers downgrading (not churning).",
        },
        {
          label: "Churned MRR",
          description:
            "Revenue lost from customers who cancelled entirely this month.",
        },
        {
          label: "Net MRR change",
          description:
            "New + Expansion − Contraction − Churned. The growth signal.",
        },
        {
          label: "ARPU",
          description:
            "Average revenue per user — total MRR ÷ paying customers.",
        },
        {
          label: "LTV",
          description:
            "Customer lifetime value — expected total revenue per customer.",
        },
        {
          label: "CAC",
          description:
            "Customer acquisition cost — spend ÷ new customers.",
          blocker: "Ad-spend / marketing-cost tracking",
        },
        {
          label: "LTV:CAC ratio",
          description:
            "Healthy is 3:1 or better. Under 1:1 is losing money on each customer.",
        },
        {
          label: "CAC payback period",
          description:
            "Months until a new customer's revenue covers the CAC spent to acquire them.",
        },
        {
          label: "ACV",
          description:
            "Annual contract value — median contract value per year.",
        },
        {
          label: "Total payments ($)",
          description:
            "Sum of all successful payments received (period).",
        },
        {
          label: "Payment volume (count)",
          description:
            "Number of successful payments processed (period).",
        },
        {
          label: "Gross margin",
          description:
            "Revenue minus direct costs (payment fees, hosting). Usually 70–90% for SaaS.",
        },
        {
          label: "Revenue churn %",
          description:
            "Percent of MRR lost to cancellations — the revenue-side view of churn (vs. logo churn).",
        },
        {
          label: "Net revenue retention",
          description:
            "(Starting MRR − Churn + Expansion) ÷ Starting MRR. > 100% means the base grows even with no new customers.",
        },
      ]}
    />
  );
}
