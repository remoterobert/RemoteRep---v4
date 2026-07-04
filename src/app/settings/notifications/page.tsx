import Link from "next/link";
import { BellIcon } from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

export default function NotificationSettingsPage() {
  return (
    <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
      <Link
        href="/settings"
        className="text-xs text-light-grey hover:text-primary transition-colors mb-3 inline-block"
      >
        ← All settings
      </Link>
      <h1 className="text-2xl font-semibold mb-1">Notification preferences</h1>
      <p className="text-sm text-light-grey mb-6">
        Choose how you get pinged for chats, invitations, and status changes.
      </p>

      <div className="rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#101a37] p-8 text-center">
        <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <BellIcon className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Coming soon</h2>
        <p className="text-sm text-light-grey max-w-sm mx-auto mb-6">
          Notifications are being written to the database today, but you
          can&apos;t toggle per-channel preferences yet. In the meantime,
          in-app notifications are on by default.
        </p>
        <p className="text-xs text-light-grey">
          Wanted a specific control? Tell us and we&apos;ll prioritize it.
        </p>
      </div>
    </main>
  );
}
