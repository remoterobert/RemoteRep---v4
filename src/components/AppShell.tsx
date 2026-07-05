import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppShellClient } from "@/components/AppShellClient";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { readImpersonationMarker } from "@/lib/impersonation";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not signed in → render children with a minimal top nav
  if (!user) {
    return <GuestLayout>{children}</GuestLayout>;
  }

  // Signed in → fetch tenant membership to pick nav set
  const { data: memberships } = await supabase
    .from("tenant_members")
    .select("tenant_id, role, tenants!inner(name, type)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1);

  type Membership = {
    tenant_id: string;
    role: string;
    tenants: { name: string; type: string };
  };
  const m = memberships?.[0] as unknown as Membership | undefined;

  // No tenant yet → just render the page (e.g., onboarding)
  if (!m) {
    return <GuestLayout>{children}</GuestLayout>;
  }

  const isHiring =
    m.tenants.type === "client_company" || m.tenants.type === "agency";

  // Platform admin?
  const { data: adminMembership } = await supabase
    .from("tenant_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "platform_admin")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  const isPlatformAdmin = !!adminMembership;

  const { data: profile } = await supabase
    .from("users")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();

  const displayName: string =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : (user.email ?? "");
  const initials = (
    profile?.first_name?.[0] ??
    user.email?.[0] ??
    "?"
  ).toUpperCase();

  // Unread chats — for the nav badge
  const { data: parts } = await supabase
    .from("chat_participants")
    .select("chat_id, last_read_at")
    .eq("user_id", user.id);
  type PartRow = { chat_id: string; last_read_at: string | null };
  const partRows = (parts ?? []) as PartRow[];
  let unreadChats = 0;
  if (partRows.length > 0) {
    const chatIds = partRows.map((p) => p.chat_id);
    const { data: latest } = await supabase
      .from("messages")
      .select("chat_id, created_at")
      .in("chat_id", chatIds)
      .order("created_at", { ascending: false })
      .limit(200);
    type MsgRow = { chat_id: string; created_at: string };
    const latestByChat = new Map<string, string>();
    for (const msg of (latest ?? []) as MsgRow[]) {
      if (!latestByChat.has(msg.chat_id))
        latestByChat.set(msg.chat_id, msg.created_at);
    }
    for (const p of partRows) {
      const last = latestByChat.get(p.chat_id);
      if (!last) continue;
      if (!p.last_read_at || new Date(last) > new Date(p.last_read_at)) {
        unreadChats += 1;
      }
    }
  }

  // Impersonation banner (if the admin flipped session via /admin/users)
  const marker = await readImpersonationMarker();

  return (
    <AppShellClient
      tenantName={m.tenants.name}
      isHiring={isHiring}
      isPlatformAdmin={isPlatformAdmin}
      displayName={displayName}
      email={user.email ?? ""}
      initials={initials}
      unreadChats={unreadChats}
    >
      {marker && (
        <ImpersonationBanner
          targetEmail={marker.target_email}
          originalEmail={marker.original_email}
        />
      )}
      {children}
    </AppShellClient>
  );
}

/**
 * Minimal layout for guest (unauthenticated) and onboarding pages —
 * no sidebar, just a slim top bar with logo + sign-in / sign-up.
 */
function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-border bg-surface">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/v3-logo.svg"
              alt="RemoteRep"
              width={28}
              height={32}
              className="dark:hidden"
              priority
            />
            <Image
              src="/v3-white-logo.svg"
              alt="RemoteRep"
              width={28}
              height={32}
              className="hidden dark:block"
              priority
            />
            <span className="font-semibold">RemoteRep</span>
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/login"
              className="text-light-grey hover:text-primary transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded bg-primary text-white px-4 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
