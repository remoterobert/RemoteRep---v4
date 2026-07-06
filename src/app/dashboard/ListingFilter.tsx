"use client";

import { useRouter, useSearchParams } from "next/navigation";

/**
 * Dropdown that lets the hiring user scope the Kanban + KPIs to a single
 * listing (or "All listings"). Pushes the choice into the URL so the
 * selection survives reloads and can be shared.
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
    <select
      value={selectedId ?? "all"}
      onChange={(e) => onChange(e.target.value)}
      className="rounded border border-border bg-surface-2 pl-3 pr-8 py-2 text-sm hover:bg-surface-3 transition-colors"
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
  );
}
