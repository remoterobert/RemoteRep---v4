"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Squares2X2Icon,
  ArrowTrendingUpIcon,
  BoltIcon,
  ArrowsRightLeftIcon,
  ArrowPathIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";

const TABS = [
  {
    label: "Overview",
    href: "/admin/analytics",
    icon: Squares2X2Icon,
    matchExact: true,
  },
  { label: "Growth", href: "/admin/analytics/growth", icon: ArrowTrendingUpIcon },
  { label: "Engagement", href: "/admin/analytics/engagement", icon: BoltIcon },
  {
    label: "Marketplace",
    href: "/admin/analytics/marketplace",
    icon: ArrowsRightLeftIcon,
  },
  {
    label: "Retention",
    href: "/admin/analytics/retention",
    icon: ArrowPathIcon,
  },
  { label: "Revenue", href: "/admin/analytics/revenue", icon: BanknotesIcon },
];

/**
 * Pill-shaped tab bar for the analytics section. Preserves the current
 * query params (date range, bucket, user type) across tab clicks so
 * filters don't reset on navigation.
 */
export function AnalyticsTabs() {
  const pathname = usePathname();
  const sp = useSearchParams();

  const qs = sp.toString();
  const suffix = qs ? `?${qs}` : "";

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-4">
      {TABS.map((t) => {
        const active = t.matchExact
          ? pathname === t.href
          : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={`${t.href}${suffix}`}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-primary text-white shadow-sm"
                : "border border-border hover:bg-surface-3 text-foreground/80"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
