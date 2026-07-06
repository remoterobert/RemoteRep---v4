import Link from "next/link";
import { redirect } from "next/navigation";
import {
  KeyIcon,
  ComputerDesktopIcon,
  PauseCircleIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  changePassword,
  signOutOtherSessions,
  deactivateAccount,
  reactivateAccount,
  deleteAccount,
} from "./actions";
import { DeleteAccountForm } from "./DeleteAccountForm";

export const dynamic = "force-dynamic";

const OK_MESSAGES: Record<string, string> = {
  password: "Password updated.",
  sessions: "Other sessions signed out.",
  deactivated:
    "Account deactivated. You can reactivate any time from this page.",
  reactivated: "Account reactivated.",
};

type SearchParams = Promise<{ saved?: string; error?: string }>;

export default async function SecurityPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Read archived/status + super-admin flag via service role — user's own
  // row via RLS also works, but admin client keeps this consistent with
  // the delete/deactivate paths that already use it.
  const admin = createAdminClient();
  const { data: userRow } = await admin
    .from("users")
    .select("archived_at, is_super_admin, email, last_seen_at")
    .eq("id", user.id)
    .maybeSingle();

  const isArchived = !!userRow?.archived_at;
  const isSuperAdmin = !!userRow?.is_super_admin;

  return (
    <main className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full">
      <Link
        href="/settings"
        className="text-xs text-light-grey hover:text-primary transition-colors mb-3 inline-block"
      >
        ← All settings
      </Link>
      <h1 className="text-2xl font-semibold mb-1">Password &amp; security</h1>
      <p className="text-sm text-light-grey mb-6">
        Change your password, sign out of other devices, or manage your
        account.
      </p>

      {params.saved && OK_MESSAGES[params.saved] && (
        <div className="mb-4 rounded border border-success/40 bg-success/5 p-3 text-sm text-success">
          {OK_MESSAGES[params.saved]}
        </div>
      )}
      {params.error && (
        <div className="mb-4 rounded border border-danger/40 bg-danger/5 p-3 text-sm text-danger">
          {params.error}
        </div>
      )}

      {isArchived && (
        <div className="mb-6 rounded-xl border border-warning/40 bg-warning/5 p-4 text-sm">
          Your account is currently <b>deactivated</b>. You can still sign in
          and manage settings, but you won&apos;t appear on browse pages.
        </div>
      )}

      {/* ============ Password ============ */}
      <Section
        icon={<KeyIcon className="h-5 w-5" />}
        title="Change password"
        subtitle="Requires your current password."
      >
        <form action={changePassword} className="space-y-3">
          <PasswordField
            id="current_password"
            label="Current password"
            autoComplete="current-password"
          />
          <PasswordField
            id="new_password"
            label="New password"
            autoComplete="new-password"
            hint="At least 8 characters."
          />
          <PasswordField
            id="confirm_password"
            label="Confirm new password"
            autoComplete="new-password"
          />
          <div>
            <button
              type="submit"
              className="rounded bg-primary text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Update password
            </button>
          </div>
        </form>
      </Section>

      {/* ============ Sessions ============ */}
      <Section
        icon={<ComputerDesktopIcon className="h-5 w-5" />}
        title="Signed-in devices"
        subtitle={
          userRow?.last_seen_at
            ? `You were last active on ${new Date(userRow.last_seen_at).toLocaleString()}.`
            : "Sign out anywhere else you might be logged in."
        }
      >
        <form action={signOutOtherSessions}>
          <button
            type="submit"
            className="rounded border border-border px-4 py-2 text-sm font-medium hover:bg-surface-3 transition-colors"
          >
            Sign out all other sessions
          </button>
          <p className="text-[11px] text-light-grey mt-2">
            This device stays signed in. Any other device with an active
            session will be logged out.
          </p>
        </form>
      </Section>

      {/* ============ Deactivate / reactivate ============ */}
      <Section
        icon={
          isArchived ? (
            <PlayCircleIcon className="h-5 w-5 text-success" />
          ) : (
            <PauseCircleIcon className="h-5 w-5 text-warning" />
          )
        }
        title={isArchived ? "Reactivate account" : "Pause account"}
        subtitle={
          isArchived
            ? "Bring your account back. Your profile goes back to whatever visibility it had before."
            : "Hides you from browse pages without deleting anything. You can reactivate any time. Nothing is lost."
        }
      >
        {isSuperAdmin ? (
          <p className="text-xs text-light-grey italic">
            Super Admin accounts can&apos;t be paused from the UI.
          </p>
        ) : isArchived ? (
          <form action={reactivateAccount}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded bg-success text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <PlayCircleIcon className="h-4 w-4" />
              Reactivate my account
            </button>
          </form>
        ) : (
          <form action={deactivateAccount}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded border border-warning/40 text-warning px-4 py-2 text-sm font-semibold hover:bg-warning/5 transition-colors"
            >
              <PauseCircleIcon className="h-4 w-4" />
              Pause my account
            </button>
          </form>
        )}
      </Section>

      {/* ============ Danger zone: delete ============ */}
      <div className="mt-8 rounded-2xl border border-danger/30 bg-danger/[0.02] p-4 md:p-5">
        <h2 className="text-sm font-semibold mb-1 text-danger">Danger zone</h2>
        <p className="text-xs text-light-grey mb-4">
          Permanently delete your account and everything associated with it.
          This is not reversible.
        </p>
        <DeleteAccountForm action={deleteAccount} disabled={isSuperAdmin} />
      </div>
    </main>
  );
}

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 rounded-2xl border border-border bg-surface-2 p-4 md:p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          {subtitle && (
            <p className="text-xs text-light-grey leading-snug mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function PasswordField({
  id,
  label,
  autoComplete,
  hint,
}: {
  id: string;
  label: string;
  autoComplete: string;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-light-grey mb-1">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="password"
        required
        autoComplete={autoComplete}
        minLength={id === "new_password" ? 8 : undefined}
        className="w-full rounded border border-border bg-surface-3 px-3 py-2 text-sm"
      />
      {hint && <p className="text-[11px] text-light-grey mt-1">{hint}</p>}
    </div>
  );
}
