import { ArrowLeftOnRectangleIcon } from "@heroicons/react/24/outline";
import { stopImpersonation } from "@/app/admin/users/actions";

/**
 * Shown across every page when the current session was started by
 * admin impersonation. Includes an inline server-action form to
 * end the impersonation and return to the admin account.
 */
export function ImpersonationBanner({
  targetEmail,
  originalEmail,
}: {
  targetEmail: string;
  originalEmail: string;
}) {
  return (
    <div className="sticky top-0 z-40 bg-warning text-black text-sm">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold">Impersonating:</span>
          <span className="truncate">{targetEmail}</span>
          <span className="text-black/70 hidden sm:inline">
            · admin session: {originalEmail}
          </span>
        </div>
        <form action={stopImpersonation}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-full bg-black text-white px-3 py-1 text-xs font-semibold hover:opacity-80 transition-opacity"
          >
            <ArrowLeftOnRectangleIcon className="h-3.5 w-3.5" />
            Return to admin account
          </button>
        </form>
      </div>
    </div>
  );
}
