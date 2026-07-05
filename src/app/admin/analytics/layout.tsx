import { AnalyticsTabs } from "./AnalyticsTabs";
import { CompactFilters } from "./CompactFilters";

/**
 * Shared shell for every analytics page. Renders the section header,
 * the tab pill nav, and the compact filter row. Auth (platform admin)
 * is enforced by the parent /admin layout.
 */
export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Platform analytics</h1>
        <p className="text-sm text-light-grey">
          KPIs, trends, and top performers.
        </p>
      </div>

      <AnalyticsTabs />
      <CompactFilters />

      {children}
    </div>
  );
}
