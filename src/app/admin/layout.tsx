import { redirect } from "next/navigation";
import { isPlatformAdmin } from "@/lib/is-platform-admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ok = await isPlatformAdmin();
  if (!ok) {
    redirect("/dashboard");
  }

  // Admin section navigation now lives in the app's main sidebar (see
  // buildAdminNav in Sidebar.tsx) so there's no per-page sub-nav here.
  // Layout is a thin wrapper that ensures only platform admins reach
  // /admin/* and gives child pages the full width to work with.
  return <div className="w-full">{children}</div>;
}
