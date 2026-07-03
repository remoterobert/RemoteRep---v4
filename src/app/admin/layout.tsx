import Link from "next/link";
import { redirect } from "next/navigation";
import {
  HomeIcon,
  UsersIcon,
  BuildingOffice2Icon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { isPlatformAdmin } from "@/lib/is-platform-admin";

export const dynamic = "force-dynamic";

const adminNav = [
  { name: "Overview", href: "/admin", icon: HomeIcon },
  { name: "Users", href: "/admin/users", icon: UsersIcon },
  { name: "Tenants", href: "/admin/tenants", icon: BuildingOffice2Icon },
  { name: "Events", href: "/admin/events", icon: ClipboardDocumentListIcon },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ok = await isPlatformAdmin();
  if (!ok) {
    redirect("/dashboard");
  }

  return (
    <div className="p-6 max-w-6xl mx-auto w-full">
      <div className="mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl font-semibold mb-1">Admin</h1>
        <p className="text-xs text-light-grey">
          Platform-wide view. You&apos;re seeing cross-tenant data via
          platform_admin role.
        </p>
      </div>

      <div className="grid grid-cols-[max-content_1fr] gap-8">
        <nav className="min-w-[160px]">
          <ul className="space-y-1">
            {adminNav.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="flex items-center gap-2 rounded px-3 py-2 text-sm text-dark-foreground dark:text-white hover:bg-primary/10"
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
