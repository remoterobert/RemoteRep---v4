"use client";

import { useRouter, useSearchParams } from "next/navigation";

/**
 * Show/hide the Rejected + Withdrawn columns. Persisted via URL param.
 */
export function ClosedToggle({ showClosed }: { showClosed: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function toggle() {
    const params = new URLSearchParams(searchParams.toString());
    if (showClosed) {
      params.delete("closed");
    } else {
      params.set("closed", "1");
    }
    router.push(`/dashboard${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="text-[11px] text-light-grey hover:text-primary transition-colors"
    >
      {showClosed ? "Hide closed" : "Show closed"}
    </button>
  );
}
