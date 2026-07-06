"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

/**
 * Listing selector on the public profile page (hiring viewer picks which
 * listing to score matches against). Client component because React 19
 * hard-errors on event handlers in Server Components.
 */
export function ProfileMatchListingSelect({
  listings,
  selectedId,
}: {
  listings: Array<{ id: string; title: string }>;
  selectedId: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("listing", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={selectedId ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-xs"
      aria-label="Match against listing"
    >
      {listings.map((l) => (
        <option key={l.id} value={l.id}>
          {l.title}
        </option>
      ))}
    </select>
  );
}
