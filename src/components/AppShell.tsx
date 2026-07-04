import Image from "next/image";
import Link from "next/link";
import {
  HomeIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ShareIcon,
  LifebuoyIcon,
  ClipboardDocumentListIcon,
  BuildingOffice2Icon,
  BellIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";

type NavItem = {
  name: string;
  href: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  newTab?: boolean;
};

// Client/hiring navigation — mirrors v3's clientNavigation
const clientNavigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Hiring Center", href: "#", icon: BuildingOfficeIcon },
  { name: "Browse talent", href: "/candidates", icon: UserGroupIcon },
  { name: "Chats", href: "/chats", icon: ChatBubbleLeftRightIcon },
  { name: "Affiliates", href: "#", icon: ShareIcon },
  { name: "Support", href: "#", icon: LifebuoyIcon, newTab: true },
];

// Talent/candidate navigation — mirrors v3's talentNavigation
const talentNavigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Opportunities", href: "/opportunities", icon: ClipboardDocumentListIcon },
  { name: "Browse clients", href: "#", icon: BuildingOffice2Icon },
  { name: "Chats", href: "/chats", icon: ChatBubbleLeftRightIcon },
  { name: "Affiliates", href: "#", icon: ShareIcon },
  { name: "Support", href: "#", icon: LifebuoyIcon, newTab: true },
];

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
  const navigation = isHiring ? clientNavigation : talentNavigation;

  // Check platform admin — controls the extra "Admin" sidebar entry.
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

  const displayName =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : user.email;

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background">
      {/* === Left sidebar (desktop) === */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-[216px] lg:flex-col lg:shadow-xl">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-side-menu px-4">
          <div className="flex h-16 shrink-0 items-center">
            <Image
              src="/v3-white-logo.svg"
              alt="RemoteRep"
              width={32}
              height={32}
              priority
            />
            <h5 className="text-white font-black text-lg pl-3">
              RemoteRep.com
            </h5>
          </div>

          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        target={item.newTab ? "_blank" : undefined}
                        className="text-white hover:bg-primary-blue group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold transition-colors"
                      >
                        <item.icon
                          className="h-6 w-6 shrink-0"
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                  {isPlatformAdmin && (
                    <li>
                      <Link
                        href="/admin"
                        className="text-secondary hover:bg-primary-blue group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold transition-colors border-t border-white/10 mt-2 pt-4"
                      >
                        <ShieldCheckIcon
                          className="h-6 w-6 shrink-0"
                          aria-hidden="true"
                        />
                        Admin
                      </Link>
                    </li>
                  )}
                </ul>
              </li>

              {/* Bottom: tenant name (placeholder for "Dark Theme" toggle from v3) */}
              <li className="mt-auto mb-6 text-white">
                <p className="text-xs text-light-grey px-3">Tenant</p>
                <p className="text-sm font-semibold px-3 truncate">
                  {m.tenants.name}
                </p>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* === Top bar (desktop) === */}
      <header className="hidden lg:fixed lg:inset-x-0 lg:z-30 lg:flex lg:pl-[216px] h-[72px] lg:flex-col">
        <div className="flex grow flex-col gap-x-5 overflow-x-auto bg-white/85 dark:bg-[#0b1220]/85 backdrop-blur-md border-b border-zinc-200 dark:border-white/[0.06] px-4">
          <div className="flex items-center justify-end gap-x-6 px-4 py-4 sm:px-6 h-full">
            <button
              type="button"
              className="-m-1.5 flex items-center p-2.5"
              aria-label="Notifications"
            >
              <BellIcon className="h-6 w-6 text-dark-foreground dark:text-white" />
            </button>

            <form action={logout} className="contents">
              <button
                type="submit"
                className="flex items-center gap-2 -m-1.5 p-1.5 hover:opacity-80 transition-opacity"
                aria-label="Sign out"
              >
                <div className="h-8 w-8 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center">
                  {(profile?.first_name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
                </div>
                <span className="text-sm text-dark-foreground dark:text-white hidden sm:inline">
                  {displayName}
                </span>
                <ChevronDownIcon className="h-4 w-4 text-dark-foreground dark:text-white" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* === Mobile top bar === */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between gap-x-6 bg-side-menu px-4 py-4 shadow-sm sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/v3-white-logo.svg"
            alt="RemoteRep"
            width={28}
            height={28}
            priority
          />
          <span className="text-white font-semibold">RemoteRep</span>
        </Link>

        <form action={logout} className="contents">
          <button
            type="submit"
            className="h-8 w-8 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center"
            aria-label="Sign out"
          >
            {(profile?.first_name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
          </button>
        </form>
      </header>

      {/* === Main content === */}
      <main className="lg:pl-[216px] lg:pt-[72px]">{children}</main>
    </div>
  );
}

/**
 * Minimal layout for guest (unauthenticated) and onboarding pages —
 * no sidebar, just a slim top bar with logo + sign-in / sign-up.
 */
function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-dark-background">
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
            <span className="font-semibold text-dark-foreground dark:text-white">
              RemoteRep
            </span>
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/login"
              className="text-light-grey hover:text-primary dark:hover:text-white transition-colors"
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
