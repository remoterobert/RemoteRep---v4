import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateNotificationChannels } from "./actions";

export const dynamic = "force-dynamic";

const KINDS = [
  {
    key: "chat",
    label: "Chat messages",
    description: "New messages in a conversation you're part of.",
  },
  {
    key: "client_application",
    label: "Invitations",
    description:
      "A hiring company invites you to apply or reaches out directly.",
  },
  {
    key: "talent_application",
    label: "Candidate responses",
    description:
      "A rep accepts or declines an invitation you sent, or applies to your listing.",
  },
  {
    key: "listing_update",
    label: "Listing updates",
    description: "Status changes on listings you're watching.",
  },
  {
    key: "system",
    label: "Platform announcements",
    description: "Occasional news from RemoteRep. Rare.",
  },
] as const;

type Pref = {
  kind: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
};

type SearchParams = Promise<{ saved?: string; error?: string }>;

export default async function NotificationSettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const { data: prefRows } = await supabase
    .from("notification_channels")
    .select("kind, in_app_enabled, email_enabled, push_enabled")
    .eq("user_id", user.id);
  const byKind = new Map<string, Pref>(
    ((prefRows ?? []) as Pref[]).map((r) => [r.kind, r]),
  );

  function getPref(kind: string): Pref {
    return (
      byKind.get(kind) ?? {
        kind,
        in_app_enabled: true,
        email_enabled: true,
        push_enabled: true,
      }
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full">
      <Link
        href="/settings"
        className="text-xs text-light-grey hover:text-primary transition-colors mb-3 inline-block"
      >
        ← All settings
      </Link>
      <h1 className="text-2xl font-semibold mb-1">Notification preferences</h1>
      <p className="text-sm text-light-grey mb-6">
        Choose how you get pinged. Push notifications are coming soon.
      </p>

      {params.saved && (
        <div className="mb-4 rounded border border-success/40 bg-success/5 p-3 text-sm text-success">
          Preferences saved.
        </div>
      )}
      {params.error && (
        <div className="mb-4 rounded border border-danger/40 bg-danger/5 p-3 text-sm text-danger">
          {params.error}
        </div>
      )}

      <form action={updateNotificationChannels}>
        <div className="rounded-2xl border border-border bg-surface-2 overflow-hidden">
          <div className="grid grid-cols-[1fr_60px_60px_60px] gap-2 px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-light-grey border-b border-border">
            <div>Type</div>
            <div className="text-center">In-app</div>
            <div className="text-center">Email</div>
            <div className="text-center">Push</div>
          </div>
          {KINDS.map((k) => {
            const pref = getPref(k.key);
            return (
              <div
                key={k.key}
                className="grid grid-cols-[1fr_60px_60px_60px] gap-2 px-4 py-3 border-b border-border last:border-b-0 items-center"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium">{k.label}</div>
                  <div className="text-[11px] text-light-grey">
                    {k.description}
                  </div>
                </div>
                <ToggleCell
                  name={`${k.key}:in_app_enabled`}
                  defaultChecked={pref.in_app_enabled}
                />
                <ToggleCell
                  name={`${k.key}:email_enabled`}
                  defaultChecked={pref.email_enabled}
                />
                <ToggleCell
                  name={`${k.key}:push_enabled`}
                  defaultChecked={pref.push_enabled}
                  disabled
                />
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="rounded bg-primary text-white px-5 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Save preferences
          </button>
        </div>
      </form>

      <p className="text-[11px] text-light-grey mt-6 leading-relaxed">
        Email delivery uses Resend. If you don&apos;t see a message, check your
        spam folder. Email is off until the sending domain is verified.
      </p>
    </main>
  );
}

function ToggleCell({
  name,
  defaultChecked,
  disabled,
}: {
  name: string;
  defaultChecked: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex justify-center">
      <input
        type="checkbox"
        name={name}
        value="1"
        defaultChecked={!disabled && defaultChecked}
        disabled={disabled}
        className="h-4 w-4 rounded border-border accent-primary disabled:opacity-30 disabled:cursor-not-allowed"
      />
    </div>
  );
}
