"use client";

import { useRouter, useSearchParams } from "next/navigation";

/**
 * Dropdown that lets the hiring user pick which listing to match candidates
 * against. Extracted to a Client Component so we can attach an onChange
 * handler — React 19 hard-errors on event handlers in Server Components.
 */
export function MatchListingSelect({
  listings,
  selectedId,
}: {
  listings: Array<{ id: string; title: string }>;
  selectedId: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("listing", value);
    router.push(`/candidates?${params.toString()}`);
  }

  return (
    <select
      value={selectedId ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-sm"
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
