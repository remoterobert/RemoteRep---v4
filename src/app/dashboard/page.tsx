import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt + suspenders: proxy also redirects unauth'd users, but check here too.
  if (!user) {
    redirect("/login");
  }

  // Fetch the matching public.users row (auto-created on signup via trigger).
  const { data: profile } = await supabase
    .from("users")
    .select("id, email, display_name, status, created_at")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <section className="mb-6 rounded border border-zinc-200 dark:border-zinc-800 p-4">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Signed in
        </h2>
        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-zinc-500">Email</dt>
          <dd>{user.email}</dd>
          <dt className="text-zinc-500">User ID</dt>
          <dd className="font-mono text-xs break-all">{user.id}</dd>
          <dt className="text-zinc-500">Email confirmed</dt>
          <dd>{user.email_confirmed_at ? "✅ Yes" : "❌ Not yet"}</dd>
        </dl>
      </section>

      <section className="mb-6 rounded border border-zinc-200 dark:border-zinc-800 p-4">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          public.users row (auto-created by trigger)
        </h2>
        {profile ? (
          <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-zinc-500">Email</dt>
            <dd>{profile.email}</dd>
            <dt className="text-zinc-500">Display name</dt>
            <dd>{profile.display_name ?? "(not set)"}</dd>
            <dt className="text-zinc-500">Status</dt>
            <dd>
              <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5">
                {profile.status}
              </span>
            </dd>
            <dt className="text-zinc-500">Created</dt>
            <dd>{new Date(profile.created_at).toLocaleString()}</dd>
          </dl>
        ) : (
          <p className="text-sm text-red-600">
            ⚠️ No matching row in public.users — trigger may have failed.
          </p>
        )}
      </section>

      <p className="text-xs text-zinc-400">
        This is the Phase 1c dashboard. No tenant, no role, no real features
        yet. Phase 1d adds role selection and tenant creation.
      </p>
    </main>
  );
}
