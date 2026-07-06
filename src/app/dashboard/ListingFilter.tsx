"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

/**
 * Dropdown that lets the hiring user scope the Kanban + KPIs to a single
 * listing (or "All listings"). Pushes the choice into the URL so the
 * selection survives reloads and can be shared.
 *
 * We hide the native chevron with appearance-none and draw our own so
 * the icon has real padding from the border — native chevrons on
 * <select> ignore right-side padding.
 */
export function ListingFilter({
  listings,
  selectedId,
}: {
  listings: Array<{ id: string; title: string; status: string }>;
  selectedId: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("listing");
    } else {
      params.set("listing", value);
    }
    router.push(`/dashboard${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div className="relative inline-block">
      <select
        value={selectedId ?? "all"}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded border border-border bg-surface-2 pl-3 pr-9 py-2 text-sm hover:bg-surface-3 transition-colors cursor-pointer"
        aria-label="Filter by listing"
      >
        <option value="all">All listings</option>
        {listings.map((l) => (
          <option key={l.id} value={l.id}>
            {l.title}
            {l.status !== "published" ? ` (${l.status})` : ""}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-light-grey"
        aria-hidden="true"
      />
    </div>
  );
}
