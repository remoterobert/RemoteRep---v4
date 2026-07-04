import Link from "next/link";
import { redirect } from "next/navigation";
import {
  UserCircleIcon,
  BuildingOffice2Icon,
  BellIcon,
  CreditCardIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("tenant_members")
    .select("role, tenants!inner(type)")
    .eq("user_id", user.id)
    .eq("status", "active");

  type M = { role: string; tenants: { type: string } };
  const rows = (memberships ?? []) as unknown as M[];
  const isHiring = rows.some(
    (m) => m.tenants.type === "client_company" || m.tenants.type === "agency",
  );

  return (
    <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Account settings</h1>
        <p className="text-sm text-light-grey">
          Manage your account, profile, and preferences.
        </p>
      </header>

      <div className="grid gap-3">
        <SettingsCard
          href={isHiring ? "/company/edit" : "/profile/edit"}
          icon={
            isHiring ? (
              <BuildingOffice2Icon className="h-5 w-5" />
            ) : (
              <UserCircleIcon className="h-5 w-5" />
            )
          }
          title={isHiring ? "Company profile" : "Your profile"}
          description={
            isHiring
              ? "Company name, about, hiring pitch, industry, website"
              : "Headline, about, sales background, specialties, visibility"
          }
          status="Live"
        />
        <SettingsCard
          href="/settings/notifications"
          icon={<BellIcon className="h-5 w-5" />}
          title="Notification preferences"
          description="Email + in-app + push notifications by category"
          status="Coming soon"
        />
        <SettingsCard
          href="/settings/billing"
          icon={<CreditCardIcon className="h-5 w-5" />}
          title="Billing"
          description="Subscription, invoices, payment methods"
          status="Coming soon"
        />
        <SettingsCard
          href="#"
          icon={<KeyIcon className="h-5 w-5" />}
          title="Password & security"
          description="Change password, sessions, 2FA"
          status="Coming soon"
        />
      </div>
    </main>
  );
}

function SettingsCard({
  href,
  icon,
  title,
  description,
  status,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  status: "Live" | "Coming soon";
}) {
  const isLive = status === "Live";
  const inner = (
    <div
      className={`rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#101a37] p-4 flex items-start gap-4 transition-colors ${isLive ? "hover:border-primary/40 cursor-pointer" : ""}`}
    >
      <div
        className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
          isLive
            ? "bg-primary/10 text-primary"
            : "bg-zinc-100 dark:bg-white/[0.06] text-light-grey"
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <h2 className="font-semibold text-sm">{title}</h2>
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
              isLive
                ? "bg-interviewing/10 text-interviewing"
                : "bg-zinc-200 dark:bg-white/10 text-light-grey"
            }`}
          >
            {status}
          </span>
        </div>
        <p className="text-xs text-light-grey">{description}</p>
      </div>
    </div>
  );
  if (isLive) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}
