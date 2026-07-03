import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ saved?: string }>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const justSaved = params.saved === "1";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check for tenant memberships. If none, send to onboarding.
  const { data: memberships } = await supabase
    .from("tenant_members")
    .select("tenant_id, role, status, tenants!inner(id, name, type, slug)")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (!memberships || memberships.length === 0) {
    redirect("/onboarding/choose-role");
  }

  type Membership = {
    tenant_id: string;
    role: string;
    tenants: { id: string; name: string; type: string; slug: string };
  };
  const m = memberships[0] as unknown as Membership;

  const isHiring =
    m.tenants.type === "client_company" || m.tenants.type === "agency";

  // Fetch user profile + hiring intents (for hiring) or specialties (for candidate)
  const { data: profile } = await supabase
    .from("users")
    .select("first_name, last_name, status, created_at")
    .eq("id", user.id)
    .single();

  const { data: intents } = isHiring
    ? await supabase
        .from("tenant_hiring_intents")
        .select("sales_role")
        .eq("tenant_id", m.tenant_id)
        .eq("status", "active")
    : { data: null };

  const { data: specialties } = !isHiring
    ? await supabase
        .from("candidate_specialties")
        .select("sales_role")
        .eq("user_id", user.id)
    : { data: null };

  return (
    <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
      <h1 className="text-2xl font-semibold mb-1">
        Welcome{profile?.first_name ? `, ${profile.first_name}` : ""}.
      </h1>
      <p className="text-sm text-zinc-500 mb-6">
        {m.tenants.name} · {m.role.replace("_", " ")}
      </p>

      {isHiring ? (
        <section className="mb-6 rounded border border-zinc-200 dark:border-zinc-800 p-4">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Your hiring
          </h2>
          <p className="text-sm mb-3">
            You&apos;re currently hiring for:{" "}
            {intents && intents.length > 0 ? (
              intents.map((i, idx) => (
                <span key={i.sales_role}>
                  <strong>{i.sales_role}</strong>
                  {idx < intents.length - 1 ? ", " : ""}
                </span>
              ))
            ) : (
              <em className="text-zinc-500">(none set)</em>
            )}
          </p>
          <Link
            href="/candidates"
            className="inline-block rounded bg-primary text-white px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Browse candidates →
          </Link>
        </section>
      ) : (
        <>
          {justSaved && (
            <div
              role="status"
              className="mb-4 rounded border border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-900 p-3 text-sm text-green-800 dark:text-green-200"
            >
              ✅ Profile saved.
            </div>
          )}
          <section className="mb-6 rounded border border-zinc-200 dark:border-zinc-800 p-4">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Your profile
            </h2>
            <p className="text-sm mb-3">
              Roles you&apos;re qualified for:{" "}
              {specialties && specialties.length > 0 ? (
                specialties.map((s, idx) => (
                  <span key={s.sales_role}>
                    <strong>{s.sales_role}</strong>
                    {idx < specialties.length - 1 ? ", " : ""}
                  </span>
                ))
              ) : (
                <em className="text-zinc-500">(none set)</em>
              )}
            </p>
            <Link
              href="/profile/edit"
              className="inline-block rounded bg-primary text-white px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Edit profile →
            </Link>
          </section>
          <p className="text-xs text-amber-700 dark:text-amber-400 italic">
            🚧 Browse opportunities coming in Phase 3 (listings).
          </p>
        </>
      )}

      <p className="text-xs text-zinc-400 mt-8">
        Account status:{" "}
        <span className="font-mono">{profile?.status ?? "unknown"}</span>
      </p>
    </main>
  );
}
